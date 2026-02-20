import { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { applicationsApi } from '../api';
import type { SwimlaneApp, AppState } from '../api';
import { LoadingScreen } from '@/components/ui/spinner';
import {
  STATE_COLORS,
  STATE_LABELS,
  TERMINAL_MARKERS,
  isTerminalState,
} from '@/lib/stateColors';

interface Segment {
  state: string;
  startDate: Date;
  endDate: Date;
  color: string;
}

interface TerminalInfo {
  state: string;
  date: Date;
  color: string;
}

interface AppRow {
  id: string;
  label: string;
  company: string;
  currentState: AppState;
  segments: Segment[];
  terminal: TerminalInfo | null;
}

/** Active-state colors used in the legend (non-terminal only) */
const ACTIVE_STATE_COLORS = Object.fromEntries(
  Object.entries(STATE_COLORS).filter(
    ([k]) => !isTerminalState(k) && k !== 'START' && k !== 'INTERESTED' && k !== 'TRASH',
  ),
);

function buildRow(app: SwimlaneApp): { segments: Segment[]; terminal: TerminalInfo | null } {
  const segments: Segment[] = [];
  let terminal: TerminalInfo | null = null;
  const transitions = app.transitions.filter(
    (t) => t.toState !== 'INTERESTED' && t.toState !== 'TRASH',
  );

  if (transitions.length === 0) return { segments, terminal };

  // Check if the last transition is a terminal state
  const lastT = transitions[transitions.length - 1];
  if (isTerminalState(lastT.toState)) {
    terminal = {
      state: lastT.toState,
      date: new Date(lastT.date),
      color: STATE_COLORS[lastT.toState] || '#6b7280',
    };
  }

  // Build segments for non-terminal states only
  // Terminal states contribute their date as the end boundary of the previous segment
  for (let i = 0; i < transitions.length; i++) {
    const t = transitions[i];
    if (isTerminalState(t.toState)) continue;

    const startDate = new Date(t.date);
    let endDate: Date;

    if (i + 1 < transitions.length) {
      endDate = new Date(transitions[i + 1].date);
    } else {
      endDate = new Date(); // ongoing — no terminal state yet
    }

    segments.push({
      state: t.toState,
      startDate,
      endDate,
      color: STATE_COLORS[t.toState] || '#6b7280',
    });
  }

  return { segments, terminal };
}

const ROW_HEIGHT = 10;
const ROW_GAP = 4;
const LABEL_WIDTH = 220;
const CHART_PADDING_RIGHT = 20;
const TOP_AXIS_HEIGHT = 30;

export function SwimlanePage() {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const [data, setData] = useState<SwimlaneApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [daysFilter, setDaysFilter] = useState<number | null>(null);
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    content: string;
  } | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const swimlane = await applicationsApi.getSwimlaneData();
        setData(swimlane);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const { rows, minDate, maxDate, ticks } = useMemo(() => {
    if (data.length === 0)
      return { rows: [], minDate: new Date(), maxDate: new Date(), ticks: [] };

    // Filter by date range if specified
    let filteredData = data;
    if (daysFilter) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysFilter);
      filteredData = data.filter((app) => {
        const appDate = new Date(app.appliedAt);
        return appDate >= cutoffDate;
      });
    }

    const rows: AppRow[] = filteredData
      .map((app) => {
        const { segments, terminal } = buildRow(app);
        return {
          id: app.id,
          label: `${app.company} — ${app.jobTitle}`,
          company: app.company,
          currentState: app.currentState,
          segments,
          terminal,
        };
      })
      .filter((r) => r.segments.length > 0);

    // Find date range across all segments and terminal markers
    let min = Infinity;
    let max = -Infinity;
    for (const row of rows) {
      for (const seg of row.segments) {
        const s = seg.startDate.getTime();
        const e = seg.endDate.getTime();
        if (s < min) min = s;
        if (e > max) max = e;
      }
      if (row.terminal) {
        const t = row.terminal.date.getTime();
        if (t < min) min = t;
        if (t > max) max = t;
      }
    }

    // Add a small padding to the range
    const rangePad = (max - min) * 0.02 || 86400000;
    const minDate = new Date(min - rangePad);
    const maxDate = new Date(max + rangePad);

    // Generate tick marks (roughly monthly or weekly depending on range)
    const rangeMs = maxDate.getTime() - minDate.getTime();
    const rangeDays = rangeMs / 86400000;
    const ticks: { date: Date; label: string }[] = [];

    if (rangeDays > 120) {
      // Monthly ticks
      const cursor = new Date(minDate);
      cursor.setDate(1);
      cursor.setMonth(cursor.getMonth() + 1);
      while (cursor <= maxDate) {
        ticks.push({
          date: new Date(cursor),
          label: cursor.toLocaleDateString('en-US', {
            month: 'short',
            year:
              cursor.getMonth() === 0
                ? 'numeric'
                : undefined,
          }),
        });
        cursor.setMonth(cursor.getMonth() + 1);
      }
    } else if (rangeDays > 30) {
      // Bi-weekly
      const cursor = new Date(minDate);
      cursor.setDate(cursor.getDate() + (7 - cursor.getDay())); // next Sunday
      while (cursor <= maxDate) {
        ticks.push({
          date: new Date(cursor),
          label: cursor.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          }),
        });
        cursor.setDate(cursor.getDate() + 14);
      }
    } else {
      // Weekly
      const cursor = new Date(minDate);
      cursor.setDate(cursor.getDate() + (7 - cursor.getDay()));
      while (cursor <= maxDate) {
        ticks.push({
          date: new Date(cursor),
          label: cursor.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          }),
        });
        cursor.setDate(cursor.getDate() + 7);
      }
    }

    return { rows, minDate, maxDate, ticks };
  }, [data, daysFilter]);

  if (loading) {
    return <LoadingScreen message="Loading timeline data..." />;
  }

  if (error) {
    return (
      <div className="p-3 bg-red-900/50 border border-red-500 rounded text-red-400">
        {error}
      </div>
    );
  }

  const chartHeight = TOP_AXIS_HEIGHT + rows.length * (ROW_HEIGHT + ROW_GAP) + 20;
  const rangeMs = maxDate.getTime() - minDate.getTime();

  function dateToX(date: Date, chartWidth: number): number {
    return ((date.getTime() - minDate.getTime()) / rangeMs) * chartWidth;
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Analytics</h1>
        <p className="text-gray-400 mt-1">
          Application timeline showing the lifecycle of each application
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-1">
        <Link
          to="/analytics/heatmap"
          className="px-4 py-2 rounded-md text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
        >
          Heatmap
        </Link>
        <span className="px-4 py-2 rounded-md text-sm font-medium bg-gray-700 text-white">
          Timeline
        </span>
        <Link
          to="/analytics/sankey"
          className="px-4 py-2 rounded-md text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
        >
          Flow
        </Link>
        <Link
          to="/analytics/distribution"
          className="px-4 py-2 rounded-md text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
        >
          Distribution
        </Link>
        </div>

        {/* Time Range Filter */}
        <div className="flex items-center gap-2">
          <label htmlFor="days-filter" className="text-sm text-gray-400">
            Show:
          </label>
          <select
            id="days-filter"
            value={daysFilter || ''}
            onChange={(e) => setDaysFilter(e.target.value ? Number(e.target.value) : null)}
            className="px-3 py-2 bg-gray-700 text-white text-sm rounded-md border border-gray-600 focus:border-blue-500 focus:outline-none"
          >
            <option value="">All Time</option>
            <option value="30">Last 30 Days</option>
            <option value="60">Last 60 Days</option>
            <option value="90">Last 90 Days</option>
            <option value="180">Last 180 Days</option>
            <option value="365">Last Year</option>
          </select>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p>No application timeline data yet.</p>
          <p className="mt-2 text-sm">
            Applications need to be in APPLIED state or beyond to appear here.
          </p>
        </div>
      ) : (
        <div className="bg-gray-800 rounded-lg p-6">
          {/* Legend */}
          <div className="flex flex-wrap gap-4 mb-4 text-xs">
            {Object.entries(ACTIVE_STATE_COLORS).map(([state, color]) => (
              <div key={state} className="flex items-center gap-1.5">
                <div
                  className="w-3 h-3 rounded-sm"
                  style={{ backgroundColor: color }}
                />
                <span className="text-gray-300">{STATE_LABELS[state] || state}</span>
              </div>
            ))}
            <div className="w-px bg-gray-600 mx-1" />
            {Object.entries(TERMINAL_MARKERS).map(([state, info]) => (
              <div key={state} className="flex items-center gap-1.5">
                <span style={{ color: STATE_COLORS[state] }}>{info.symbol}</span>
                <span className="text-gray-300">{info.label}</span>
              </div>
            ))}
          </div>

          <div className="text-xs text-gray-400 mb-3">
            {rows.length} application{rows.length !== 1 ? 's' : ''} tracked
          </div>

          {/* Chart */}
          <div ref={containerRef} className="overflow-x-auto">
            <div className="flex" style={{ minWidth: '800px' }}>
              {/* Labels column */}
              <div
                className="shrink-0"
                style={{ width: `${LABEL_WIDTH}px` }}
              >
                <div style={{ height: `${TOP_AXIS_HEIGHT}px` }} />
                {rows.map((row) => (
                  <div
                    key={row.id}
                    className="truncate text-xs text-gray-300 hover:text-white cursor-pointer pr-3 flex items-center"
                    style={{
                      height: `${ROW_HEIGHT}px`,
                      marginBottom: `${ROW_GAP}px`,
                    }}
                    title={row.label}
                    onClick={() => navigate(`/applications/${row.id}`)}
                  >
                    <span className="truncate">{row.label}</span>
                  </div>
                ))}
              </div>

              {/* SVG chart area */}
              <div className="flex-1 relative min-w-0">
                <svg
                  width="100%"
                  height={chartHeight}
                  className="block"
                  style={{ minWidth: '500px' }}
                  viewBox={`0 0 1000 ${chartHeight}`}
                  preserveAspectRatio="none"
                >
                  {/* Vertical gridlines and labels */}
                  {ticks.map((tick, i) => {
                    const x = dateToX(tick.date, 1000 - CHART_PADDING_RIGHT);
                    return (
                      <g key={i}>
                        <line
                          x1={x}
                          y1={TOP_AXIS_HEIGHT}
                          x2={x}
                          y2={chartHeight}
                          stroke="#374151"
                          strokeWidth="1"
                          strokeDasharray="4,4"
                        />
                        <text
                          x={x}
                          y={TOP_AXIS_HEIGHT - 8}
                          fill="#9ca3af"
                          fontSize="14"
                          textAnchor="middle"
                        >
                          {tick.label}
                        </text>
                      </g>
                    );
                  })}

                  {/* Application bars */}
                  {rows.map((row, rowIndex) => {
                    const y =
                      TOP_AXIS_HEIGHT +
                      rowIndex * (ROW_HEIGHT + ROW_GAP);
                    const chartW = 1000 - CHART_PADDING_RIGHT;

                    return (
                      <g key={row.id}>
                        {/* Background track */}
                        <rect
                          x={0}
                          y={y + 2}
                          width={chartW}
                          height={ROW_HEIGHT - 4}
                          rx={3}
                          fill="#1f2937"
                        />

                        {/* State segments (non-terminal only) */}
                        {row.segments.map((seg, si) => {
                          const sx = dateToX(seg.startDate, chartW);
                          const ex = dateToX(seg.endDate, chartW);
                          const w = Math.max(ex - sx, 3); // min 3px so tiny segments are visible

                          return (
                            <rect
                              key={si}
                              x={sx}
                              y={y + 2}
                              width={w}
                              height={ROW_HEIGHT - 4}
                              rx={
                                si === 0 && si === row.segments.length - 1
                                  ? 3
                                  : si === 0
                                    ? 3
                                    : si === row.segments.length - 1
                                      ? 3
                                      : 0
                              }
                              fill={seg.color}
                              className="cursor-pointer"
                              onMouseEnter={(e) => {
                                const rect =
                                  e.currentTarget.getBoundingClientRect();
                                const days = Math.max(
                                  1,
                                  Math.round(
                                    (seg.endDate.getTime() -
                                      seg.startDate.getTime()) /
                                      86400000,
                                  ),
                                );
                                setTooltip({
                                  x: rect.left + rect.width / 2,
                                  y: rect.top,
                                  content: `${STATE_LABELS[seg.state] || seg.state}: ${days} day${days !== 1 ? 's' : ''}\n${seg.startDate.toLocaleDateString()} – ${seg.endDate.toLocaleDateString()}`,
                                });
                              }}
                              onMouseLeave={() => setTooltip(null)}
                              onClick={() =>
                                navigate(`/applications/${row.id}`)
                              }
                            />
                          );
                        })}

                        {/* Terminal state marker (emoji/symbol at end of bar) */}
                        {(() => {
                          if (!row.terminal) return null;
                          const marker = TERMINAL_MARKERS[row.terminal.state];
                          if (!marker) return null;
                          const ex = dateToX(row.terminal.date, chartW);
                          const cx = Math.min(ex, chartW - 8);
                          return (
                            <text
                              x={cx}
                              y={y + ROW_HEIGHT / 2}
                              textAnchor="middle"
                              dominantBaseline="central"
                              fill={row.terminal.color}
                              fontSize={row.terminal.state === 'GHOSTED' ? 16 : 14}
                              fontWeight="bold"
                              className="cursor-pointer"
                              onMouseEnter={(e) => {
                                const rect =
                                  e.currentTarget.getBoundingClientRect();
                                setTooltip({
                                  x: rect.left + rect.width / 2,
                                  y: rect.top,
                                  content: `${marker.label}: ${row.terminal!.date.toLocaleDateString()}`,
                                });
                              }}
                              onMouseLeave={() => setTooltip(null)}
                              onClick={() =>
                                navigate(`/applications/${row.id}`)
                              }
                            >
                              {marker.symbol}
                            </text>
                          );
                        })()}
                      </g>
                    );
                  })}

                  {/* Today line */}
                  {(() => {
                    const now = new Date();
                    if (
                      now >= minDate &&
                      now <= maxDate
                    ) {
                      const x = dateToX(now, 1000 - CHART_PADDING_RIGHT);
                      return (
                        <line
                          x1={x}
                          y1={TOP_AXIS_HEIGHT}
                          x2={x}
                          y2={chartHeight}
                          stroke="#3b82f6"
                          strokeWidth="2"
                          strokeDasharray="6,3"
                          opacity={0.6}
                        />
                      );
                    }
                    return null;
                  })()}
                </svg>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tooltip */}
      {tooltip && (
        <div
          className="fixed z-50 bg-gray-900 text-white text-xs px-3 py-2 rounded shadow-lg border border-gray-600 pointer-events-none whitespace-pre-line"
          style={{
            left: `${tooltip.x}px`,
            top: `${tooltip.y - 8}px`,
            transform: 'translate(-50%, -100%)',
          }}
        >
          {tooltip.content}
        </div>
      )}
    </div>
  );
}
