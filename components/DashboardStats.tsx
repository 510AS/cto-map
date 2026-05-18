'use client';

import { useProgress } from '@/lib/progress-context';

interface DashboardStatsProps {
  /** Server-provided fallback values */
  initialOverallPct: number;
  initialCompletedDays: number;
  initialTotalDays: number;
  currentStreak: number;
  totalStudyDays: number;
  cumulativeHours: number;
}

/**
 * Enhancement #6: Client component that reads from ProgressContext for real-time updates.
 * Falls back to server-provided values as initial state.
 * Renders the 4 stat cards on the dashboard.
 */
export default function DashboardStats({
  initialOverallPct,
  initialCompletedDays,
  initialTotalDays,
  currentStreak,
  totalStudyDays,
  cumulativeHours,
}: DashboardStatsProps) {
  const { state } = useProgress();

  // Use context values when available (fresher than server data)
  const overallPct = state.lastUpdated > 0 ? state.overallPct : initialOverallPct;
  const completedDays = state.lastUpdated > 0 ? state.totalCompletedDays : initialCompletedDays;
  const totalDays = state.lastUpdated > 0 ? state.totalDays : initialTotalDays;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div className="stat-card">
        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
          {overallPct > 0 && overallPct < 1 ? '<1' : Math.round(overallPct)}%
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Overall</p>
        <p className="text-[10px] text-gray-400 dark:text-gray-500">{completedDays}/{totalDays} days</p>
      </div>
      <div className="stat-card">
        <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{currentStreak}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Day Streak 🔥</p>
      </div>
      <div className="stat-card">
        <p className="text-2xl font-bold text-green-600 dark:text-green-400">{totalStudyDays}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Study Days</p>
      </div>
      <div className="stat-card">
        <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{cumulativeHours.toFixed(0)}h</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Total Hours</p>
      </div>
    </div>
  );
}
