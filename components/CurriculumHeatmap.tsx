'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface HeatmapCell {
  id: number;
  weekNumber: number;
  weekTitle: string;
  dayLabel: string;
  sortOrder: number;
  status: 'complete' | 'in-progress' | 'not-started' | 'skipped';
}

export default function CurriculumHeatmap() {
  const [cells, setCells] = useState<HeatmapCell[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredCell, setHoveredCell] = useState<HeatmapCell | null>(null);

  useEffect(() => {
    async function fetchHeatmap() {
      try {
        const res = await fetch('/api/heatmap');
        if (res.ok) setCells(await res.json());
      } catch { /* ignore */ }
      finally { setLoading(false); }
    }
    fetchHeatmap();
  }, []);

  if (loading) {
    return <div className="skeleton h-40 w-full rounded-xl" />;
  }

  // Group by week (columns) and day (rows)
  const weeks: Map<number, HeatmapCell[]> = new Map();
  for (const cell of cells) {
    if (!weeks.has(cell.weekNumber)) weeks.set(cell.weekNumber, []);
    weeks.get(cell.weekNumber)!.push(cell);
  }

  const statusColors: Record<string, string> = {
    complete: 'bg-green-500 dark:bg-green-400',
    'in-progress': 'bg-blue-500 dark:bg-blue-400',
    'not-started': 'bg-gray-200 dark:bg-gray-700',
    skipped: 'bg-gray-300 dark:bg-gray-600 bg-stripes',
  };

  return (
    <section className="card p-5 space-y-4">
      <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
        Curriculum Heatmap
      </h2>

      {/* Tooltip */}
      {hoveredCell && (
        <div className="text-xs text-gray-600 dark:text-gray-400">
          Week {hoveredCell.weekNumber}: {hoveredCell.weekTitle} — {hoveredCell.dayLabel}
        </div>
      )}

      {/* Grid: 52 columns × 6 rows */}
      <div className="overflow-x-auto">
        <div className="grid gap-[2px]" style={{ gridTemplateColumns: 'repeat(52, minmax(8px, 1fr))' }}>
          {[1, 2, 3, 4, 5, 6].map((daySort) => (
            Array.from(weeks.entries()).map(([weekNum, days]) => {
              const cell = days.find((d) => d.sortOrder === daySort);
              if (!cell) {
                return <div key={`${weekNum}-${daySort}`} className="aspect-square rounded-[2px] bg-gray-100 dark:bg-gray-800" />;
              }
              return (
                <Link
                  key={`${weekNum}-${daySort}`}
                  href={`/week/${cell.weekNumber}/day/${cell.sortOrder}`}
                  className={`aspect-square rounded-[2px] transition-all hover:scale-150 hover:z-10 ${statusColors[cell.status]}`}
                  onMouseEnter={() => setHoveredCell(cell)}
                  onMouseLeave={() => setHoveredCell(null)}
                  title={`W${cell.weekNumber} ${cell.dayLabel}: ${cell.status}`}
                />
              );
            })
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-sm bg-green-500 dark:bg-green-400" />
          <span>Complete</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-sm bg-blue-500 dark:bg-blue-400" />
          <span>In Progress</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-sm bg-gray-200 dark:bg-gray-700" />
          <span>Not Started</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-sm bg-gray-300 dark:bg-gray-600" />
          <span>Skipped</span>
        </div>
      </div>
    </section>
  );
}
