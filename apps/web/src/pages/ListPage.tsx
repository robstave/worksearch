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
  OFFER: 'bg-emerald-500',
  ACCEPTED: 'bg-teal-500',
  DECLINED: 'bg-orange-500',
  REJECTED: 'bg-red-500',
  GHOSTED: 'bg-gray-500',
  TRASH: 'bg-gray-700',
};

export function ListPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [applications, setApplications] = useState<Application[]>([]);
  const [stats, setStats] = useState<{ applied: number; interviewed: number; passedOn: number } | null>(null);
  const [timeline, setTimeline] = useState<Array<{ date: string; count: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [stateFilter, setStateFilter] = useState<AppState | ''>('');
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
          sort: sortField,
          order: sortOrder,
          page,
          limit,
        }),
        applicationsApi.getStats(),
        applicationsApi.getTimeline(30),
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
  }, [search, stateFilter, sortField, sortOrder]);

  useEffect(() => {
    loadApplications();
  }, [search, stateFilter, sortField, sortOrder, page]);

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
          <div className="text-sm text-gray-400 mb-3">Applications Applied (Last 30 Days)</div>
          <div className="flex items-end gap-1" style={{ height: '64px' }}>
            {timeline.map((day) => {
              const maxCount = Math.max(...timeline.map(d => d.count), 1);
              const heightPx = day.count > 0 ? Math.max((day.count / maxCount) * 64, 8) : 2;
              const date = new Date(day.date);
              const isToday = new Date().toISOString().split('T')[0] === day.date;
              return (
                <div
                  key={day.date}
                  className="flex-1 flex items-end group relative"
                  style={{ height: '64px' }}
                >
                  <div
                    className={`w-full rounded-t transition-all ${
                      day.count > 0 ? 'bg-blue-500 hover:bg-blue-400' : 'bg-gray-700'
                    } ${isToday ? 'ring-2 ring-blue-300' : ''}`}
                    style={{ height: `${heightPx}px` }}
                  />
                  {/* Tooltip */}
                  <div className="absolute bottom-full mb-2 hidden group-hover:block bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                    {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}: {day.count} app{day.count !== 1 ? 's' : ''}
                  </div>
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
        <div className="bg-gray-800 rounded-lg overflow-hidden">
          <table className="w-full table-fixed">
            <thead className="bg-gray-700">
              <tr>
                <SortHeader field="company" className="w-1/6">Company</SortHeader>
                <SortHeader field="jobTitle" className="w-2/6">Job Title</SortHeader>
                <SortHeader field="workLocation" className="w-1/12">Location</SortHeader>
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
                  <td className="px-4 py-3 text-left text-white font-medium">{app.company.name}</td>
                  <td className="px-4 py-3 text-left text-gray-300">{app.jobTitle}</td>
                  <td className="px-4 py-3 text-left">
                    {app.workLocation ? (
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium text-white bg-gray-600">
                        {app.workLocation}
                      </span>
                    ) : (
                      <span className="text-gray-500 text-sm">—</span>
                    )}
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
