import { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { eventsApi } from '../api';
import type { CalendarEvent, CalendarEventType } from '../api';
import { LoadingScreen } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';

const EVENT_TYPE_CONFIG: Record<CalendarEventType, { label: string; color: string; icon: string }> = {
  SCREENING: { label: 'Screening', color: 'bg-purple-500', icon: '📋' },
  INTERVIEW: { label: 'Interview', color: 'bg-green-500', icon: '🎤' },
  TECH_SCREENING: { label: 'Tech Screen', color: 'bg-cyan-500', icon: '💻' },
  TODO: { label: 'Todo', color: 'bg-yellow-500', icon: '✅' },
  MEETUP: { label: 'Meetup', color: 'bg-pink-500', icon: '👥' },
  FOLLOWUP: { label: 'Follow-up', color: 'bg-blue-500', icon: '📞' },
  CALL: { label: 'Call', color: 'bg-indigo-500', icon: '📱' },
  DEADLINE: { label: 'Deadline', color: 'bg-red-500', icon: '⏰' },
  NONE: { label: 'Event', color: 'bg-gray-500', icon: '📅' },
  OTHER: { label: 'Other', color: 'bg-gray-500', icon: '📌' },
};

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

function isSameDay(d1: Date, d2: Date) {
  return d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();
}

function isToday(date: Date) {
  return isSameDay(date, new Date());
}

function isPast(date: Date) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return date < now;
}

