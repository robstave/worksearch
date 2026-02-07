import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { companiesApi, applicationsApi } from '../api';
import type { CompanyDetail, CompanyVisit } from '../api';
import { LoadingScreen } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';

const FireIcon = ({ active }: { active: boolean }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    fill="currentColor"
    className={`w-5 h-5 transition-colors ${active ? 'text-orange-500' : 'text-gray-600 hover:text-orange-400'}`}
  >
    <path
      fillRule="evenodd"
      d="M13.5 4.938a7 7 0 11-9.006 1.737c.202-.257.59-.218.793.039.278.352.594.672.943.954.332.269.786-.049.786-.49V6.5a.75.75 0 011.5 0v.667c0 .441.454.759.786.49.349-.282.665-.602.943-.954.203-.257.59-.296.793-.039A7.001 7.001 0 0113.5 4.938zM10 15a3 3 0 100-6 3 3 0 000 6z"
      clipRule="evenodd"
    />
  </svg>
);

export function CompanyPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = id === 'new';

  const [company, setCompany] = useState<CompanyDetail | null>(null);
  const [visits, setVisits] = useState<CompanyVisit[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [name, setName] = useState('');
  const [website, setWebsite] = useState('');
  const [notesMd, setNotesMd] = useState('');
  const [star, setStar] = useState(false);
  const [revisit, setRevisit] = useState(false);
  const [isNotesEditing, setIsNotesEditing] = useState(false);

  // Visit modal state
  const [showVisitModal, setShowVisitModal] = useState(false);
  const [visitNote, setVisitNote] = useState('');
  const [visitStatus, setVisitStatus] = useState('');

  useEffect(() => {
    const loadData = async () => {
      if (!id || isNew) {
        setLoading(false);
        return;
      }

      try {
        const [companyData, visitsData] = await Promise.all([
          companiesApi.get(id),
          companiesApi.getVisits(id),
        ]);
        setCompany(companyData);
        setVisits(visitsData);
        setName(companyData.name);
        setWebsite(companyData.website || '');
        setNotesMd(companyData.notesMd || '');
        setStar(companyData.star);
        setRevisit(companyData.revisit);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load company');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id, isNew]);

  const handleSave = async () => {
    if (!name.trim()) return;

    setSaving(true);
    setError('');
    try {
      let websiteUrl = website.trim();
      if (websiteUrl && !websiteUrl.startsWith('http://') && !websiteUrl.startsWith('https://')) {
        websiteUrl = 'https://' + websiteUrl;
      }

      if (isNew) {
        const newCompany = await companiesApi.create({
          name: name.trim(),
          website: websiteUrl || undefined,
          notesMd,
          star,
          revisit,
        });
        navigate(`/companies/${newCompany.id}`);
      } else if (id) {
        const updated = await companiesApi.update(id, {
          name: name.trim(),
          website: websiteUrl || undefined,
          notesMd,
          star,
          revisit,
        });
        setCompany(prev => prev ? { ...prev, ...updated } : null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save company');
    } finally {
      setSaving(false);
    }
  };

  const handleLogVisit = async () => {
    if (!id || isNew) return;

    try {
      const visit = await companiesApi.createVisit(id, {
        note: visitNote.trim() || undefined,
        status: visitStatus || undefined,
      });
      setVisits(prev => [visit, ...prev]);
      setShowVisitModal(false);
      setVisitNote('');
      setVisitStatus('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to log visit');
    }
  };

  const handleDelete = async () => {
    if (!id || isNew) return;
    if (!confirm('Delete this company? This will also delete all applications for this company.')) return;

    try {
      await companiesApi.delete(id);
      navigate('/companies');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete company');
    }
  };

  if (loading) {
    return <LoadingScreen message={isNew ? 'Creating company...' : 'Loading company...'} />;
  }

  if (!isNew && !company) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400 mb-4">Company not found</p>
        <Button onClick={() => navigate('/companies')}>Back to Companies</Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link to="/companies" className="text-blue-400 hover:underline mb-2 inline-block">
          ← Back to Companies
        </Link>
        <h1 className="text-3xl font-bold text-white">{isNew ? 'Add Company' : 'Company Details'}</h1>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-900/50 border border-red-500 rounded text-red-400">
          {error}
          <button onClick={() => setError('')} className="ml-2 underline">
            Dismiss
          </button>
        </div>
      )}

      <div className="space-y-6">
        {/* Basic Info Card */}
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-left text-sm font-medium text-gray-300 mb-1">Company Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-left text-sm font-medium text-gray-300 mb-1">Website</label>
              <input
                type="text"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="www.example.com"
              />
            </div>
          </div>

          {/* Flags */}
          <div className="flex gap-6 mb-4">
            <label className="flex items-center gap-2 text-gray-300 cursor-pointer">
              <input
                type="checkbox"
                checked={star}
                onChange={(e) => setStar(e.target.checked)}
                className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500"
              />
              <span className="flex items-center gap-1">
                ⭐ Star this company
                <span className="text-xs text-gray-500" title="Mark companies you like">ⓘ</span>
              </span>
            </label>
            <label className="flex items-center gap-2 text-gray-300 cursor-pointer">
              <input
                type="checkbox"
                checked={revisit}
                onChange={(e) => setRevisit(e.target.checked)}
                className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-red-600 focus:ring-red-500"
              />
              <span className="flex items-center gap-1">
                🚩 Flag to revisit
                <span className="text-xs text-gray-500" title="Companies to check back on later">ⓘ</span>
              </span>
            </label>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {saving ? 'Saving...' : (isNew ? 'Create Company' : 'Save Changes')}
            </Button>
            {!isNew && (
              <Button
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete Company
              </Button>
            )}
          </div>
        </div>

        {/* Notes Card */}
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">Notes</h2>
            <button
              onClick={() => setIsNotesEditing(!isNotesEditing)}
              className="text-sm text-blue-400 hover:underline"
            >
              {isNotesEditing ? 'Preview' : 'Edit'}
            </button>
          </div>
          {isNotesEditing ? (
            <textarea
              value={notesMd}
              onChange={(e) => setNotesMd(e.target.value)}
              rows={10}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Add notes about this company (Markdown supported)..."
            />
          ) : (
            <div className="prose prose-invert max-w-none text-left">
              {notesMd ? (
                <ReactMarkdown>{notesMd}</ReactMarkdown>
              ) : (
                <p className="text-gray-500 italic">No notes yet. Click "Edit" to add notes.</p>
              )}
            </div>
          )}
        </div>

        {/* Applications Card */}
        {!isNew && company && (
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">
                Applications ({company.applications.length})
              </h2>
              <div className="flex gap-2">
                <Button
                  onClick={() => navigate('/events/new', { state: { companyId: company.id, companyName: company.name } })}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  📅 Add Event
                </Button>
                <Button
                  onClick={() => navigate('/applications/new', { state: { companyId: company.id, companyName: company.name } })}
                  className="bg-green-600 hover:bg-green-700"
                >
                  + New Application
                </Button>
              </div>
            </div>
            {company.applications.length === 0 ? (
              <p className="text-gray-500 italic text-left">No applications yet.</p>
            ) : (
              <div className="space-y-2">
              {company.applications.map((app) => (
                <div
                  key={app.id}
                  className="flex items-center gap-2 p-3 bg-gray-700 rounded hover:bg-gray-650 transition-colors"
                >
                  <button
                    onClick={async (e) => {
                      e.preventDefault();
                      try {
                        await applicationsApi.update(app.id, { hot: !app.hot });
                        // Refresh company data
                        const updated = await companiesApi.get(company.id);
                        setCompany(updated);
                      } catch (err) {
                        console.error('Failed to toggle hot:', err);
                      }
                    }}
                    className="p-1 rounded hover:bg-gray-600 transition-colors shrink-0"
                    title={app.hot ? `Hot since ${app.hotDate ? new Date(app.hotDate).toLocaleDateString() : 'unknown'}` : 'Mark as hot'}
                  >
                    <FireIcon active={app.hot} />
                  </button>
                  <Link
                    to={`/applications/${app.id}`}
                    className="flex-1 flex items-center justify-between"
                  >
                    <div className="text-left">
                      <span className="text-white font-medium">{app.jobTitle}</span>
                      {app.appliedAt && (
                        <span className="text-xs text-gray-400 ml-3">
                          Applied: {new Date(app.appliedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <span className="text-xs px-2 py-1 rounded bg-gray-600 text-gray-300">
                      {app.currentState}
                    </span>
                  </Link>
                </div>
              ))}
            </div>
          )}
          </div>
        )}

        {/* Visit History Card */}
        {!isNew && (
          <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">Visit History</h2>
            <Button
              onClick={() => setShowVisitModal(true)}
              className="bg-purple-600 hover:bg-purple-700"
            >
              Log Visit
            </Button>
          </div>
          {visits.length === 0 ? (
            <p className="text-gray-500 italic">No visits logged yet.</p>
          ) : (
            <div className="space-y-3">
              {visits.map((visit) => (
                <div key={visit.id} className="p-3 bg-gray-700 rounded">
                  <div className="text-left">
                    <span className="text-sm text-gray-400 block mb-1">
                      {new Date(visit.visitedAt).toLocaleString()}
                    </span>
                    {visit.status && (
                      <span className="text-white text-sm block mb-1">
                        {visit.status}
                      </span>
                    )}
                    {visit.note && (
                      <p className="text-white text-sm">{visit.note}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          </div>
        )}
      </div>

      {/* Visit Modal */}
      {showVisitModal && !isNew && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setShowVisitModal(false)}
        >
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-white mb-4">Log Visit</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-left text-sm font-medium text-gray-300 mb-1">Status (optional)</label>
                <select
                  value={visitStatus}
                  onChange={(e) => setVisitStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select status...</option>
                  <option value="no new jobs">No new jobs</option>
                  <option value="new jobs found">New jobs found</option>
                  <option value="no interest">No interest</option>
                </select>
              </div>
              <div>
                <label className="block text-left text-sm font-medium text-gray-300 mb-1">Note (optional)</label>
                <textarea
                  value={visitNote}
                  onChange={(e) => setVisitNote(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white text-left focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Add a note about this visit..."
                />
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setShowVisitModal(false)}
                  className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <Button
                  onClick={handleLogVisit}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  Log Visit
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
