import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { applicationsApi } from '../api';
import type { Application, AppState } from '../api';

const COLUMNS: { state: AppState; label: string; color: string }[] = [
  { state: 'INTERESTED', label: 'Interested', color: 'bg-blue-500' },
  { state: 'APPLIED', label: 'Applied', color: 'bg-yellow-500' },
  { state: 'SCREENING', label: 'Screening', color: 'bg-purple-500' },
  { state: 'INTERVIEW', label: 'Interview', color: 'bg-green-500' },
  { state: 'OFFER', label: 'Offer', color: 'bg-emerald-500' },
  { state: 'ACCEPTED', label: 'Accepted', color: 'bg-teal-500' },
  { state: 'REJECTED', label: 'Rejected', color: 'bg-red-500' },
  { state: 'GHOSTED', label: 'Ghosted', color: 'bg-gray-500' },
  { state: 'TRASH', label: 'Trash', color: 'bg-gray-700' },
];

function formatTimeAgo(dateStr: string | null): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'today';
  if (diffDays === 1) return '1d ago';
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return `${Math.floor(diffDays / 30)}mo ago`;
}

interface ApplicationCardProps {
  app: Application;
  onDragStart: (app: Application) => void;
  onClick: () => void;
}

function ApplicationCard({ app, onDragStart, onClick }: ApplicationCardProps) {
  return (
    <div
      draggable
      onDragStart={() => onDragStart(app)}
      onClick={onClick}
      className="bg-gray-700 rounded-lg p-3 cursor-pointer hover:bg-gray-600 transition-colors border border-gray-600 hover:border-gray-500"
    >
      <div className="font-medium text-white truncate">{app.company.name}</div>
      <div className="text-sm text-gray-300 truncate">{app.jobTitle}</div>
      <div className="flex items-center justify-between mt-2">
        <div className="flex gap-1 flex-wrap">
          {app.tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="text-xs bg-gray-600 text-gray-300 px-1.5 py-0.5 rounded"
            >
              {tag}
            </span>
          ))}
        </div>
        <span className="text-xs text-gray-400">
          {formatTimeAgo(app.lastTransitionAt || app.updatedAt)}
        </span>
      </div>
    </div>
  );
}

interface ColumnProps {
  label: string;
  color: string;
  apps: Application[];
  draggingApp: Application | null;
  onDrop: (toState: AppState) => void;
  onDragStart: (app: Application) => void;
  onCardClick: (app: Application) => void;
  isDragOver: boolean;
  onDragOver: () => void;
  onDragLeave: () => void;
}

function Column({
  label,
  color,
  apps,
  draggingApp,
  onDrop,
  onDragStart,
  onCardClick,
  isDragOver,
  onDragOver,
  onDragLeave,
}: ColumnProps) {
  return (
    <div
      className={`flex-shrink-0 w-72 bg-gray-800 rounded-lg flex flex-col max-h-full ${
        isDragOver ? 'ring-2 ring-blue-500' : ''
      }`}
      onDragOver={(e) => {
        e.preventDefault();
        onDragOver();
      }}
      onDragLeave={onDragLeave}
      onDrop={(e) => {
        e.preventDefault();
        onDragLeave();
        if (draggingApp) {
          onDrop(draggingApp.currentState);
        }
      }}
    >
      <div className="p-3 border-b border-gray-700 flex items-center gap-2">
        <div className={`w-3 h-3 rounded-full ${color}`} />
        <span className="font-medium text-white">{label}</span>
        <span className="ml-auto text-sm text-gray-400">{apps.length}</span>
      </div>
      <div className="p-2 flex-1 overflow-y-auto space-y-2">
        {apps.length === 0 ? (
          <div className="text-center text-gray-500 text-sm py-4">
            No applications
          </div>
        ) : (
          apps.map((app) => (
            <ApplicationCard
              key={app.id}
              app={app}
              onDragStart={onDragStart}
              onClick={() => onCardClick(app)}
            />
          ))
        )}
      </div>
    </div>
  );
}

export function BoardPage() {
  const navigate = useNavigate();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState<Application | null>(null);
  const [dragOverState, setDragOverState] = useState<AppState | null>(null);

  const loadData = async () => {
    try {
      const res = await applicationsApi.list();
      setApplications(res.items);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDrop = async (app: Application, toState: AppState) => {
    if (app.currentState === toState) return;

    // Optimistic update
    const prevApps = [...applications];
    setApplications((apps) =>
      apps.map((a) => (a.id === app.id ? { ...a, currentState: toState } : a))
    );
    setDragging(null);

    try {
      await applicationsApi.move(app.id, toState);
    } catch (err) {
      // Revert on error
      setApplications(prevApps);
      setError(err instanceof Error ? err.message : 'Failed to move application');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  const appsByState = COLUMNS.reduce(
    (acc, col) => {
      acc[col.state] = applications.filter((a) => a.currentState === col.state);
      return acc;
    },
    {} as Record<AppState, Application[]>
  );

  return (
    <div className="h-[calc(100vh-8rem)]">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-white">Applications Board</h1>
        <button
          onClick={() => navigate('/applications/new')}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
        >
          + Add Application
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

      <div className="flex gap-4 overflow-x-auto pb-4 h-full">
        {COLUMNS.map((col) => (
          <Column
            key={col.state}
            label={col.label}
            color={col.color}
            apps={appsByState[col.state]}
            draggingApp={dragging}
            onDragStart={setDragging}
            onDrop={() => {
              if (dragging) {
                handleDrop(dragging, col.state);
              }
            }}
            onCardClick={(app) => navigate(`/applications/${app.id}`)}
            isDragOver={dragOverState === col.state}
            onDragOver={() => setDragOverState(col.state)}
            onDragLeave={() => setDragOverState(null)}
          />
        ))}
      </div>
    </div>
  );
}
