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
  REJECTED: 'bg-red-500',
  GHOSTED: 'bg-gray-500',
  TRASH: 'bg-gray-700',
};

export function ListPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [stateFilter, setStateFilter] = useState<AppState | ''>('');

  const loadApplications = async () => {
    try {
      const res = await applicationsApi.list({
        search: search || undefined,
        state: stateFilter || undefined,
      });
      setApplications(res.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApplications();
  }, [search, stateFilter]);

  if (loading) {
    return <LoadingScreen message="Loading applications..." />;
  }

  return (
    <div>
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
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-300 w-1/6">Company</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-300 w-2/6">Job Title</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-300 w-1/12">Location</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-300 w-1/6">State</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-300 w-1/6">Applied</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-300 w-1/6">Updated</th>
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
    </div>
  );
}
