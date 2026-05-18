'use client';

import { useEffect, useState } from 'react';

interface DigestData {
  weekNumber: number;
  title: string;
  tasksCompleted: number;
  totalTasks: number;
  hoursLogged: number;
  currentStreak: number;
  avgConfidence: number | null;
  carryOverCount: number;
  nextWeekPreview: { title: string; goal: string } | null;
}

export default function WeeklySummary() {
  const [data, setData] = useState<DigestData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDigest() {
      try {
        const res = await fetch('/api/weekly-digest');
        if (res.ok) setData(await res.json());
      } catch { /* ignore */ }
      finally { setLoading(false); }
    }
    fetchDigest();
  }, []);

  if (loading || !data) return null;

  const taskPct = data.totalTasks > 0 ? Math.round((data.tasksCompleted / data.totalTasks) * 100) : 0;

  return (
    <section className="card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
          Weekly Summary
        </h3>
        <span className="text-xs text-gray-500 dark:text-gray-400">Week {data.weekNumber}</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="text-center">
          <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{data.tasksCompleted}/{data.totalTasks}</p>
          <p className="text-[10px] text-gray-500 dark:text-gray-400">Tasks Done</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-green-600 dark:text-green-400">{data.hoursLogged}h</p>
          <p className="text-[10px] text-gray-500 dark:text-gray-400">Hours</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-orange-600 dark:text-orange-400">{data.currentStreak}🔥</p>
          <p className="text-[10px] text-gray-500 dark:text-gray-400">Streak</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-purple-600 dark:text-purple-400">
            {data.avgConfidence ? `${data.avgConfidence}★` : '—'}
          </p>
          <p className="text-[10px] text-gray-500 dark:text-gray-400">Confidence</p>
        </div>
      </div>

      {/* Task progress bar */}
      <div>
        <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2 overflow-hidden">
          <div
            className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${taskPct}%` }}
          />
        </div>
      </div>

      {/* Next week preview */}
      {data.nextWeekPreview && (
        <div className="pt-3 border-t border-gray-100 dark:border-gray-800">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Next up:</p>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{data.nextWeekPreview.title}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{data.nextWeekPreview.goal}</p>
        </div>
      )}
    </section>
  );
}
