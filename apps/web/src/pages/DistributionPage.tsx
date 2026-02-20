import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Plot from 'react-plotly.js';
import { applicationsApi } from '../api';
import { LoadingScreen } from '@/components/ui/spinner';

const LOCATION_LABELS: Record<string, string> = {
  REMOTE: 'Remote',
  HYBRID: 'Hybrid',
  ONSITE: 'On-site',
  CONTRACT: 'Contract',
  UNSPECIFIED: 'Unspecified',
};

const LOCATION_COLORS: Record<string, string> = {
  REMOTE: '#06b6d4',
  HYBRID: '#8b5cf6',
  ONSITE: '#f59e0b',
  CONTRACT: '#f43f5e',
  UNSPECIFIED: '#6b7280',
};

interface DistributionData {
  locations: Array<{ location: string; count: number }>;
  tags: Array<{ tag: string; count: number }>;
  hot: Array<{ id: string; company: string; jobTitle: string; appliedAt: string | null }>;
}

export function DistributionPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<DistributionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = async () => {
    try {
      const [locations, tags, hotInterviews] = await Promise.all([
        applicationsApi.getWorkLocationDistribution(),
        applicationsApi.getTagDistribution(25),
        applicationsApi.getHotInterviews(),
      ]);

      setData({
        locations: locations.items,
        tags: tags.items,
        hot: hotInterviews.items,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load distribution data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const sortedTags = useMemo(() => (data?.tags ?? []).slice().sort((a, b) => b.count - a.count), [data?.tags]);

  const handleUnhot = async (applicationId: string) => {
    try {
      await applicationsApi.update(applicationId, { hot: false });
      setData((prev) => (prev ? { ...prev, hot: prev.hot.filter((item) => item.id !== applicationId) } : prev));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update hot status');
    }
  };

  if (loading) {
    return <LoadingScreen message="Loading distribution analytics..." />;
  }

  if (error) {
    return <div className="p-3 bg-red-900/50 border border-red-500 rounded text-red-400">{error}</div>;
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Analytics</h1>
        <p className="text-gray-400 mt-1">Distribution insights for work location, tags, and hot interview follow-ups</p>
      </div>

      <div className="flex gap-1 mb-6">
        <Link to="/analytics/heatmap" className="px-4 py-2 rounded-md text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white transition-colors">Heatmap</Link>
        <Link to="/analytics/timeline" className="px-4 py-2 rounded-md text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white transition-colors">Timeline</Link>
        <Link to="/analytics/sankey" className="px-4 py-2 rounded-md text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white transition-colors">Flow</Link>
        <span className="px-4 py-2 rounded-md text-sm font-medium bg-gray-700 text-white">Distribution</span>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-white mb-1">Work Location Distribution</h2>
          <p className="text-sm text-gray-400 mb-4">All-time distribution across remote, hybrid, onsite, and contract roles</p>
          {(data?.locations.length ?? 0) === 0 ? (
            <p className="text-gray-400">No work location data yet.</p>
          ) : (
            <Plot
              data={[
                {
                  type: 'pie',
                  labels: data?.locations.map((item) => LOCATION_LABELS[item.location] ?? item.location),
                  values: data?.locations.map((item) => item.count),
                  marker: {
                    colors: data?.locations.map((item) => LOCATION_COLORS[item.location] ?? '#6b7280'),
                  },
                  textinfo: 'label+percent',
                },
              ]}
              layout={{
                paper_bgcolor: '#1f2937',
                plot_bgcolor: '#1f2937',
                font: { color: '#e5e7eb' },
                margin: { t: 10, r: 10, b: 10, l: 10 },
                height: 360,
                showlegend: false,
              }}
              config={{ displayModeBar: false, responsive: true }}
              style={{ width: '100%', height: '360px' }}
            />
          )}
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-white mb-1">Top Tags</h2>
          <p className="text-sm text-gray-400 mb-4">Top 25 most-used tags across all applications</p>
          {sortedTags.length === 0 ? (
            <p className="text-gray-400">No tag data yet.</p>
          ) : (
            <Plot
              data={[
                {
                  type: 'bar',
                  orientation: 'h',
                  y: sortedTags.map((item) => item.tag).reverse(),
                  x: sortedTags.map((item) => item.count).reverse(),
                  marker: { color: '#3b82f6' },
                },
              ]}
              layout={{
                paper_bgcolor: '#1f2937',
                plot_bgcolor: '#1f2937',
                font: { color: '#e5e7eb' },
                margin: { t: 10, r: 10, b: 40, l: 120 },
                height: 360,
                xaxis: { title: { text: 'Count' }, gridcolor: '#374151' },
                yaxis: { automargin: true },
              }}
              config={{ displayModeBar: false, responsive: true }}
              style={{ width: '100%', height: '360px' }}
            />
          )}
        </div>
      </div>

      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-white mb-1">Hot Interviews</h2>
        <p className="text-sm text-gray-400 mb-4">Priority interview applications currently marked as hot</p>

        {!data || data.hot.length === 0 ? (
          <p className="text-gray-400">No hot interviews right now.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="px-3 py-2 text-left text-gray-300">Company</th>
                  <th className="px-3 py-2 text-left text-gray-300">Position</th>
                  <th className="px-3 py-2 text-left text-gray-300">Applied Date</th>
                  <th className="px-3 py-2 text-right text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.hot.map((item) => (
                  <tr key={item.id} className="border-b border-gray-700/50">
                    <td className="px-3 py-2 text-white">{item.company}</td>
                    <td className="px-3 py-2 text-gray-200">{item.jobTitle}</td>
                    <td className="px-3 py-2 text-gray-300">
                      {item.appliedAt
                        ? new Date(item.appliedAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })
                        : '—'}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => navigate(`/applications/list?applicationId=${item.id}`)}
                          className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
                        >
                          View in List
                        </button>
                        <button
                          onClick={() => handleUnhot(item.id)}
                          className="px-3 py-1 bg-orange-600 hover:bg-orange-500 text-white rounded transition-colors"
                        >
                          Unhot
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
