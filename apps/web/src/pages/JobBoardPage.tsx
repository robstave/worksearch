import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { jobBoardsApi } from '../api';
import type { JobBoard } from '../api';

export function JobBoardPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = id === 'new';

  const [jobBoard, setJobBoard] = useState<JobBoard | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [name, setName] = useState('');
  const [link, setLink] = useState('');
  const [notesMd, setNotesMd] = useState('');
  const [isNotesEditing, setIsNotesEditing] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        if (!isNew && id) {
          const jb = await jobBoardsApi.get(id);
          setJobBoard(jb);
          setName(jb.name);
          setLink(jb.link || '');
          setNotesMd(jb.notesMd);
          setIsNotesEditing(false);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id, isNew]);

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Name is required');
      return;
    }

    setSaving(true);
    setError('');

    try {
      if (isNew) {
        await jobBoardsApi.create({
          name: name.trim(),
          link: link.trim() || undefined,
          notesMd,
        });
        navigate('/job-boards');
      } else if (id) {
        await jobBoardsApi.update(id, {
          name: name.trim(),
          link: link.trim() || undefined,
          notesMd,
        });
        navigate('/job-boards');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id || isNew) return;
    if (!confirm('Delete this job board? This cannot be undone.')) return;

    setSaving(true);
    try {
      await jobBoardsApi.delete(id);
      navigate('/job-boards');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete');
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div>
      {/* Breadcrumb */}
      <div className="mb-6">
        <Link to="/job-boards" className="text-blue-400 hover:underline text-sm">
          ← Back to Job Boards
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
        <div className="flex items-start justify-between mb-6">
          <h1 className="text-2xl font-bold text-white">
            {isNew ? 'New Job Board' : jobBoard?.name}
          </h1>
          {!isNew && jobBoard?.link && (
            <a
              href={jobBoard.link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 text-sm"
            >
              Open Link ↗
            </a>
          )}
        </div>

        {/* Form */}
        <div className="space-y-6">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., LinkedIn Jobs, Indeed, Glassdoor"
            />
          </div>

          {/* Link */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Link
            </label>
            <input
              type="text"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://..."
            />
          </div>

          {/* Notes (Markdown) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-300">
                Notes
              </label>
              {!isNew && (
                <button
                  type="button"
                  onClick={() => setIsNotesEditing(!isNotesEditing)}
                  className="text-sm text-blue-400 hover:text-blue-300"
                >
                  {isNotesEditing ? 'Preview' : 'Edit'}
                </button>
              )}
            </div>
            {isNew || isNotesEditing ? (
              <textarea
                value={notesMd}
                onChange={(e) => setNotesMd(e.target.value)}
                rows={12}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                placeholder="Add saved searches, notes, sub-links... (Markdown supported)"
              />
            ) : (
              <div className="min-h-[200px] p-4 bg-gray-700/50 border border-gray-600 rounded-md prose prose-invert prose-sm max-w-none text-left">
                {notesMd ? (
                  <ReactMarkdown>{notesMd}</ReactMarkdown>
                ) : (
                  <p className="text-gray-500 italic">No notes yet. Click Edit to add some.</p>
                )}
              </div>
            )}
          </div>
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
                Delete Job Board
              </button>
            )}
          </div>
          <div className="flex gap-3">
            <Link
              to="/job-boards"
              className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
            >
              Cancel
            </Link>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white rounded-md transition-colors"
            >
              {saving ? 'Saving...' : isNew ? 'Create Job Board' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
