import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { notesApi } from '../api';
import type { Note } from '../api';
import { LoadingScreen } from '@/components/ui/spinner';

export function ResourceNotesPage() {
  const navigate = useNavigate();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<'name' | 'updatedAt'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const loadNotes = async () => {
    try {
      const res = await notesApi.list({ search: search || undefined, sort: sortField, order: sortOrder });
      setNotes(res.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load notes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotes();
  }, [search, sortField, sortOrder]);

  if (loading) {
    return <LoadingScreen message="Loading notes..." />;
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
        <h1 className="text-2xl font-bold text-white">Notes</h1>
        <Link
          to="/resources/notes/new"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
        >
          + Add Note
        </Link>
      </div>

      <div className="mb-6">
        <input
          type="text"
          placeholder="Search notes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-900/50 border border-red-500 rounded text-red-400">
          {error}
        </div>
      )}

      {notes.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p>No notes saved yet.</p>
          <Link to="/resources/notes/new" className="mt-2 text-blue-400 hover:underline">
            Add your first note
          </Link>
        </div>
      ) : (
        <>
          {/* Mobile/Tablet Card Layout */}
          <div className="lg:hidden space-y-3">
            {/* Sort controls for mobile */}
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
                <option value="name-asc">Name A-Z</option>
                <option value="name-desc">Name Z-A</option>
                <option value="updatedAt-desc">Recently Updated</option>
                <option value="updatedAt-asc">Oldest Updated</option>
              </select>
            </div>

            {notes.map((jb) => (
              <div
                key={jb.id}
                onClick={() => navigate(`/resources/notes/${jb.id}`)}
                className="bg-gray-800 rounded-lg p-4 border border-gray-700 cursor-pointer hover:border-gray-600 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <span className="text-white font-medium block">{jb.name}</span>
                    {jb.value && (
                      <span className="text-gray-300 text-sm block truncate mt-1">{jb.value}</span>
                    )}
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-700 text-xs text-gray-400">
                  Updated: {new Date(jb.updatedAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table Layout */}
          <div className="hidden lg:block bg-gray-800 rounded-lg overflow-hidden">
            <table className="w-full table-fixed">
              <thead className="bg-gray-700">
                <tr>
                  <SortHeader field="name" className="w-1/4">Name</SortHeader>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-300 w-1/2">Value</th>
                  <SortHeader field="updatedAt" className="w-1/4">Updated</SortHeader>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {notes.map((jb) => (
                  <tr
                    key={jb.id}
                    onClick={() => navigate(`/resources/notes/${jb.id}`)}
                    className="hover:bg-gray-700 cursor-pointer"
                  >
                    <td className="px-4 py-3 text-left text-white font-medium">{jb.name}</td>
                    <td className="px-4 py-3 text-left text-gray-300 truncate">
                      {jb.value ? (
                        <span>{jb.value}</span>
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
        </>
      )}
    </div>
  );
}
