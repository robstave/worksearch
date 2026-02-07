import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { applicationsApi } from '../api';
import { LoadingScreen } from '@/components/ui/spinner';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['', 'Mon', '', 'Wed', '', 'Fri', ''];

// Green shades like GitHub
const LEVEL_COLORS = [
  'bg-gray-800 border-gray-700',  // 0
  'bg-green-900 border-green-800', // 1
  'bg-green-700 border-green-600', // 2
  'bg-green-500 border-green-400', // 3
  'bg-green-400 border-green-300', // 4+
];

function getLevel(count: number): number {
  if (count === 0) return 0;
  if (count === 1) return 1;
  if (count === 2) return 2;
  if (count <= 4) return 3;
  return 4;
}

interface DayData {
  date: string;
  count: number;
  companies: string[];
}

export function HeatmapPage() {
  const [data, setData] = useState<DayData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hoveredDay, setHoveredDay] = useState<DayData | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await applicationsApi.getTimeline(365);
        setData(res.timeline);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Build weekly grid: 53 columns x 7 rows (Sun=0..Sat=6)
  const { weeks, monthLabels, totalApplications, maxCount } = useMemo(() => {
    if (data.length === 0) return { weeks: [], monthLabels: [], totalApplications: 0, maxCount: 0 };

    // Build a date -> data map
    const dataMap = new Map<string, DayData>();
    let total = 0;
    let max = 0;
    for (const d of data) {
      dataMap.set(d.date, d);
      total += d.count;
      if (d.count > max) max = d.count;
    }

    // Start from 52 weeks ago (Sunday)
    const today = new Date();
    const start = new Date(today);
    start.setDate(start.getDate() - 364);
    // Roll back to the previous Sunday
    while (start.getDay() !== 0) {
      start.setDate(start.getDate() - 1);
    }

    const weeks: (DayData | null)[][] = [];
    const labels: { weekIndex: number; label: string }[] = [];
    let currentWeek: (DayData | null)[] = [];
    let lastMonth = -1;

    const cursor = new Date(start);
    while (cursor <= today) {
      const dayOfWeek = cursor.getDay();
      if (dayOfWeek === 0 && currentWeek.length > 0) {
        weeks.push(currentWeek);
        currentWeek = [];
      }

      const key = cursor.toISOString().split('T')[0];
      const dayData = dataMap.get(key) || { date: key, count: 0, companies: [] };
      currentWeek.push(dayData);

      // Track month labels
      const month = cursor.getMonth();
      if (month !== lastMonth) {
        labels.push({ weekIndex: weeks.length, label: MONTHS[month] });
        lastMonth = month;
      }

      cursor.setDate(cursor.getDate() + 1);
    }
    // Push remaining week
    if (currentWeek.length > 0) {
      weeks.push(currentWeek);
    }

    return { weeks, monthLabels: labels, totalApplications: total, maxCount: max };
  }, [data]);

  if (loading) {
    return <LoadingScreen message="Loading heatmap data..." />;
  }

  if (error) {
    return (
      <div className="p-3 bg-red-900/50 border border-red-500 rounded text-red-400">
        {error}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Analytics</h1>
        <p className="text-gray-400 mt-1">
          Application activity over the past year
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6">
        <span
          className="px-4 py-2 rounded-md text-sm font-medium bg-gray-700 text-white"
        >
          Heatmap
        </span>
        <Link
          to="/analytics/sankey"
          className="px-4 py-2 rounded-md text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
        >
          Flow
        </Link>
      </div>

      <div className="bg-gray-800 rounded-lg p-6">
        {/* Summary */}
        <div className="mb-4 text-sm text-gray-400">
          <span className="text-white font-medium">{totalApplications}</span> application{totalApplications !== 1 ? 's' : ''} in the last year
          {maxCount > 0 && (
            <span className="ml-2">(busiest day: {maxCount})</span>
          )}
        </div>

        {/* Heatmap grid */}
        <div className="overflow-x-auto">
          <div className="inline-block min-w-fit">
            {/* Month labels */}
            <div className="flex ml-8">
              {monthLabels.map((m, i) => {
                const nextLabelWeek = monthLabels[i + 1]?.weekIndex ?? weeks.length;
                const span = nextLabelWeek - m.weekIndex;
                return (
                  <div
                    key={`${m.label}-${m.weekIndex}`}
                    className="text-xs text-gray-400"
                    style={{ width: `${span * 15}px` }}
                  >
                    {span >= 2 ? m.label : ''}
                  </div>
                );
              })}
            </div>

            {/* Grid with day labels */}
            <div className="flex gap-0">
              {/* Day-of-week labels */}
              <div className="flex flex-col gap-[3px] mr-1 pt-0">
                {DAYS.map((label, i) => (
                  <div key={i} className="h-[11px] text-[10px] text-gray-500 leading-[11px] w-7 text-right pr-1">
                    {label}
                  </div>
                ))}
              </div>

              {/* Weeks */}
              <div className="flex gap-[3px]">
                {weeks.map((week, wi) => (
                  <div key={wi} className="flex flex-col gap-[3px]">
                    {Array.from({ length: 7 }, (_, di) => {
                      const day = week[di] || null;
                      if (!day) {
                        return <div key={di} className="w-[11px] h-[11px]" />;
                      }
                      const level = getLevel(day.count);
                      const isToday = day.date === new Date().toISOString().split('T')[0];
                      return (
                        <div
                          key={di}
                          className={`w-[11px] h-[11px] rounded-sm border cursor-pointer transition-all ${LEVEL_COLORS[level]} ${isToday ? 'ring-1 ring-blue-400' : ''}`}
                          onMouseEnter={(e) => {
                            setHoveredDay(day);
                            const rect = e.currentTarget.getBoundingClientRect();
                            setTooltipPos({ x: rect.left + rect.width / 2, y: rect.top });
                          }}
                          onMouseLeave={() => setHoveredDay(null)}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-2 mt-4 text-xs text-gray-400">
              <span>Less</span>
              {LEVEL_COLORS.map((color, i) => (
                <div
                  key={i}
                  className={`w-[11px] h-[11px] rounded-sm border ${color}`}
                />
              ))}
              <span>More</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tooltip */}
      {hoveredDay && (
        <div
          className="fixed z-50 bg-gray-900 text-white text-xs px-3 py-2 rounded shadow-lg border border-gray-600 pointer-events-none"
          style={{
            left: `${tooltipPos.x}px`,
            top: `${tooltipPos.y - 8}px`,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <div className="font-semibold">
            {hoveredDay.count} application{hoveredDay.count !== 1 ? 's' : ''} on{' '}
            {new Date(hoveredDay.date + 'T12:00:00').toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </div>
          {hoveredDay.companies.length > 0 && (
            <div className="mt-1 text-gray-300">
              {hoveredDay.companies.slice(0, 5).map((c, i) => (
                <div key={i}>• {c}</div>
              ))}
              {hoveredDay.companies.length > 5 && (
                <div className="text-gray-500">+{hoveredDay.companies.length - 5} more</div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
