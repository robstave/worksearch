import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { companiesApi } from '../api';
import type { Company } from '../api';
import { LoadingScreen } from '@/components/ui/spinner';

export function CompaniesPage() {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newWebsite, setNewWebsite] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [sortField, setSortField] = useState<'name' | 'applicationCount' | 'createdAt'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const limit = 20;

  const loadCompanies = async () => {
    try {
      const res = await companiesApi.list({ sort: sortField, order: sortOrder, page, limit });
      setCompanies(res.items);
      setTotalPages(res.totalPages);
      setTotal(res.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load companies');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
  }, [sortField, sortOrder]);

  useEffect(() => {
    loadCompanies();
  }, [page, sortField, sortOrder]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    // Auto-prefix https:// if user enters a URL without protocol
    let website = newWebsite.trim();
    if (website && !website.startsWith('http://') && !website.startsWith('https://')) {
      website = 'https://' + website;
    }

    try {
      const company = await companiesApi.create({
        name: newName.trim(),
        website: website || undefined,
      });
      setCompanies((prev) => [...prev, { ...company, tags: [], applicationCount: 0, updatedAt: company.createdAt }]);
      setShowAddModal(false);
      setNewName('');
      setNewWebsite('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create company');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this company? This will also delete all applications for this company.')) return;

    try {
      await companiesApi.delete(id);
      setCompanies((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete company');
    }
  };

  if (loading) {
    return <LoadingScreen message="Loading companies..." />;
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
        <h1 className="text-2xl font-bold text-white">Companies</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
        >
          + Add Company
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-900/50 border border-red-500 rounded text-red-400">
          {error}
          <button onClick={() => setError('')} className="ml-2 underline">
            Dismiss
          </button>
        </div>
      )}

      {companies.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p>No companies yet.</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="mt-2 text-blue-400 hover:underline"
          >
            Add your first company
          </button>
        </div>
      ) : (
        <div className="bg-gray-800 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-700">
              <tr>
                <SortHeader field="name">Name</SortHeader>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Website</th>
                <SortHeader field="applicationCount">Applications</SortHeader>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {companies.map((company) => (
                <tr key={company.id} className="hover:bg-gray-750">
                  <td className="px-4 py-3 text-white font-medium">{company.name}</td>
                  <td className="px-4 py-3">
                    {company.website ? (
                      <a
                        href={company.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:underline text-sm"
                      >
                        {company.website}
                      </a>
                    ) : (
                      <span className="text-gray-500">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/applications/list?search=${encodeURIComponent(company.name)}`);
                      }}
                      className="text-blue-400 hover:text-blue-300 hover:underline"
                    >
                      {company.applicationCount}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex gap-3 justify-end">
                      <button
                        onClick={() => navigate('/applications/new', { state: { companyId: company.id, companyName: company.name } })}
                        className="text-blue-400 hover:text-blue-300 text-sm"
                      >
                        Apply
                      </button>
                      <button
                        onClick={() => handleDelete(company.id)}
                        className="text-red-400 hover:text-red-300 text-sm"
                      >
                        Delete
                      </button>
                    </div>
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
            Showing {(page - 1) * limit + 1} - {Math.min(page * limit, total)} of {total} companies
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

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowAddModal(false)}>
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-white mb-4">Add Company</h2>
            <form onSubmit={handleAdd}>
              <div className="mb-4">
                <label className="block text-left text-sm font-medium text-gray-300 mb-1">Name</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Acme Corp"
                />
              </div>
              <div className="mb-6">
                <label className="block text-left text-sm font-medium text-gray-300 mb-1">Website (optional)</label>
                <input
                  type="text"
                  value={newWebsite}
                  onChange={(e) => setNewWebsite(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="www.example.com"
                />
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
                >
                  Add Company
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
