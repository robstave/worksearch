import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { companiesApi } from '../api';
import type { Company } from '../api';
import { LoadingScreen } from '@/components/ui/spinner';

// Icons
const PencilIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
    <path d="M2.695 14.763l-1.262 3.154a.5.5 0 00.65.65l3.155-1.262a4 4 0 001.343-.885L17.5 5.5a2.121 2.121 0 00-3-3L3.58 13.42a4 4 0 00-.885 1.343z" />
  </svg>
);

const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
    <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
  </svg>
);

const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
    <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.519.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" />
  </svg>
);

const DocumentPlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
    <path fillRule="evenodd" d="M4.5 2A1.5 1.5 0 003 3.5v13A1.5 1.5 0 004.5 18h11a1.5 1.5 0 001.5-1.5V7.621a1.5 1.5 0 00-.44-1.06l-4.12-4.122A1.5 1.5 0 0011.378 2H4.5zm4.75 6.75a.75.75 0 011.5 0v2h2a.75.75 0 010 1.5h-2v2a.75.75 0 01-1.5 0v-2h-2a.75.75 0 010-1.5h2v-2z" clipRule="evenodd" />
  </svg>
);

const StarIcon = ({ filled }: { filled: boolean }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" className="w-4 h-4">
    <path fillRule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z" clipRule="evenodd" />
  </svg>
);

const FlagIcon = ({ filled }: { filled: boolean }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" className="w-4 h-4">
    <path fillRule="evenodd" d="M3.5 2A1.5 1.5 0 002 3.5V18a1 1 0 001 1h1a1 1 0 001-1v-5.5h11.5a1 1 0 001-1.376l-1.5-3a1 1 0 000-.748l1.5-3A1 1 0 0016.5 3H5V2.5A1.5 1.5 0 003.5 2z" clipRule="evenodd" />
  </svg>
);

type ModalType = 'add' | 'edit' | null;

export function CompaniesPage() {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modal state
  const [modalType, setModalType] = useState<ModalType>(null);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  
  // Form state
  const [formName, setFormName] = useState('');
  const [formWebsite, setFormWebsite] = useState('');
  
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [sortField, setSortField] = useState<'name' | 'applicationCount' | 'createdAt' | 'star' | 'revisit'>('name');
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

  const openModal = (type: ModalType, company?: Company) => {
    setModalType(type);
    if (type === 'add') {
      setEditingCompany(null);
      setFormName('');
      setFormWebsite('');
    } else if (type === 'edit' && company) {
      setEditingCompany(company);
      setFormName(company.name);
      setFormWebsite(company.website || '');
    }
  };

  const closeModal = () => {
    setModalType(null);
    setEditingCompany(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    // Auto-prefix https:// if user enters a URL without protocol
    let website = formWebsite.trim();
    if (website && !website.startsWith('http://') && !website.startsWith('https://')) {
      website = 'https://' + website;
    }

    try {
      if (modalType === 'add') {
        const company = await companiesApi.create({
          name: formName.trim(),
          website: website || undefined,
        });
        setCompanies((prev) => [...prev, { ...company, tags: [], applicationCount: 0, updatedAt: company.createdAt }]);
      } else if (modalType === 'edit' && editingCompany) {
        const updated = await companiesApi.update(editingCompany.id, {
          name: formName.trim(),
          website: website || undefined,
        });
        setCompanies((prev) => prev.map((c) => (c.id === updated.id ? { ...c, ...updated } : c)));
      }
      closeModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save company');
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
          onClick={() => openModal('add')}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
        >
          <PlusIcon /> Add Company
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
            onClick={() => openModal('add')}
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
                <SortHeader field="star" className="w-16 text-center">
                  <span title="Starred companies">⭐</span>
                </SortHeader>
                <SortHeader field="revisit" className="w-16 text-center">
                  <span title="Revisit flagged">🚩</span>
                </SortHeader>
                <SortHeader field="applicationCount">Applications</SortHeader>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {companies.map((company) => (
                <tr key={company.id} className="hover:bg-gray-750">
                  <td className="px-4 py-3 text-left">
                    <button
                      onClick={() => navigate(`/companies/${company.id}`)}
                      className="text-white font-medium hover:text-blue-400 hover:underline text-left"
                    >
                      {company.name}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-left">
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
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        try {
                          await companiesApi.update(company.id, { star: !company.star });
                          setCompanies(prev => prev.map(c => 
                            c.id === company.id ? { ...c, star: !c.star } : c
                          ));
                        } catch (err) {
                          setError(err instanceof Error ? err.message : 'Failed to update star');
                        }
                      }}
                      className="hover:scale-125 transition-transform cursor-pointer"
                      title={company.star ? 'Unstar company' : 'Star company'}
                    >
                      <span className={company.star ? 'text-yellow-400' : 'text-gray-600'}>
                        {company.star ? '⭐' : '☆'}
                      </span>
                    </button>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        try {
                          await companiesApi.update(company.id, { revisit: !company.revisit });
                          setCompanies(prev => prev.map(c => 
                            c.id === company.id ? { ...c, revisit: !c.revisit } : c
                          ));
                        } catch (err) {
                          setError(err instanceof Error ? err.message : 'Failed to update revisit');
                        }
                      }}
                      className="hover:scale-125 transition-transform cursor-pointer"
                      title={company.revisit ? 'Unflag for revisit' : 'Flag to revisit'}
                    >
                      <span className={company.revisit ? 'text-red-400' : 'text-gray-600'}>
                        {company.revisit ? '🚩' : '⚐'}
                      </span>
                    </button>
                  </td>
                  <td className="px-4 py-3 text-left">
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
                    <div className="flex gap-1 justify-end">
                      <button
                        onClick={() => openModal('edit', company)}
                        className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-gray-700 rounded transition-colors"
                        title="Edit company"
                      >
                        <PencilIcon />
                      </button>
                      <button
                        onClick={() => navigate('/applications/new', { state: { companyId: company.id, companyName: company.name } })}
                        className="p-1.5 text-gray-400 hover:text-green-400 hover:bg-gray-700 rounded transition-colors"
                        title="New application"
                      >
                        <DocumentPlusIcon />
                      </button>
                      <button
                        onClick={() => handleDelete(company.id)}
                        className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded transition-colors"
                        title="Delete company"
                      >
                        <TrashIcon />
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

      {modalType && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={closeModal}>
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-white mb-4">
              {modalType === 'add' ? 'Add Company' : 'Edit Company'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-left text-sm font-medium text-gray-300 mb-1">Name</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Acme Corp"
                />
              </div>
              <div className="mb-6">
                <label className="block text-left text-sm font-medium text-gray-300 mb-1">Website (optional)</label>
                <input
                  type="text"
                  value={formWebsite}
                  onChange={(e) => setFormWebsite(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="www.example.com"
                />
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
                >
                  {modalType === 'add' ? 'Add Company' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
