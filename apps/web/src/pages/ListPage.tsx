import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { applicationsApi } from '../api';
import type { Application, AppState } from '../api';
import { LoadingScreen } from '@/components/ui/spinner';

const STATE_COLORS: Record<AppState, string> = {
  INTERESTED: 'bg-blue-500',
  APPLIED: 'bg-yellow-500',
  SCREENING: 'bg-purple-500',
  INTERVIEW: 'bg-green-500',
  INTERVIEW_2: 'bg-green-600',
  INTERVIEW_3: 'bg-green-700',
  OFFER: 'bg-emerald-500',
  ACCEPTED: 'bg-teal-500',
  DECLINED: 'bg-orange-500',
  REJECTED: 'bg-red-500',
  GHOSTED: 'bg-gray-500',
  TRASH: 'bg-gray-700',
};

// Compact work location badges
const WORK_LOCATION_BADGES: Record<string, { letter: string; color: string; label: string }> = {
  REMOTE: { letter: 'R', color: 'bg-cyan-600', label: 'Remote' },
  ONSITE: { letter: 'O', color: 'bg-amber-600', label: 'On-site' },
  HYBRID: { letter: 'H', color: 'bg-violet-600', label: 'Hybrid' },
  CONTRACT: { letter: 'C', color: 'bg-rose-600', label: 'Contract' },
};

const WorkLocationBadge = ({ location }: { location: string | null | undefined }) => {
  if (!location) return <span className="text-gray-500 text-sm">—</span>;
  const badge = WORK_LOCATION_BADGES[location];
  if (!badge) return <span className="text-gray-500 text-sm">—</span>;
  return (
    <span
      className={`inline-flex items-center justify-center w-6 h-6 rounded text-xs font-bold text-white ${badge.color} cursor-help`}
      title={badge.label}
    >
      {badge.letter}
    </span>
  );
};

