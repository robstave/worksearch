import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { notesApi } from '../api';
import type { Note } from '../api';
import { LoadingScreen } from '@/components/ui/spinner';

export function ResourceNotePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = id === 'new';

  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [name, setName] = useState('');
  const [value, setValue] = useState('');
  const [notesMd, setNotesMd] = useState('');
  const [isNotesEditing, setIsNotesEditing] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        if (!isNew && id) {
          const jb = await notesApi.get(id);
          setNote(jb);
          setName(jb.name);
          setValue(jb.value || '');
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
        await notesApi.create({
          name: name.trim(),
          value: value,
          notesMd,
        });
        navigate('/resources/notes');
      } else if (id) {
        await notesApi.update(id, {
          name: name.trim(),
          value: value,
          notesMd,
        });
        navigate('/resources/notes');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id || isNew) return;
    if (!confirm('Delete this note? This cannot be undone.')) return;

    setSaving(true);
    try {
      await notesApi.delete(id);
      navigate('/resources/notes');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete');
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingScreen message="Loading note..." />;
  }

  return (
    <div>
      {/* Breadcrumb */}
      <div className="mb-6">
        <Link to="/resources/notes" className="text-blue-400 hover:underline text-sm">
          ← Back to Notes
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
            {isNew ? 'New Note' : note?.name}
          </h1>

        </div>

        {/* Form */}
        <div className="space-y-6">
          {/* Name */}
          <div>
            <label className="block text-left text-sm font-medium text-gray-300 mb-1">
              Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., GitHub link, LinkedIn link"
            />
          </div>

          {/* Value */}
          <div>
            <label className="block text-left text-sm font-medium text-gray-300 mb-1">
              Value
            </label>
            <textarea
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Paste any text or link…"
              rows={4}
            />
          </div>

          {/* Notes (Markdown) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-left text-sm font-medium text-gray-300">
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
                placeholder="Add saved searches, notes, details... (Markdown supported)"
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
                Delete Note
              </button>
            )}
          </div>
          <div className="flex gap-3">
            <Link
              to="/resources/notes"
              className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
            >
              Cancel
            </Link>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white rounded-md transition-colors"
            >
              {saving ? 'Saving...' : isNew ? 'Create Note' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
