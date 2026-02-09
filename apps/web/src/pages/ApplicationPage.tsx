import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { applicationsApi, companiesApi } from '../api';
import type { ApplicationDetail, AppState, Company, WorkLocationType } from '../api';
import { LoadingScreen } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';

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

const ALLOWED_TRANSITIONS: Record<AppState, AppState[]> = {
  INTERESTED: ['APPLIED', 'TRASH'],
  APPLIED: ['SCREENING', 'REJECTED', 'GHOSTED', 'TRASH'],
  SCREENING: ['INTERVIEW', 'REJECTED', 'GHOSTED', 'TRASH'],
  INTERVIEW: ['INTERVIEW_2', 'OFFER', 'REJECTED', 'GHOSTED', 'TRASH'],
  INTERVIEW_2: ['INTERVIEW_3', 'OFFER', 'REJECTED', 'GHOSTED', 'TRASH'],
  INTERVIEW_3: ['OFFER', 'REJECTED', 'GHOSTED', 'TRASH'],
  OFFER: ['ACCEPTED', 'DECLINED', 'REJECTED', 'GHOSTED'],
  ACCEPTED: [],
  DECLINED: [],
  REJECTED: [],
  GHOSTED: [],
  TRASH: [],
};

export function ApplicationPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const isNew = id === 'new';

  const [application, setApplication] = useState<ApplicationDetail | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [companyId, setCompanyId] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [jobReqUrl, setJobReqUrl] = useState('');
  const [workLocation, setWorkLocation] = useState<WorkLocationType | ''>('HYBRID');
  const [easyApply, setEasyApply] = useState(false);
  const [coverLetter, setCoverLetter] = useState(false);
  const [hot, setHot] = useState(false);
  const [appliedAt, setAppliedAt] = useState('');
  const [description, setDescription] = useState('');
  const [isDescriptionEditing, setIsDescriptionEditing] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  // Transition editing state
  const [editingTransitionId, setEditingTransitionId] = useState<string | null>(null);
  const [editingTransitionDate, setEditingTransitionDate] = useState('');
  const [editingTransitionNote, setEditingTransitionNote] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        const companiesRes = await companiesApi.list();
        setCompanies(companiesRes.items);

        if (!isNew && id) {
          const app = await applicationsApi.get(id);
          setApplication(app);
          setCompanyId(app.company.id);
          setJobTitle(app.jobTitle);
          setJobReqUrl(app.jobReqUrl || '');
          setWorkLocation(app.workLocation || '');
          setEasyApply(app.easyApply || false);
          setCoverLetter(app.coverLetter || false);
          setHot(app.hot || false);
          // Format appliedAt for date input (YYYY-MM-DD)
          if (app.appliedAt) {
            const date = new Date(app.appliedAt);
            setAppliedAt(date.toISOString().slice(0, 10));
          }
          setDescription(app.jobDescriptionMd || '');
          setTags(app.tags);
        } else if (isNew) {
          // Check if company was pre-filled from navigation state
          const state = location.state as { companyId?: string; companyName?: string } | null;
          if (state?.companyId) {
            setCompanyId(state.companyId);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id, isNew]);

  const handleAddTag = () => {
    const newTag = tagInput.trim().toLowerCase();
    if (newTag && !tags.includes(newTag)) {
      setTags([...tags, newTag]);
    }
    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleEditTransition = (transitionId: string, transitionedAt: string, note: string | null) => {
    setEditingTransitionId(transitionId);
    // Format date for datetime-local input: YYYY-MM-DDTHH:mm
    const date = new Date(transitionedAt);
    const formattedDate = date.toISOString().slice(0, 16);
    setEditingTransitionDate(formattedDate);
    setEditingTransitionNote(note || '');
  };

  const handleCancelEditTransition = () => {
    setEditingTransitionId(null);
    setEditingTransitionDate('');
    setEditingTransitionNote('');
  };

  const handleSaveTransition = async () => {
    if (!editingTransitionId || !id) return;
    
    setSaving(true);
    try {
      await applicationsApi.updateTransition(id, editingTransitionId, {
        transitionedAt: new Date(editingTransitionDate).toISOString(),
        note: editingTransitionNote.trim() || undefined,
      });
      // Reload application to show updated transition
      const updated = await applicationsApi.get(id);
      setApplication(updated);
      handleCancelEditTransition();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update transition');
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async (initialState?: AppState) => {
    if (!jobTitle.trim()) {
      setError('Job title is required');
      return;
    }

    setSaving(true);
    setError('');

    try {
      if (isNew) {
        if (!companyId) {
          setError('Company is required');
          setSaving(false);
          return;
        }
        const newApp = await applicationsApi.create({
          companyId,
          jobTitle: jobTitle.trim(),
          jobReqUrl: jobReqUrl.trim() || undefined,
          workLocation: workLocation || undefined,
          easyApply,
          coverLetter,
          initialState,
        });
        // If tags were added, update them
        if (tags.length > 0) {
          await applicationsApi.update(newApp.id, { tags });
        }
        navigate('/applications/list');
      } else if (id) {
        await applicationsApi.update(id, {
          jobTitle: jobTitle.trim(),
          jobReqUrl: jobReqUrl.trim() || undefined,
          workLocation: workLocation || undefined,
          easyApply,
          coverLetter,
          hot,
          appliedAt: appliedAt || undefined,
          jobDescriptionMd: description,
          tags,
        });
        navigate('/applications/list');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleMove = async (toState: AppState) => {
    if (!id || isNew) return;

    setSaving(true);
    try {
      await applicationsApi.move(id, toState);
      const updated = await applicationsApi.get(id);
      setApplication(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to move application');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id || isNew) return;
    if (!confirm('Delete this application? This cannot be undone.')) return;

    setSaving(true);
    try {
      await applicationsApi.delete(id);
      navigate('/applications/board');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete');
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingScreen message="Loading application..." />;
  }

  const allowedMoves = application ? ALLOWED_TRANSITIONS[application.currentState] : [];

  return (
    <div>
      {/* Breadcrumb */}
      <div className="mb-6">
        <Link to="/applications/board" className="text-blue-400 hover:underline text-sm">
          ← Back to Board
        </Link>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-900/50 border border-red-500 rounded text-red-400">
          {error}
          <button onClick={() => setError('')} className="ml-2 underline">
            Dismiss
          </button>
        </div>
      )}

      <div className="bg-gray-800 rounded-lg p-6">
        {/* Header */}
        <div className="flex items-start gap-4 mb-6">
          <div className="flex-1">
            {isNew ? (
              <h1 className="text-2xl font-bold text-white text-left">
                New Application
              </h1>
            ) : application ? (
              <Link 
                to={`/companies/${application.company.id}`}
                className="text-2xl font-bold text-white hover:text-blue-400 transition-colors text-left block"
              >
                {application.company.name}
              </Link>
            ) : null}
            {!isNew && application && (
              <div className="flex items-center gap-3 mt-2">
                <span
                  className={`inline-block px-2 py-1 rounded text-xs font-medium text-white ${STATE_COLORS[application.currentState]}`}
                >
                  {application.currentState}
                </span>
                {application.appliedAt && (
                  <span className="text-sm text-gray-400">
                    Applied {new Date(application.appliedAt).toLocaleDateString()}
                  </span>
                )}
              </div>
            )}
          </div>
          {!isNew && application?.jobReqUrl && (
            <a
              href={application.jobReqUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 text-sm"
            >
              View Job Posting ↗
            </a>
          )}
        </div>

        {/* Form */}
        <div className="space-y-6">
          {/* Applied Date (for existing applications - moved to top) */}
          {!isNew && (
            <div className="flex items-end justify-between gap-4">
              <div className="flex-1">
                <label className="block text-left text-sm font-medium text-gray-300 mb-1">
                  Applied Date
                </label>
                <input
                  type="date"
                  value={appliedAt}
                  onChange={(e) => setAppliedAt(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {application && (
                <Button
                  onClick={() => navigate('/events/new', {
                    state: {
                      applicationId: application.id,
                      companyId: application.company.id,
                      companyName: application.company.name,
                      applicationTitle: `${application.company.name} — ${application.jobTitle}`,
                    }
                  })}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  📅 Add Event
                </Button>
              )}
            </div>
          )}

          {/* Company (only for new) */}
          {isNew && (
            <div>
              <label className="block text-left text-sm font-medium text-gray-300 mb-1">
                Company <span className="text-red-400">*</span>
              </label>
              <select
                value={companyId}
                onChange={(e) => setCompanyId(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a company</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {companies.length === 0 && (
                <p className="mt-1 text-sm text-gray-400">
                  No companies yet.{' '}
                  <Link to="/companies" className="text-blue-400 hover:underline">
                    Add one first
                  </Link>
                </p>
              )}
            </div>
          )}

          {/* Job Title */}
          <div>
            <label className="block text-left text-sm font-medium text-gray-300 mb-1">
              Job Title <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Senior Software Engineer"
            />
          </div>

          {/* Job URL */}
          <div>
            <label className="block text-left text-sm font-medium text-gray-300 mb-1">
              Job Posting URL
            </label>
            <input
              type="text"
              value={jobReqUrl}
              onChange={(e) => setJobReqUrl(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://..."
            />
          </div>

          {/* Work Location */}
          <div>
            <label className="block text-left text-sm font-medium text-gray-300 mb-1">
              Work Location
            </label>
            <select
              value={workLocation}
              onChange={(e) => setWorkLocation(e.target.value as WorkLocationType | '')}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Not specified</option>
              <option value="REMOTE">Remote</option>
              <option value="ONSITE">On-site</option>
              <option value="HYBRID">Hybrid</option>
              <option value="CONTRACT">Contract</option>
            </select>
          </div>

          {/* Application Flags */}
          <div className="flex gap-6">
            <label className="flex items-center gap-2 text-gray-300 cursor-pointer" title="Easy apply - one-click or quick application">
              <input
                type="checkbox"
                checked={easyApply}
                onChange={(e) => setEasyApply(e.target.checked)}
                className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500"
              />
              <span>⚡ Easy Apply</span>
            </label>
            <label className="flex items-center gap-2 text-gray-300 cursor-pointer" title="Cover letter - application required a cover letter">
              <input
                type="checkbox"
                checked={coverLetter}
                onChange={(e) => setCoverLetter(e.target.checked)}
                className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-purple-600 focus:ring-purple-500"
              />
              <span>📝 Cover Letter</span>
            </label>
            <label className="flex items-center gap-2 text-gray-300 cursor-pointer" title="Hot - high priority opportunity">
              <input
                type="checkbox"
                checked={hot}
                onChange={(e) => setHot(e.target.checked)}
                className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-orange-600 focus:ring-orange-500"
              />
              <span>🔥 Hot</span>
            </label>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-left text-sm font-medium text-gray-300 mb-1">Tags</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 bg-blue-600 text-white text-sm px-2 py-1 rounded"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-red-300"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Add tag and press Enter"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-3 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-md transition-colors"
              >
                Add
              </button>
            </div>
          </div>

          {/* Description / Notes */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-left text-sm font-medium text-gray-300">
                Description / Notes
              </label>
              {!isNew && (
                <button
                  type="button"
                  onClick={() => setIsDescriptionEditing(!isDescriptionEditing)}
                  className="text-sm text-blue-400 hover:text-blue-300"
                >
                  {isDescriptionEditing ? 'Preview' : 'Edit'}
                </button>
              )}
            </div>
            {isNew || isDescriptionEditing ? (
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={10}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                placeholder="Add notes, job description, requirements... (Markdown supported)"
              />
            ) : (
              <div className="min-h-[200px] p-4 bg-gray-700/50 border border-gray-600 rounded-md prose prose-invert prose-sm max-w-none text-left">
                {description ? (
                  <ReactMarkdown>{description}</ReactMarkdown>
                ) : (
                  <p className="text-gray-500 italic">No description yet. Click Edit to add one.</p>
                )}
              </div>
            )}
          </div>

          {/* State transitions (only for existing) */}
          {!isNew && application && allowedMoves.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Move to
              </label>
              <div className="flex flex-wrap gap-2">
                {allowedMoves.map((state) => (
                  <button
                    key={state}
                    onClick={() => handleMove(state)}
                    disabled={saving}
                    className={`px-3 py-1.5 rounded text-sm font-medium text-white transition-colors ${STATE_COLORS[state]} hover:opacity-80 disabled:opacity-50`}
                  >
                    {state}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-700">
          <div>
            {!isNew && (
              <button
                onClick={handleDelete}
                disabled={saving}
                className="text-red-400 hover:text-red-300 text-sm"
              >
                Delete Application
              </button>
            )}
          </div>
          <div className="flex gap-3">
            <Link
              to="/applications/board"
              className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
            >
              Cancel
            </Link>
            {isNew ? (
              <>
                <button
                  onClick={() => handleSave('INTERESTED')}
                  disabled={saving}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-800 text-white rounded-md transition-colors"
                >
                  {saving ? 'Saving...' : 'Save as Interested'}
                </button>
                <button
                  onClick={() => handleSave('APPLIED')}
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white rounded-md transition-colors"
                >
                  {saving ? 'Saving...' : 'Create Application'}
                </button>
              </>
            ) : (
              <button
                onClick={() => handleSave()}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white rounded-md transition-colors"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            )}
          </div>
        </div>

        {/* Transition History */}
        {!isNew && application && application.transitions.length > 0 && (
          <div className="mt-8 pt-6 border-t border-gray-700">
            <h3 className="text-lg font-medium text-white mb-4 text-left">Transition History</h3>
            <div className="bg-gray-700 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-600">
                  <tr>
                    <th className="px-2 py-2 text-left text-sm font-medium text-gray-300">Date</th>
                    <th className="px-2 py-2 text-left text-sm font-medium text-gray-300">From</th>
                    <th className="px-2 py-2 text-left text-sm font-medium text-gray-300">To</th>
                    <th className="px-2 py-2 text-left text-sm font-medium text-gray-300">Note</th>
                    <th className="px-2 py-2 text-left text-sm font-medium text-gray-300">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-600">
                  {application.transitions.map((t) => {
                    const isEditing = editingTransitionId === t.id;
                    return (
                      <tr key={t.id}>
                        <td className="px-2 py-2 text-sm text-gray-300">
                          {isEditing ? (
                            <div className="flex flex-col gap-1">
                              <input
                                type="datetime-local"
                                value={editingTransitionDate}
                                onChange={(e) => setEditingTransitionDate(e.target.value)}
                                className="w-full px-2 py-1 bg-gray-600 text-white rounded border border-gray-500 text-sm"
                              />
                              <div className="flex gap-1 flex-wrap">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const now = new Date();
                                    setEditingTransitionDate(now.toISOString().slice(0, 16));
                                  }}
                                  className="px-2 py-0.5 text-xs bg-gray-600 hover:bg-gray-500 text-white rounded border border-gray-500"
                                  title="Set to today"
                                >
                                  Today
                                </button>
                                {application?.appliedAt && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const appDate = new Date(application.appliedAt!);
                                        setEditingTransitionDate(appDate.toISOString().slice(0, 16));
                                      }}
                                      className="px-2 py-0.5 text-xs bg-blue-600 hover:bg-blue-500 text-white rounded border border-blue-500"
                                      title="Set to application date"
                                    >
                                      App Date
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const appDate = new Date(application.appliedAt!);
                                        appDate.setMonth(appDate.getMonth() + 1);
                                        setEditingTransitionDate(appDate.toISOString().slice(0, 16));
                                      }}
                                      className="px-2 py-0.5 text-xs bg-orange-600 hover:bg-orange-500 text-white rounded border border-orange-500"
                                      title="1 month after application"
                                    >
                                      +1mo
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const appDate = new Date(application.appliedAt!);
                                        appDate.setMonth(appDate.getMonth() + 2);
                                        setEditingTransitionDate(appDate.toISOString().slice(0, 16));
                                      }}
                                      className="px-2 py-0.5 text-xs bg-red-600 hover:bg-red-500 text-white rounded border border-red-500"
                                      title="2 months after application (typical ghosting timeframe)"
                                    >
                                      +2mo
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          ) : (
                            new Date(t.transitionedAt).toLocaleString()
                          )}
                        </td>
                        <td className="px-2 py-2">
                          {t.fromState ? (
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium text-white ${STATE_COLORS[t.fromState]}`}>
                              {t.fromState}
                            </span>
                          ) : (
                            <span className="text-gray-500 text-sm">—</span>
                          )}
                        </td>
                        <td className="px-2 py-2">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium text-white ${STATE_COLORS[t.toState]}`}>
                            {t.toState}
                          </span>
                        </td>
                        <td className="px-2 py-2 text-sm text-gray-400">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editingTransitionNote}
                              onChange={(e) => setEditingTransitionNote(e.target.value)}
                              placeholder="Optional note"
                              className="w-full px-2 py-1 bg-gray-600 text-white rounded border border-gray-500 text-sm"
                            />
                          ) : (
                            t.note || '—'
                          )}
                        </td>
                        <td className="px-2 py-2">
                          {isEditing ? (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={handleSaveTransition}
                                disabled={saving}
                              >
                                Save
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={handleCancelEditTransition}
                                disabled={saving}
                              >
                                Cancel
                              </Button>
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditTransition(t.id, t.transitionedAt, t.note)}
                            >
                              Edit
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
