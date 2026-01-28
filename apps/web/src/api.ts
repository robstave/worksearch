const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000';

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(error.message || 'Request failed');
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json();
}

// Auth
export interface User {
  id: string;
  email: string;
  role: 'admin' | 'user';
}

export const authApi = {
  login: (email: string, password: string) =>
    request<User>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  logout: () => request<void>('/auth/logout', { method: 'POST' }),
  me: () => request<User>('/auth/me'),
};

// Companies
export interface Company {
  id: string;
  name: string;
  website: string | null;
  tags: string[];
  applicationCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CompanyDetail extends Company {
  applications: {
    id: string;
    jobTitle: string;
    currentState: AppState;
    lastTransitionAt: string | null;
  }[];
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const companiesApi = {
  list: (options?: { search?: string; tag?: string; page?: number; limit?: number }) => {
    const params = new URLSearchParams();
    if (options?.search) params.set('search', options.search);
    if (options?.tag) params.set('tag', options.tag);
    if (options?.page) params.set('page', options.page.toString());
    if (options?.limit) params.set('limit', options.limit.toString());
    const query = params.toString();
    return request<PaginatedResponse<Company>>(`/companies${query ? `?${query}` : ''}`);
  },
  get: (id: string) => request<CompanyDetail>(`/companies/${id}`),
  create: (data: { name: string; website?: string }) =>
    request<Company>('/companies', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: { name?: string; website?: string }) =>
    request<Company>(`/companies/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: string) => request<void>(`/companies/${id}`, { method: 'DELETE' }),
};

// Applications
export type AppState =
  | 'INTERESTED'
  | 'APPLIED'
  | 'SCREENING'
  | 'INTERVIEW'
  | 'OFFER'
  | 'ACCEPTED'
  | 'DECLINED'
  | 'REJECTED'
  | 'GHOSTED'
  | 'TRASH';

export type WorkLocationType = 'REMOTE' | 'ONSITE' | 'HYBRID' | 'CONTRACT';

export interface Application {
  id: string;
  company: { id: string; name: string };
  jobTitle: string;
  jobReqUrl: string | null;
  currentState: AppState;
  workLocation: WorkLocationType | null;
  tags: string[];
  lastTransitionAt: string | null;
  appliedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ApplicationDetail extends Application {
  jobDescriptionMd: string;
  transitions: {
    id: string;
    fromState: AppState | null;
    toState: AppState;
    transitionedAt: string;
    note: string | null;
  }[];
  events: {
    id: string;
    type: string;
    at: string;
    note: string | null;
  }[];
}

export const applicationsApi = {
  list: (options?: {
    state?: AppState;
    companyId?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) => {
    const params = new URLSearchParams();
    if (options?.state) params.set('state', options.state);
    if (options?.companyId) params.set('companyId', options.companyId);
    if (options?.search) params.set('search', options.search);
    if (options?.page) params.set('page', options.page.toString());
    if (options?.limit) params.set('limit', options.limit.toString());
    const query = params.toString();
    return request<PaginatedResponse<Application>>(`/applications${query ? `?${query}` : ''}`);
  },
  get: (id: string) => request<ApplicationDetail>(`/applications/${id}`),
  create: (data: {
    companyId: string;
    jobTitle: string;
    jobReqUrl?: string;
    jobDescriptionMd?: string;
    workLocation?: WorkLocationType;
    initialState?: AppState;
  }) => request<Application>('/applications', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: { jobTitle?: string; jobReqUrl?: string; jobDescriptionMd?: string; tags?: string[]; workLocation?: WorkLocationType }) =>
    request<Application>(`/applications/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  move: (id: string, toState: AppState, note?: string) =>
    request<{ applicationId: string; fromState: AppState; toState: AppState; transitionedAt: string }>(
      `/applications/${id}/move`,
      { method: 'POST', body: JSON.stringify({ toState, note }) }
    ),
  updateTransition: (applicationId: string, transitionId: string, data: { transitionedAt?: string; note?: string }) =>
    request<{ id: string; transitionedAt: string; note: string | null }>(
      `/applications/${applicationId}/transitions/${transitionId}`,
      { method: 'PATCH', body: JSON.stringify(data) }
    ),
  delete: (id: string) => request<void>(`/applications/${id}`, { method: 'DELETE' }),
  getSankeyData: () => request<{
    nodes: Array<{ name: string }>;
    links: Array<{ source: number; target: number; value: number }>;
  }>('/applications/analytics/sankey'),
  getStats: () => request<{
    applied: number;
    interviewed: number;
    passedOn: number;
  }>('/applications/analytics/stats'),
};

// Job Boards
export interface JobBoard {
  id: string;
  name: string;
  link: string | null;
  notesMd: string;
  createdAt: string;
  updatedAt: string;
}

export const jobBoardsApi = {
  list: () => request<{ items: JobBoard[] }>('/job-boards'),
  get: (id: string) => request<JobBoard>(`/job-boards/${id}`),
  create: (data: { name: string; link?: string; notesMd?: string }) =>
    request<JobBoard>('/job-boards', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: { name?: string; link?: string; notesMd?: string }) =>
    request<JobBoard>(`/job-boards/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: string) => request<void>(`/job-boards/${id}`, { method: 'DELETE' }),
};
