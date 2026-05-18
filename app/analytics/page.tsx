"use client";

import { useEffect, useState } from "react";
import CurriculumHeatmap from "@/components/CurriculumHeatmap";
import StreakCalendar from "@/components/StreakCalendar";

interface WeeklyCompletion {
  weekNumber: number;
  completedDays: number;
  totalDays: number;
}

interface DayEntry {
  date: string;
  completed: boolean;
}

interface TagStat {
  name: string;
  totalWeeks: number;
  completedWeeks: number;
}

interface HoursStats {
  totalHours: number;
  averageHoursPerWeek: number;
  weeksTracked: number;
}

interface AnalyticsData {
  weeklyCompletions: WeeklyCompletion[];
  last30Days: DayEntry[];
  tagStats: TagStat[];
  hoursStats: HoursStats;
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const res = await fetch("/api/analytics");
        if (res.ok) {
          setData(await res.json());
        }
      } catch { /* ignore */ }
      finally { setLoading(false); }
    }
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4 animate-fade-in">
        <div className="skeleton h-8 w-32" />
        <div className="skeleton h-48 w-full rounded-xl" />
        <div className="skeleton h-32 w-full rounded-xl" />
      </div>
    );
  }

  if (!data) {
    return <p className="text-gray-500 dark:text-gray-400">Failed to load analytics.</p>;
  }

  // Find max completed days for bar chart scaling
  const maxDays = Math.max(...data.weeklyCompletions.map((w) => w.completedDays), 1);

  return (
    <div className="space-y-8 animate-fade-in">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Analytics</h1>

      {/* Time Stats */}
      <section className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="stat-card">
          <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{data.hoursStats.totalHours.toFixed(0)}h</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Total Hours</p>
        </div>
        <div className="stat-card">
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{data.hoursStats.averageHoursPerWeek.toFixed(1)}h</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Avg Hours/Week</p>
        </div>
        <div className="stat-card">
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">{data.hoursStats.weeksTracked}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Weeks Tracked</p>
        </div>
      </section>

      {/* Completion Trend - Bar Chart */}
      <section className="card p-5">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-4">Completion Trend (Days/Week)</h2>
        <div className="flex items-end gap-0.5 h-32 overflow-x-auto">
          {data.weeklyCompletions.map((w) => {
            const height = maxDays > 0 ? (w.completedDays / maxDays) * 100 : 0;
            return (
              <div key={w.weekNumber} className="flex flex-col items-center flex-shrink-0" style={{ width: '12px' }}>
                <div
                  className={`w-2 rounded-t transition-all ${w.completedDays > 0 ? 'bg-blue-500 dark:bg-blue-400' : 'bg-gray-200 dark:bg-gray-700'}`}
                  style={{ height: `${Math.max(height, 2)}%` }}
                  title={`Week ${w.weekNumber}: ${w.completedDays}/${w.totalDays} days`}
                />
              </div>
            );
          })}
        </div>
        <div className="flex justify-between text-[10px] text-gray-400 dark:text-gray-500 mt-1">
          <span>W1</span>
          <span>W52</span>
        </div>
      </section>

      {/* Enhancement #15: Streak Calendar as real 7-column calendar */}
      <StreakCalendar />

      {/* Tag Coverage */}
      {data.tagStats.length > 0 && (
        <section className="card p-5">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-4">Tag Coverage</h2>
          <div className="space-y-3">
            {data.tagStats.map((tag) => {
              const pct = tag.totalWeeks > 0 ? (tag.completedWeeks / tag.totalWeeks) * 100 : 0;
              return (
                <div key={tag.name}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700 dark:text-gray-300">{tag.name}</span>
                    <span className="text-gray-500 dark:text-gray-400 text-xs">{tag.completedWeeks}/{tag.totalWeeks}</span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-indigo-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Curriculum Heatmap */}
      <CurriculumHeatmap />

      {/* Estimate Accuracy */}
      <EstimateAccuracy />
    </div>
  );
}

function EstimateAccuracy() {
  const [accuracy, setAccuracy] = useState<{ ratio: number; count: number } | null>(null);

  useEffect(() => {
    async function fetchAccuracy() {
      try {
        const res = await fetch('/api/task-items/stats');
        if (res.ok) {
          const data = await res.json();
          if (data.estimateAccuracy) {
            setAccuracy(data.estimateAccuracy);
          }
        }
      } catch { /* ignore */ }
    }
    fetchAccuracy();
  }, []);

  if (!accuracy || accuracy.count === 0) return null;

  const pct = Math.round(accuracy.ratio * 100);
  const isGood = pct >= 80 && pct <= 120;

  return (
    <section className="card p-5 space-y-3">
      <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
        Estimate Accuracy
      </h2>
      <div className="flex items-center gap-4">
        <div className={`text-2xl font-bold ${isGood ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}`}>
          {pct}%
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          <p>Average actual/estimated ratio</p>
          <p>Based on {accuracy.count} tasks with both estimates</p>
        </div>
      </div>
    </section>
  );
}
