import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Plot from 'react-plotly.js';
import { applicationsApi } from '../api';
import { LoadingScreen } from '@/components/ui/spinner';

export function SankeyPage() {
  const [data, setData] = useState<{
    nodes: Array<{ name: string }>;
    links: Array<{ source: number; target: number; value: number }>;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        const sankeyData = await applicationsApi.getSankeyData();
        setData(sankeyData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) {
    return <LoadingScreen message="Loading analytics..." />;
  }

  if (error) {
    return (
      <div className="p-3 bg-red-900/50 border border-red-500 rounded text-red-400">
        {error}
      </div>
    );
  }

  if (!data || data.nodes.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <p>No application flow data yet.</p>
        <p className="mt-2 text-sm">Start applying to jobs to see your application journey!</p>
      </div>
    );
  }

  // Color map for states
  const colorMap: Record<string, string> = {
    START: '#6b7280',
    INTERESTED: '#3b82f6',
    APPLIED: '#eab308',
    SCREENING: '#a855f7',
    INTERVIEW: '#22c55e',
    INTERVIEW_2: '#16a34a',
    INTERVIEW_3: '#15803d',
    OFFER: '#10b981',
    ACCEPTED: '#14b8a6',
    REJECTED: '#ef4444',
    GHOSTED: '#9ca3af',
    TRASH: '#374151',
  };

  const nodeColors = data.nodes.map((node) => colorMap[node.name] || '#6b7280');

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Analytics</h1>
        <p className="text-gray-400 mt-1">
          Sankey diagram showing how your applications move through different states
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6">
        <Link
          to="/analytics/heatmap"
          className="px-4 py-2 rounded-md text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
        >
          Heatmap
        </Link>
        <span
          className="px-4 py-2 rounded-md text-sm font-medium bg-gray-700 text-white"
        >
          Flow
        </span>
      </div>

      <div className="bg-gray-800 rounded-lg p-6">
        <Plot
          data={[
            {
              type: 'sankey',
              orientation: 'h',
              node: {
                pad: 15,
                thickness: 20,
                line: {
                  color: '#1f2937',
                  width: 2,
                },
                label: data.nodes.map((n) => n.name),
                color: nodeColors,
              },
              link: {
                source: data.links.map((l) => l.source),
                target: data.links.map((l) => l.target),
                value: data.links.map((l) => l.value),
                color: data.links.map((l) => {
                  const sourceNode = data.nodes[l.source];
                  return colorMap[sourceNode.name] + '40'; // Add transparency
                }),
              },
            },
          ]}
          layout={{
            title: {
              text: '',
            },
            font: {
              size: 12,
              color: '#e5e7eb',
            },
            paper_bgcolor: '#1f2937',
            plot_bgcolor: '#1f2937',
            height: 600,
            margin: { t: 20, r: 20, b: 20, l: 20 },
          }}
          config={{
            displayModeBar: false,
            responsive: true,
          }}
          style={{ width: '100%', height: '600px' }}
        />

        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(colorMap)
            .filter(([key]) => data.nodes.some((n) => n.name === key))
            .map(([state, color]) => (
              <div key={state} className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: color }}
                />
                <span className="text-sm text-gray-300">{state}</span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
