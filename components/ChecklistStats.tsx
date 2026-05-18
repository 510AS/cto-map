'use client';

import { useEffect, useState } from 'react';
import { ChecklistStatsResponse } from '@/lib/types';

/**
 * ChecklistStats displays statistics about checklist usage patterns:
 * average items/day, completion rate, most productive day, and trend.
 * Shows an insufficient data message when fewer than 7 days of data exist.
 */
export default function ChecklistStats() {
  const [stats, setStats] = useState<ChecklistStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch('/api/task-items/stats');
        if (!res.ok) {
          throw new Error('Failed to fetch stats');
        }
        const data: ChecklistStatsResponse = await res.json();
        setStats(data);
      } catch {
        setError('Unable to load statistics');
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="card p-4 animate-pulse">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-3"></div>
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="card p-4 text-sm text-red-600 dark:text-red-400">
        {error || 'No statistics available'}
      </div>
    );
  }

  if (!stats.hasSufficientData) {
    return (
      <div className="card p-4 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg" role="img" aria-label="chart">📊</span>
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Checklist Stats</h3>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Insufficient data for trend analysis. Complete at least 7 days of checklists to see your statistics.
        </p>
      </div>
    );
  }

  const trend = stats.currentWeekRate - stats.previousWeekRate;
  const trendDirection = trend > 0 ? 'up' : trend < 0 ? 'down' : 'flat';
  const trendIcon = trendDirection === 'up' ? '↑' : trendDirection === 'down' ? '↓' : '→';
  const trendColor =
    trendDirection === 'up'
      ? 'text-green-600 dark:text-green-400'
      : trendDirection === 'down'
        ? 'text-red-600 dark:text-red-400'
        : 'text-gray-600 dark:text-gray-400';

  return (
    <div className="card p-4 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950 dark:to-purple-950 border-indigo-200 dark:border-indigo-800">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg" role="img" aria-label="chart">📊</span>
        <h3 className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">Checklist Stats</h3>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Average items per day */}
        <div>
          <p className="text-2xl font-bold text-indigo-700 dark:text-indigo-300">
            {stats.averageItemsPerDay.toFixed(1)}
          </p>
          <p className="text-xs text-indigo-600 dark:text-indigo-400">Avg items/day</p>
        </div>

        {/* Completion rate */}
        <div>
          <p className="text-2xl font-bold text-indigo-700 dark:text-indigo-300">
            {stats.overallCompletionRate.toFixed(0)}%
          </p>
          <p className="text-xs text-indigo-600 dark:text-indigo-400">Completion rate</p>
        </div>

        {/* Most productive day */}
        <div>
          <p className="text-lg font-bold text-indigo-700 dark:text-indigo-300">
            {stats.mostProductiveDay ?? '—'}
          </p>
          <p className="text-xs text-indigo-600 dark:text-indigo-400">Most productive</p>
        </div>

        {/* Trend */}
        <div>
          <p className={`text-lg font-bold ${trendColor}`}>
            {trendIcon} {Math.abs(trend).toFixed(0)}%
          </p>
          <p className="text-xs text-indigo-600 dark:text-indigo-400">Week trend</p>
        </div>
      </div>
    </div>
  );
}
