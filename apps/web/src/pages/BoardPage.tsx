import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { applicationsApi } from '../api';
import type { Application, AppState } from '../api';
import { LoadingScreen } from '@/components/ui/spinner';

const COLUMNS: { state: AppState; label: string; color: string }[] = [
  { state: 'INTERESTED', label: 'Interested', color: 'bg-blue-500' },
  { state: 'APPLIED', label: 'Applied', color: 'bg-yellow-500' },
  { state: 'SCREENING', label: 'Screening', color: 'bg-purple-500' },
  { state: 'INTERVIEW', label: 'Interview', color: 'bg-green-500' },
  { state: 'OFFER', label: 'Offer', color: 'bg-emerald-500' },
  { state: 'ACCEPTED', label: 'Accepted', color: 'bg-teal-500' },
  { state: 'DECLINED', label: 'Declined', color: 'bg-orange-500' },
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
  onQuickMove?: (app: Application, toState: AppState) => void;
}

function ApplicationCard({ app, onDragStart, onClick, onQuickMove }: ApplicationCardProps) {
  const handleQuickMove = (e: React.MouseEvent, toState: AppState) => {
    e.stopPropagation();
    onQuickMove?.(app, toState);
  };

  return (
    <div
      draggable
      onDragStart={() => onDragStart(app)}
      onClick={onClick}
      className="bg-gray-700 rounded-lg p-2 cursor-pointer hover:bg-gray-600 transition-colors border border-gray-600 hover:border-gray-500"
    >
      <div className="font-medium text-white text-sm truncate">{app.company.name}</div>
      <div className="text-xs text-gray-300 truncate">{app.jobTitle}</div>
      <div className="flex items-center justify-between mt-1.5">
        <div className="flex gap-1 flex-wrap">
          {app.tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="text-xs bg-gray-600 text-gray-300 px-1 py-0.5 rounded"
            >
              {tag}
            </span>
          ))}
        </div>
        <span className="text-xs text-gray-400">
          {formatTimeAgo(app.lastTransitionAt || app.updatedAt)}
        </span>
      </div>
      {/* Quick action buttons */}
      {(app.currentState === 'INTERESTED' || app.currentState === 'APPLIED') && (
        <div className="flex gap-1 mt-1.5 justify-end">
          {app.currentState === 'INTERESTED' && (
            <button
              onClick={(e) => handleQuickMove(e, 'TRASH')}
              className="p-1 text-gray-500 hover:text-white hover:bg-gray-700 rounded transition-colors"
              title="Move to Trash"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
          {app.currentState === 'APPLIED' && (
            <button
              onClick={(e) => handleQuickMove(e, 'REJECTED')}
              className="p-1 text-gray-500 hover:text-white hover:bg-red-500 rounded transition-colors"
              title="Move to Rejected"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      )}
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
  onQuickMove: (app: Application, toState: AppState) => void;
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
  onQuickMove,
  isDragOver,
  onDragOver,
  onDragLeave,
}: ColumnProps) {
  return (
    <div
      className={`flex-shrink-0 w-52 bg-gray-800 rounded-lg flex flex-col max-h-full ${
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
      <div className="p-2 border-b border-gray-700 flex items-center gap-2">
        <div className={`w-2.5 h-2.5 rounded-full ${color}`} />
        <span className="font-medium text-white text-sm">{label}</span>
        <span className="ml-auto text-xs text-gray-400">{apps.length}</span>
      </div>
      <div className="p-1.5 flex-1 overflow-y-auto space-y-1.5">
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
              onQuickMove={onQuickMove}
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
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollIntervalRef = useRef<number | null>(null);

  // Auto-scroll when dragging near edges
  const handleDragOver = useCallback((e: React.DragEvent) => {
    if (!scrollContainerRef.current || !dragging) return;
    
    const container = scrollContainerRef.current;
    const rect = container.getBoundingClientRect();
    const scrollZone = 80; // pixels from edge to trigger scroll
    const scrollSpeed = 15; // pixels per frame
    
    const mouseX = e.clientX;
    
    // Clear any existing scroll interval
    if (scrollIntervalRef.current) {
      cancelAnimationFrame(scrollIntervalRef.current);
      scrollIntervalRef.current = null;
    }
    
    const scroll = () => {
      if (!scrollContainerRef.current) return;
      
      if (mouseX < rect.left + scrollZone) {
        // Scroll left
        scrollContainerRef.current.scrollLeft -= scrollSpeed;
        scrollIntervalRef.current = requestAnimationFrame(scroll);
      } else if (mouseX > rect.right - scrollZone) {
        // Scroll right
        scrollContainerRef.current.scrollLeft += scrollSpeed;
        scrollIntervalRef.current = requestAnimationFrame(scroll);
      }
    };
    
    if (mouseX < rect.left + scrollZone || mouseX > rect.right - scrollZone) {
      scroll();
    }
  }, [dragging]);

  const stopAutoScroll = useCallback(() => {
    if (scrollIntervalRef.current) {
      cancelAnimationFrame(scrollIntervalRef.current);
      scrollIntervalRef.current = null;
    }
  }, []);

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
    return <LoadingScreen message="Loading board..." />;
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

      <div 
        ref={scrollContainerRef}
        className="flex gap-3 overflow-x-auto pb-4 h-full scroll-smooth"
        onDragOver={handleDragOver}
        onDragEnd={stopAutoScroll}
        onDrop={stopAutoScroll}
      >
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
            onQuickMove={handleDrop}
            isDragOver={dragOverState === col.state}
            onDragOver={() => setDragOverState(col.state)}
            onDragLeave={() => setDragOverState(null)}
          />
        ))}
      </div>
    </div>
  );
}
