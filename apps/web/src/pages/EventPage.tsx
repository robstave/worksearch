import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { eventsApi, companiesApi, applicationsApi } from '../api';
import type { CalendarEvent, CalendarEventType, Company, Application } from '../api';
import { LoadingScreen } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';

const EVENT_TYPE_OPTIONS: { value: CalendarEventType; label: string; icon: string }[] = [
  { value: 'SCREENING', label: 'Screening', icon: '📋' },
  { value: 'INTERVIEW', label: 'Interview', icon: '🎤' },
  { value: 'TECH_SCREENING', label: 'Tech Screening', icon: '💻' },
  { value: 'TODO', label: 'Todo', icon: '✅' },
  { value: 'MEETUP', label: 'Meetup', icon: '👥' },
  { value: 'FOLLOWUP', label: 'Follow-up', icon: '📞' },
  { value: 'CALL', label: 'Call', icon: '📱' },
  { value: 'DEADLINE', label: 'Deadline', icon: '⏰' },
  { value: 'NONE', label: 'None', icon: '📅' },
  { value: 'OTHER', label: 'Other', icon: '📌' },
];

export function EventPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const isNew = id === 'new';

  const [event, setEvent] = useState<CalendarEvent | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [title, setTitle] = useState('');
  const [eventType, setEventType] = useState<CalendarEventType>('NONE');
  const [scheduledAt, setScheduledAt] = useState('');
  const [notesMd, setNotesMd] = useState('');
  const [isNotesEditing, setIsNotesEditing] = useState(false);
  const [companyId, setCompanyId] = useState('');
  const [applicationId, setApplicationId] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load companies and applications for selectors
        const [companiesRes, applicationsRes] = await Promise.all([
          companiesApi.list({ limit: 200 }),
          applicationsApi.list({ limit: 200 }),
        ]);
        setCompanies(companiesRes.items);
        setApplications(applicationsRes.items);

        if (!isNew && id) {
          const eventData = await eventsApi.get(id);
          setEvent(eventData);
          setTitle(eventData.title);
          setEventType(eventData.type);
          setScheduledAt(new Date(eventData.scheduledAt).toISOString().slice(0, 16));
          setNotesMd(eventData.notesMd || '');
          setCompanyId(eventData.companyId || '');
          setApplicationId(eventData.applicationId || '');
        } else if (isNew) {
          // Check if pre-filled from navigation state
          const state = location.state as {
            companyId?: string;
            companyName?: string;
            applicationId?: string;
            applicationTitle?: string;
            eventType?: CalendarEventType;
          } | null;
          if (state?.companyId) setCompanyId(state.companyId);
          if (state?.applicationId) setApplicationId(state.applicationId);
          if (state?.eventType) setEventType(state.eventType);
          // Default scheduled time to now + 1 hour, rounded to next hour
          const defaultTime = new Date();
          defaultTime.setHours(defaultTime.getHours() + 1, 0, 0, 0);
          setScheduledAt(defaultTime.toISOString().slice(0, 16));
          // Auto-set title based on context
          if (state?.applicationTitle) {
            setTitle(`${state.applicationTitle}`);
          } else if (state?.companyName) {
            setTitle(`${state.companyName}`);
          }
          setIsNotesEditing(true);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id, isNew, location.state]);

  // When application changes, auto-set company
  const handleApplicationChange = (appId: string) => {
    setApplicationId(appId);
    if (appId) {
      const app = applications.find((a) => a.id === appId);
      if (app) {
        setCompanyId(app.company.id);
      }
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    if (!scheduledAt) {
      setError('Date and time are required');
      return;
    }

    setSaving(true);
    setError('');

    try {
      if (isNew) {
        await eventsApi.create({
          title: title.trim(),
          type: eventType,
          scheduledAt: new Date(scheduledAt).toISOString(),
          notesMd: notesMd.trim() || undefined,
          companyId: companyId || undefined,
          applicationId: applicationId || undefined,
        });
      } else if (id) {
        await eventsApi.update(id, {
          title: title.trim(),
          type: eventType,
          scheduledAt: new Date(scheduledAt).toISOString(),
          notesMd: notesMd.trim(),
          companyId: companyId || undefined,
          applicationId: applicationId || undefined,
        });
      }
      navigate('/calendar');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id || isNew) return;
    if (!confirm('Delete this event? This cannot be undone.')) return;

    setSaving(true);
    try {
      await eventsApi.delete(id);
      navigate('/calendar');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete');
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingScreen message="Loading event..." />;
  }

  // Filter applications by selected company if one is set
  const filteredApplications = companyId
    ? applications.filter((a) => a.company.id === companyId)
    : applications;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link to="/calendar" className="text-blue-400 hover:underline mb-2 inline-block">
          ← Back to Calendar
        </Link>
        <h1 className="text-3xl font-bold text-white">{isNew ? 'New Event' : 'Edit Event'}</h1>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-900/50 border border-red-500 rounded text-red-400">
          {error}
          <button onClick={() => setError('')} className="ml-2 underline">Dismiss</button>
        </div>
      )}

      <div className="bg-gray-800 rounded-lg p-6">
        <div className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-left text-sm font-medium text-gray-300 mb-1">
              Title <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Phone screen with Google"
            />
          </div>

          {/* Type and Date row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Event Type */}
            <div>
              <label className="block text-left text-sm font-medium text-gray-300 mb-1">
                Event Type
              </label>
              <select
                value={eventType}
                onChange={(e) => setEventType(e.target.value as CalendarEventType)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {EVENT_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.icon} {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Scheduled Date/Time */}
            <div>
              <label className="block text-left text-sm font-medium text-gray-300 mb-1">
                Date & Time <span className="text-red-400">*</span>
              </label>
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Company Selector */}
          <div>
            <label className="block text-left text-sm font-medium text-gray-300 mb-1">
              Company <span className="text-xs text-gray-500">(optional)</span>
            </label>
            <select
              value={companyId}
              onChange={(e) => {
                setCompanyId(e.target.value);
                // Clear application if company changes
                if (e.target.value !== companyId) {
                  setApplicationId('');
                }
              }}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">No company</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Application Selector */}
          <div>
            <label className="block text-left text-sm font-medium text-gray-300 mb-1">
              Application <span className="text-xs text-gray-500">(optional)</span>
            </label>
            <select
              value={applicationId}
              onChange={(e) => handleApplicationChange(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">No application</option>
              {filteredApplications.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.company.name} — {a.jobTitle}
                </option>
              ))}
            </select>
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
                  className="text-xs text-blue-400 hover:text-blue-300"
                >
                  {isNotesEditing ? 'Preview' : 'Edit'}
                </button>
              )}
            </div>
            {isNotesEditing || isNew ? (
              <textarea
                value={notesMd}
                onChange={(e) => setNotesMd(e.target.value)}
                rows={6}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white text-left focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                placeholder="Add notes (supports Markdown)..."
              />
            ) : (
              <div className="prose prose-invert max-w-none text-left bg-gray-700 rounded-md p-3 min-h-[6rem]">
                {notesMd ? (
                  <ReactMarkdown>{notesMd}</ReactMarkdown>
                ) : (
                  <p className="text-gray-500 italic">No notes yet. Click "Edit" to add notes.</p>
                )}
              </div>
            )}
          </div>

          {/* Association info for existing events */}
          {!isNew && event && (event.company || event.application) && (
            <div className="flex flex-wrap gap-2 text-sm text-gray-400 pt-2 border-t border-gray-700">
              {event.company && (
                <Link
                  to={`/companies/${event.company.id}`}
                  className="text-blue-400 hover:underline"
                >
                  🏢 {event.company.name}
                </Link>
              )}
              {event.application && (
                <Link
                  to={`/applications/${event.application.id}`}
                  className="text-blue-400 hover:underline"
                >
                  📄 {event.application.jobTitle}
                </Link>
              )}
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
                Delete Event
              </button>
            )}
          </div>
          <div className="flex gap-3">
            <Link
              to="/calendar"
              className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
            >
              Cancel
            </Link>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white rounded-md transition-colors"
            >
              {saving ? 'Saving...' : isNew ? 'Create Event' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
