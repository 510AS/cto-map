"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useToast } from "@/lib/toast-context";

interface DayPlan {
  id: number;
  dayLabel: string;
  learnTask: string;
  buildTask: string;
  sortOrder: number;
  taskItems?: { id: number; title: string; category: string }[];
}

interface WeekPlanData {
  id: number;
  weekNumber: number;
  title: string;
  goal: string;
  days: DayPlan[];
}

export default function WeekPlanPage() {
  const params = useParams();
  const weekNumber = Number(params.weekNumber);
  const { showToast } = useToast();

  const [week, setWeek] = useState<WeekPlanData | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generatedCount, setGeneratedCount] = useState(0);

  useEffect(() => {
    async function fetchWeek() {
      try {
        const res = await fetch(`/api/weeks/${weekNumber}?include=full`);
        if (res.ok) {
          const data = await res.json();
          setWeek(data);
        }
      } catch { /* ignore */ }
      finally { setLoading(false); }
    }
    if (weekNumber >= 1 && weekNumber <= 52) {
      fetchWeek();
    } else {
      setLoading(false);
    }
  }, [weekNumber]);

  async function handleGenerateAll() {
    if (!week || generating) return;
    setGenerating(true);
    setGeneratedCount(0);

    let totalCreated = 0;

    for (const day of week.days) {
      try {
        // Get suggestions for this day
        const sugRes = await fetch(`/api/task-items/suggestions?dayId=${day.id}`);
        if (!sugRes.ok) continue;
        const suggestions = await sugRes.json();

        // Create each suggestion as a task item
        for (const suggestion of suggestions) {
          try {
            const createRes = await fetch('/api/task-items', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                dayId: day.id,
                title: suggestion.title,
                category: suggestion.category,
              }),
            });
            if (createRes.ok) totalCreated++;
          } catch { /* skip individual failures */ }
        }
      } catch { /* skip day on error */ }

      setGeneratedCount((prev) => prev + 1);
    }

    setGenerating(false);
    showToast(`Created ${totalCreated} sub-tasks across ${week.days.length} days`, "success");

    // Refresh week data
    try {
      const res = await fetch(`/api/weeks/${weekNumber}?include=full`);
      if (res.ok) setWeek(await res.json());
    } catch { /* ignore */ }
  }

  if (loading) {
    return (
      <div className="space-y-4 animate-fade-in">
        <div className="skeleton h-8 w-48" />
        <div className="skeleton h-32 w-full rounded-xl" />
      </div>
    );
  }

  if (!week) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">Week not found.</p>
        <Link href={`/week/${weekNumber}`} className="text-sm text-blue-600 dark:text-blue-400 hover:underline mt-2 inline-block">← Back to Week</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <Link href={`/week/${weekNumber}`} className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Week {weekNumber}</Link>
        <span className="text-gray-300 dark:text-gray-600">/</span>
        <span className="text-gray-700 dark:text-gray-200 font-medium">Plan</span>
      </div>

      {/* Header */}
      <div className="card p-5">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-1">Plan Week {weekNumber}</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">{week.title}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">{week.goal}</p>

        <button
          onClick={handleGenerateAll}
          disabled={generating}
          className="mt-4 min-h-[44px] min-w-[44px] px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-medium rounded-lg hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm flex items-center gap-2"
        >
          {generating ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Generating... ({generatedCount}/{week.days.length} days)</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>Generate All Sub-tasks</span>
            </>
          )}
        </button>
      </div>

      {/* Days Overview */}
      <div className="space-y-4">
        {week.days.sort((a, b) => a.sortOrder - b.sortOrder).map((day) => (
          <div key={day.id} className="card p-4">
            <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-2">{day.dayLabel}</h3>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs">📖</span>
                  <span className="text-xs font-medium text-purple-700 dark:text-purple-300">Learn</span>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300">{day.learnTask}</p>
                {day.taskItems && day.taskItems.filter((t) => t.category === 'learn').length > 0 && (
                  <div className="mt-1 space-y-0.5">
                    {day.taskItems.filter((t) => t.category === 'learn').map((t) => (
                      <p key={t.id} className="text-xs text-gray-500 dark:text-gray-400 pl-3">• {t.title}</p>
                    ))}
                  </div>
                )}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs">🛠️</span>
                  <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">Build</span>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300">{day.buildTask}</p>
                {day.taskItems && day.taskItems.filter((t) => t.category === 'build').length > 0 && (
                  <div className="mt-1 space-y-0.5">
                    {day.taskItems.filter((t) => t.category === 'build').map((t) => (
                      <p key={t.id} className="text-xs text-gray-500 dark:text-gray-400 pl-3">• {t.title}</p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
