'use client';

import { useEffect, useState } from 'react';

interface DayEntry {
  date: string;
  completed: boolean;
}

/**
 * Enhancement #15: Streak Calendar rendered as a real 7-column calendar grid (Mon-Sun).
 * Shows last 35 days in a 5-row × 7-column layout with day numbers.
 */
export default function StreakCalendar() {
  const [entries, setEntries] = useState<DayEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/analytics');
        if (res.ok) {
          const data = await res.json();
          setEntries(data.last30Days || []);
        }
      } catch { /* ignore */ }
      finally { setLoading(false); }
    }
    fetchData();
  }, []);

  if (loading) {
    return <div className="skeleton h-48 w-full rounded-xl" />;
  }

  // Build a 35-day calendar grid ending today
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Find the Monday that starts our 5-week grid
  // We want 5 rows (35 days) ending on the current week's Sunday (or today if not Sunday)
  const dayOfWeek = today.getDay(); // 0=Sun, 1=Mon, ...
  const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // days since Monday
  const endOfWeek = new Date(today);
  endOfWeek.setDate(today.getDate() + (6 - mondayOffset)); // end on Sunday
  const startDate = new Date(endOfWeek);
  startDate.setDate(endOfWeek.getDate() - 34); // 35 days total

  // Create a lookup map from entries
  const completedSet = new Set(
    entries.filter((e) => e.completed).map((e) => e.date)
  );

  // Generate 35 cells
  const cells: Array<{ date: Date; dayNum: number; completed: boolean; isToday: boolean; isFuture: boolean }> = [];
  for (let i = 0; i < 35; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    const dateStr = d.toISOString().slice(0, 10);
    const isToday = d.getTime() === today.getTime();
    const isFuture = d.getTime() > today.getTime();
    cells.push({
      date: d,
      dayNum: d.getDate(),
      completed: completedSet.has(dateStr),
      isToday,
      isFuture,
    });
  }

  const dayHeaders = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <section className="card p-5 space-y-3">
      <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
        Streak Calendar
      </h2>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1">
        {dayHeaders.map((day) => (
          <div key={day} className="text-center text-[10px] font-medium text-gray-400 dark:text-gray-500 py-1">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((cell, idx) => (
          <div
            key={idx}
            className={`
              aspect-square flex items-center justify-center rounded-md text-[11px] font-medium transition-all
              ${cell.isFuture
                ? 'bg-gray-50 dark:bg-gray-800/30 text-gray-300 dark:text-gray-600'
                : cell.completed
                  ? 'bg-green-500 dark:bg-green-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
              }
              ${cell.isToday ? 'ring-2 ring-blue-500 dark:ring-blue-400' : ''}
            `}
            title={`${cell.date.toISOString().slice(0, 10)}: ${cell.isFuture ? 'Future' : cell.completed ? 'Completed' : 'Missed'}`}
          >
            {cell.dayNum}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-sm bg-green-500" />
          <span>Completed</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-sm bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700" />
          <span>Missed</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-sm ring-2 ring-blue-500" />
          <span>Today</span>
        </div>
      </div>
    </section>
  );
}