export function CalendarPage() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Calendar navigation state
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());

  useEffect(() => {
    const loadEvents = async () => {
      try {
        const res = await eventsApi.list();
        setEvents(res.items);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load events');
      } finally {
        setLoading(false);
      }
    };
    loadEvents();
  }, []);

  // Upcoming events (today and future, limited to 10)
  const upcomingEvents = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return events
      .filter((e) => new Date(e.scheduledAt) >= today)
      .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
      .slice(0, 10);
  }, [events]);

  // Past events (before today, most recent first)
  const pastEvents = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return events
      .filter((e) => new Date(e.scheduledAt) < today)
      .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime())
      .slice(0, 5);
  }, [events]);

  // Events grouped by date for the calendar
  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const event of events) {
      const d = new Date(event.scheduledAt);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(event);
    }
    return map;
  }, [events]);

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const handleToday = () => {
    const today = new Date();
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Delete this event?')) return;
    try {
      await eventsApi.delete(eventId);
      setEvents((prev) => prev.filter((e) => e.id !== eventId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete event');
    }
  };

  if (loading) {
    return <LoadingScreen message="Loading calendar..." />;
  }

  // Calendar grid data
  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfWeek(viewYear, viewMonth);
  const monthName = new Date(viewYear, viewMonth).toLocaleString('default', { month: 'long' });
  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Build calendar cells
  const calendarCells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) calendarCells.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarCells.push(d);
  // Pad to complete the last row
  while (calendarCells.length % 7 !== 0) calendarCells.push(null);

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-white">Calendar</h1>
        <Button
          onClick={() => navigate('/events/new')}
          className="bg-green-600 hover:bg-green-700"
        >
          + New Event
        </Button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-900/50 border border-red-500 rounded text-red-400">
          {error}
          <button onClick={() => setError('')} className="ml-2 underline">Dismiss</button>
        </div>
      )}

      {/* Upcoming Events List */}
      <div className="bg-gray-800 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold text-white mb-4">
          Upcoming Events {upcomingEvents.length > 0 && <span className="text-sm text-gray-400">({upcomingEvents.length})</span>}
        </h2>
        {upcomingEvents.length === 0 ? (
          <p className="text-gray-500 italic">No upcoming events. Click "+ New Event" to create one.</p>
        ) : (
          <div className="space-y-2">
            {upcomingEvents.map((event) => {
              const cfg = EVENT_TYPE_CONFIG[event.type] || EVENT_TYPE_CONFIG.NONE;
              const eventDate = new Date(event.scheduledAt);
              const todayEvent = isToday(eventDate);
              return (
                <div
                  key={event.id}
                  className={`flex items-center gap-3 p-3 rounded-lg transition-colors cursor-pointer hover:bg-gray-650 ${
                    todayEvent ? 'bg-gray-700 ring-1 ring-blue-500' : 'bg-gray-700'
                  }`}
                  onClick={() => navigate(`/events/${event.id}`)}
                >
                  {/* Type Icon */}
                  <span className="text-lg flex-shrink-0" title={cfg.label}>
                    {cfg.icon}
                  </span>
                  {/* Date */}
                  <div className="flex-shrink-0 w-20 text-center">
                    <div className={`text-xs font-medium ${todayEvent ? 'text-blue-400' : 'text-gray-400'}`}>
                      {todayEvent ? 'TODAY' : eventDate.toLocaleDateString('default', { month: 'short', day: 'numeric' })}
                    </div>
                    <div className="text-xs text-gray-500">
                      {eventDate.toLocaleTimeString('default', { hour: 'numeric', minute: '2-digit' })}
                    </div>
                  </div>
                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium text-white ${cfg.color}`}>
                        {cfg.label}
                      </span>
                      <span className="text-white font-medium truncate">{event.title}</span>
                    </div>
                    {(event.company || event.application) && (
                      <div className="text-xs text-gray-400 mt-0.5 truncate">
                        {event.company && <span>{event.company.name}</span>}
                        {event.company && event.application && <span> · </span>}
                        {event.application && <span>{event.application.jobTitle}</span>}
                      </div>
                    )}
                  </div>
                  {/* Actions */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteEvent(event.id);
                    }}
                    className="text-gray-500 hover:text-red-400 text-sm flex-shrink-0"
                    title="Delete event"
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Past Events (collapsed) */}
      {pastEvents.length > 0 && (
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">
            Recent Past Events <span className="text-sm text-gray-400">({pastEvents.length})</span>
          </h2>
          <div className="space-y-2">
            {pastEvents.map((event) => {
              const cfg = EVENT_TYPE_CONFIG[event.type] || EVENT_TYPE_CONFIG.NONE;
              const eventDate = new Date(event.scheduledAt);
              return (
                <div
                  key={event.id}
                  className="flex items-center gap-3 p-3 bg-gray-700 rounded-lg opacity-60 hover:opacity-100 transition-opacity cursor-pointer"
                  onClick={() => navigate(`/events/${event.id}`)}
                >
                  <span className="text-lg flex-shrink-0">{cfg.icon}</span>
                  <div className="flex-shrink-0 w-20 text-center">
                    <div className="text-xs text-gray-400">
                      {eventDate.toLocaleDateString('default', { month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium text-white ${cfg.color}`}>
                        {cfg.label}
                      </span>
                      <span className="text-gray-300 font-medium truncate">{event.title}</span>
                    </div>
                    {(event.company || event.application) && (
                      <div className="text-xs text-gray-500 mt-0.5 truncate">
                        {event.company?.name}
                        {event.company && event.application && ' · '}
                        {event.application?.jobTitle}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Monthly Calendar Grid */}
      <div className="bg-gray-800 rounded-lg p-6">
        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold text-white">
              {monthName} {viewYear}
            </h2>
            <button
              onClick={handleToday}
              className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 rounded border border-gray-600"
            >
              Today
            </button>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handlePrevMonth}
              className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded"
            >
              ←
            </button>
            <button
              onClick={handleNextMonth}
              className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded"
            >
              →
            </button>
          </div>
        </div>

        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {dayLabels.map((label) => (
            <div key={label} className="text-center text-xs font-medium text-gray-400 py-2">
              {label}
            </div>
          ))}
        </div>

        {/* Calendar Cells */}
        <div className="grid grid-cols-7 gap-1">
          {calendarCells.map((day, i) => {
            if (day === null) {
              return <div key={`empty-${i}`} className="h-20 bg-gray-900/30 rounded" />;
            }

            const cellDate = new Date(viewYear, viewMonth, day);
            const dateKey = `${viewYear}-${viewMonth}-${day}`;
            const dayEvents = eventsByDate.get(dateKey) || [];
            const todayCell = isToday(cellDate);
            const pastCell = isPast(cellDate) && !todayCell;

            return (
              <div
                key={`day-${day}`}
                className={`h-20 rounded p-1 transition-colors ${
                  todayCell
                    ? 'bg-blue-900/30 ring-1 ring-blue-500'
                    : pastCell
                      ? 'bg-gray-900/30'
                      : 'bg-gray-700/40'
                } ${dayEvents.length > 0 ? 'cursor-pointer hover:bg-gray-600/40' : ''}`}
                onClick={() => {
                  if (dayEvents.length === 1) {
                    navigate(`/events/${dayEvents[0].id}`);
                  } else if (dayEvents.length > 1) {
                    // Navigate to the first event (could expand to a day view)
                    navigate(`/events/${dayEvents[0].id}`);
                  }
                }}
              >
                {/* Day Number */}
                <div className={`text-xs font-medium mb-0.5 ${
                  todayCell ? 'text-blue-400 font-bold' : pastCell ? 'text-gray-500' : 'text-gray-300'
                }`}>
                  {day}
                </div>
                {/* Event Dots / Badges */}
                <div className="flex flex-wrap gap-0.5">
                  {dayEvents.slice(0, 3).map((event) => {
                    const cfg = EVENT_TYPE_CONFIG[event.type] || EVENT_TYPE_CONFIG.NONE;
                    return (
                      <span
                        key={event.id}
                        className={`inline-block text-xs leading-none ${cfg.color} rounded px-1 py-0.5 text-white truncate max-w-full`}
                        title={`${cfg.icon} ${event.title}${event.company ? ` — ${event.company.name}` : ''}`}
                      >
                        {cfg.icon}
                      </span>
                    );
                  })}
                  {dayEvents.length > 3 && (
                    <span className="text-xs text-gray-400">
                      +{dayEvents.length - 3}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
