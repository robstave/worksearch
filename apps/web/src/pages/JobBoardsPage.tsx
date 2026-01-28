import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { jobBoardsApi } from '../api';
import type { JobBoard } from '../api';
import { LoadingScreen } from '@/components/ui/spinner';

export function JobBoardsPage() {
  const navigate = useNavigate();
  const [jobBoards, setJobBoards] = useState<JobBoard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortField, setSortField] = useState<'name' | 'updatedAt'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const loadJobBoards = async () => {
    try {
      const res = await jobBoardsApi.list({ sort: sortField, order: sortOrder });
      setJobBoards(res.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load job boards');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobBoards();
  }, [sortField, sortOrder]);

  if (loading) {
    return <LoadingScreen message="Loading job boards..." />;
  }

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder(field === 'name' ? 'asc' : 'desc');
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
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Job Boards</h1>
        <Link
          to="/job-boards/new"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
        >
          + Add Job Board
        </Link>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-900/50 border border-red-500 rounded text-red-400">
          {error}
        </div>
      )}

      {jobBoards.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p>No job boards saved yet.</p>
          <Link to="/job-boards/new" className="mt-2 text-blue-400 hover:underline">
            Add your first job board
          </Link>
        </div>
      ) : (
        <div className="bg-gray-800 rounded-lg overflow-hidden">
          <table className="w-full table-fixed">
            <thead className="bg-gray-700">
              <tr>
                <SortHeader field="name" className="w-1/4">Name</SortHeader>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-300 w-1/2">Link</th>
                <SortHeader field="updatedAt" className="w-1/4">Updated</SortHeader>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {jobBoards.map((jb) => (
                <tr
                  key={jb.id}
                  onClick={() => navigate(`/job-boards/${jb.id}`)}
                  className="hover:bg-gray-700 cursor-pointer"
                >
                  <td className="px-4 py-3 text-left text-white font-medium">{jb.name}</td>
                  <td className="px-4 py-3 text-left text-gray-300 truncate">
                    {jb.link ? (
                      <a
                        href={jb.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-blue-400 hover:underline"
                      >
                        {jb.link}
                      </a>
                    ) : (
                      <span className="text-gray-500">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-left text-gray-400 text-sm">
                    {new Date(jb.updatedAt).toLocaleDateString()}
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
