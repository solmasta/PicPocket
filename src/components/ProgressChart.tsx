import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import type { Horse, TrainingSession } from '../types';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface ProgressChartProps {
  sessions: TrainingSession[];
  horses: Horse[];
}

const COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4',
];

export default function ProgressChart({ sessions, horses }: ProgressChartProps) {
  if (sessions.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
        <p className="text-5xl mb-3">📈</p>
        <p className="text-gray-500 font-medium">No data to visualize yet.</p>
        <p className="text-sm text-gray-400">Log some sessions to see your progress!</p>
      </div>
    );
  }

  // Sort sessions by date
  const sorted = [...sessions].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Last 10 sessions for performance trend (by horse)
  const last10 = sorted.slice(-10);
  const labels = last10.map((s) =>
    new Date(s.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  );

  // Group by horse for multi-line chart
  const horseDatasets = horses
    .filter((h) => sessions.some((s) => s.horseId === h.id))
    .map((horse, idx) => {
      const data = last10.map((s) =>
        s.horseId === horse.id ? s.performanceScore : null
      );
      return {
        label: horse.name,
        data,
        borderColor: COLORS[idx % COLORS.length],
        backgroundColor: `${COLORS[idx % COLORS.length]}20`,
        tension: 0.4,
        fill: false,
        pointRadius: 5,
        pointHoverRadius: 7,
        spanGaps: true,
      };
    });

  const lineData = { labels, datasets: horseDatasets };

  const lineOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' as const },
      title: {
        display: true,
        text: 'Performance Score Trend (Last 10 Sessions)',
        font: { size: 14, weight: 'bold' as const },
        color: '#374151',
      },
    },
    scales: {
      y: {
        min: 0,
        max: 10,
        ticks: { stepSize: 1 },
        grid: { color: '#f3f4f6' },
      },
      x: { grid: { display: false } },
    },
  };

  // Sessions per discipline bar chart
  const disciplineCounts = sessions.reduce<Record<string, number>>((acc, s) => {
    acc[s.discipline] = (acc[s.discipline] ?? 0) + 1;
    return acc;
  }, {});
  const barLabels = Object.keys(disciplineCounts);
  const barData = {
    labels: barLabels,
    datasets: [
      {
        label: 'Sessions',
        data: barLabels.map((d) => disciplineCounts[d]),
        backgroundColor: COLORS.slice(0, barLabels.length),
        borderRadius: 8,
      },
    ],
  };

  const barOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: 'Sessions by Discipline',
        font: { size: 14, weight: 'bold' as const },
        color: '#374151',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { stepSize: 1 },
        grid: { color: '#f3f4f6' },
      },
      x: { grid: { display: false } },
    },
  };

  // Summary stats
  const totalMinutes = sessions.reduce((sum, s) => sum + s.durationMinutes, 0);
  const avgScore =
    sessions.reduce((sum, s) => sum + s.performanceScore, 0) / sessions.length;

  return (
    <div className="space-y-4">
      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Sessions', value: sessions.length, emoji: '📋' },
          {
            label: 'Total Riding Time',
            value: `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`,
            emoji: '⏱',
          },
          {
            label: 'Avg. Performance',
            value: avgScore.toFixed(1) + '/10',
            emoji: '⭐',
          },
        ].map(({ label, value, emoji }) => (
          <div
            key={label}
            className="bg-white rounded-xl shadow p-3 text-center"
          >
            <p className="text-2xl">{emoji}</p>
            <p className="text-lg font-bold text-gray-800">{value}</p>
            <p className="text-xs text-gray-500">{label}</p>
          </div>
        ))}
      </div>

      {/* Line chart */}
      <div className="bg-white rounded-2xl shadow-lg p-4">
        <Line data={lineData} options={lineOptions} />
      </div>

      {/* Bar chart */}
      <div className="bg-white rounded-2xl shadow-lg p-4">
        <Bar data={barData} options={barOptions} />
      </div>
    </div>
  );
}