export function ListPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [applications, setApplications] = useState<Application[]>([]);
  const [stats, setStats] = useState<{ applied: number; interviewed: number; passedOn: number } | null>(null);
  const [timeline, setTimeline] = useState<Array<{ date: string; count: number }>>([]);
  const [timelineDays, setTimelineDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [stateFilter, setStateFilter] = useState<AppState | ''>('');
  const [appliedDateFilter, setAppliedDateFilter] = useState<string>(''); // YYYY-MM-DD format
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [sortField, setSortField] = useState<'updatedAt' | 'company' | 'appliedAt' | 'jobTitle' | 'state' | 'workLocation'>('updatedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const limit = 20;

  const loadApplications = async () => {
    try {
      const [res, statsRes, timelineRes] = await Promise.all([
        applicationsApi.list({
          search: search || undefined,
          state: stateFilter || undefined,
          appliedDate: appliedDateFilter || undefined,
          sort: sortField,
          order: sortOrder,
          page,
          limit,
        }),
        applicationsApi.getStats(),
        applicationsApi.getTimeline(timelineDays),
      ]);
      setApplications(res.items);
      setTotalPages(res.totalPages);
      setTotal(res.total);
      setStats(statsRes);
      setTimeline(timelineRes.timeline);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1); // Reset to page 1 when filters or sort change
  }, [search, stateFilter, appliedDateFilter, sortField, sortOrder]);

  useEffect(() => {
    loadApplications();
  }, [search, stateFilter, appliedDateFilter, sortField, sortOrder, page, timelineDays]);

  if (loading) {
    return <LoadingScreen message="Loading applications..." />;
  }

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const SortHeader = ({ field, children, className = '' }: { field: typeof sortField; children: React.ReactNode; className?: string }) => (
    <th
      onClick={() => handleSort(field)}
      className={`px-4 py-3 text-left text-sm font-medium text-gray-300 cursor-pointer hover:bg-gray-600 select-none ${className}`}
    >
      <span className="flex items-center gap-1">
        {children}
        {sortField === field && (
          <span className="text-blue-400">{sortOrder === 'asc' ? '↑' : '↓'}</span>
        )}
      </span>
    </th>
  );

  return (
    <div>
      {/* Dashboard Stats Cards */}
      {stats && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="text-sm text-gray-400 mb-1">Applied</div>
            <div className="text-3xl font-bold text-yellow-400">{stats.applied}</div>
            <div className="text-xs text-gray-500 mt-1">Total applications submitted</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="text-sm text-gray-400 mb-1">Interviewed</div>
            <div className="text-3xl font-bold text-purple-400">{stats.interviewed}</div>
            <div className="text-xs text-gray-500 mt-1">Made it to screening+</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="text-sm text-gray-400 mb-1">Passed On</div>
            <div className="text-3xl font-bold text-red-400">{stats.passedOn}</div>
            <div className="text-xs text-gray-500 mt-1">Rejected, ghosted, or declined</div>
          </div>
        </div>
      )}

      {/* Activity Timeline */}
      {timeline.length > 0 && (
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm text-gray-400">Applications Applied (Last {timelineDays} Days)</div>
            <select
              value={timelineDays}
              onChange={(e) => setTimelineDays(Number(e.target.value))}
              className="px-2 py-1 bg-gray-700 text-white text-xs rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={30}>30 days</option>
              <option value={60}>60 days</option>
              <option value={90}>90 days</option>
              <option value={365}>1 year</option>
            </select>
          </div>
          <div className={`flex items-end ${timelineDays > 90 ? 'gap-0' : 'gap-1'}`} style={{ height: '64px' }}>
            {timeline.map((day) => {
              const maxCount = Math.max(...timeline.map(d => d.count), 1);
              const heightPx = day.count > 0 ? Math.max((day.count / maxCount) * 64, 8) : 2;
              const date = new Date(day.date);
              const isToday = new Date().toISOString().split('T')[0] === day.date;
              const isSelected = appliedDateFilter === day.date;
              return (
                <div
                  key={day.date}
                  className="flex-1 flex items-end group relative"
                  style={{ height: '64px' }}
                >
                  <div
                    onClick={() => {
                      if (day.count > 0) {
                        // Toggle filter: if already selected, clear it
                        setAppliedDateFilter(isSelected ? '' : day.date);
                      }
                    }}
                    className={`w-full rounded-t transition-all ${
                      day.count > 0 ? 'bg-blue-500 hover:bg-blue-400 cursor-pointer' : 'bg-gray-700'
                    } ${isToday ? 'ring-2 ring-blue-300' : ''} ${isSelected ? 'ring-2 ring-yellow-400' : ''}`}
                    style={{ height: `${heightPx}px` }}
                  />
                  {/* Tooltip */}
                  {day.count > 0 && (
                    <div className="absolute bottom-full mb-2 hidden group-hover:block bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10 max-w-xs">
                      <div className="font-semibold mb-1">
                        {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}: {day.count} app{day.count !== 1 ? 's' : ''}
                      </div>
                      <div className="text-left space-y-0.5">
                        {day.companies.map((company, idx) => (
                          <div key={idx} className="text-gray-300">• {company}</div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-500">
            <span>{new Date(timeline[0]?.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
            <span>Today</span>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Applications List</h1>
        <div className="flex items-center gap-4">
          <Link
            to="/applications/new"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
          >
            + Add Application
          </Link>
          <Link
            to="/applications/board"
            className="text-blue-400 hover:underline text-sm"
          >
            Switch to Board View →
          </Link>
        </div>
      </div>

      {/* Active filter indicator */}
      {appliedDateFilter && (
        <div className="mb-4 p-3 bg-blue-900/50 border border-blue-500 rounded text-blue-300 flex items-center justify-between">
          <span>
            Showing applications applied on {new Date(appliedDateFilter).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
          <button
            onClick={() => setAppliedDateFilter('')}
            className="text-blue-400 hover:text-blue-300 underline"
          >
            Clear filter
          </button>
        </div>
      )}

      <div className="flex gap-4 mb-6">
        <input
          type="text"
          placeholder="Search company or job title..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={stateFilter}
          onChange={(e) => setStateFilter(e.target.value as AppState | '')}
          className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All States</option>
          <option value="INTERESTED">Interested</option>
          <option value="APPLIED">Applied</option>
          <option value="SCREENING">Screening</option>
          <option value="INTERVIEW">Interview</option>
          <option value="OFFER">Offer</option>
          <option value="ACCEPTED">Accepted</option>
          <option value="REJECTED">Rejected</option>
          <option value="GHOSTED">Ghosted</option>
          <option value="TRASH">Trash</option>
        </select>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-900/50 border border-red-500 rounded text-red-400">
          {error}
        </div>
      )}

      {applications.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p>No applications found.</p>
          <Link to="/applications/new" className="mt-2 text-blue-400 hover:underline">
            Add your first application
          </Link>
        </div>
      ) : (
        <>
          {/* Mobile/Tablet Card Layout */}
          <div className="lg:hidden space-y-3">
            {/* Sort selector for mobile */}
            <div className="flex flex-wrap gap-2 mb-4">
              <select
                value={`${sortField}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('-') as [typeof sortField, 'asc' | 'desc'];
                  setSortField(field);
                  setSortOrder(order);
                }}
                className="px-3 py-2 bg-gray-700 text-white rounded-md text-sm border border-gray-600"
              >
                <option value="updatedAt-desc">Recently Updated</option>
                <option value="updatedAt-asc">Oldest Updated</option>
                <option value="appliedAt-desc">Recently Applied</option>
                <option value="appliedAt-asc">Oldest Applied</option>
                <option value="company-asc">Company A-Z</option>
                <option value="company-desc">Company Z-A</option>
                <option value="jobTitle-asc">Title A-Z</option>
                <option value="state-asc">State</option>
              </select>
            </div>
            
            {applications.map((app) => (
              <div
                key={app.id}
                onClick={() => navigate(`/applications/${app.id}`)}
                className="bg-gray-800 rounded-lg p-4 border border-gray-700 cursor-pointer hover:border-gray-600 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-white font-medium truncate">{app.company.name}</span>
                      <WorkLocationBadge location={app.workLocation} />
                    </div>
                    <p className="text-gray-300 text-sm mt-1 truncate">{app.jobTitle}</p>
                  </div>
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium text-white shrink-0 ${STATE_COLORS[app.currentState]}`}
                  >
                    {app.currentState}
                  </span>
                </div>
                <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-700 text-xs text-gray-400">
                  <span>Applied: {app.appliedAt ? new Date(app.appliedAt).toLocaleDateString() : '—'}</span>
                  <span>Updated: {new Date(app.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table Layout */}
          <div className="hidden lg:block bg-gray-800 rounded-lg overflow-hidden">
            <table className="w-full table-fixed">
              <thead className="bg-gray-700">
                <tr>
                  <SortHeader field="company" className="w-1/6">Company</SortHeader>
                  <SortHeader field="jobTitle" className="w-2/6">Job Title</SortHeader>
                  <SortHeader field="workLocation" className="w-12">Loc</SortHeader>
                  <SortHeader field="state" className="w-1/6">State</SortHeader>
                  <SortHeader field="appliedAt" className="w-1/6">Applied</SortHeader>
                  <SortHeader field="updatedAt" className="w-1/6">Updated</SortHeader>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {applications.map((app) => (
                  <tr
                    key={app.id}
                    onClick={() => navigate(`/applications/${app.id}`)}
                    className="hover:bg-gray-700 cursor-pointer"
                  >
                    <td className="px-4 py-3 text-left text-white font-medium truncate">{app.company.name}</td>
                    <td className="px-4 py-3 text-left text-gray-300 truncate">{app.jobTitle}</td>
                    <td className="px-4 py-3 text-left">
                      <WorkLocationBadge location={app.workLocation} />
                    </td>
                    <td className="px-4 py-3 text-left">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium text-white ${STATE_COLORS[app.currentState]}`}
                      >
                        {app.currentState}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-left text-gray-400 text-sm">
                      {app.appliedAt ? new Date(app.appliedAt).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3 text-left text-gray-400 text-sm">
                      {new Date(app.updatedAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-gray-400">
            Showing {(page - 1) * limit + 1} - {Math.min(page * limit, total)} of {total} applications
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 bg-gray-700 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600 transition-colors"
            >
              Previous
            </button>
            <span className="px-3 py-1 text-gray-300">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1 bg-gray-700 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
