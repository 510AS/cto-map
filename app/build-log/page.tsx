"use client";

import { useEffect, useState, useCallback } from "react";
import { useToast } from "@/lib/toast-context";

interface WeekWithBuildLog {
  id: number;
  weekNumber: number;
  title: string;
  buildLogEntry: { id: number; content: string } | null;
}

/**
 * Enhancement #18: Build Log - Smart Visibility
 * - Current week's entry at the top (always expanded, even if empty)
 * - Weeks with content below it (expanded)
 * - Empty weeks hidden completely
 * - "Show all weeks" button at the bottom reveals empty weeks
 * - Shows count: "X of 52 weeks have entries"
 */
export default function BuildLogPage() {
  const [weeks, setWeeks] = useState<WeekWithBuildLog[]>([]);
  const [entries, setEntries] = useState<Record<number, string>>({});
  const [saving, setSaving] = useState<Record<number, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [showAllWeeks, setShowAllWeeks] = useState(false);
  const [currentWeekNumber, setCurrentWeekNumber] = useState<number | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    async function fetchWeeks() {
      try {
        const [buildLogRes, settingsRes] = await Promise.all([
          fetch("/api/build-log"),
          fetch("/api/settings"),
        ]);

        if (buildLogRes.ok) {
          const data: WeekWithBuildLog[] = await buildLogRes.json();
          const sorted = data.sort((a, b) => a.weekNumber - b.weekNumber);
          setWeeks(sorted);
          const initial: Record<number, string> = {};
          for (const week of sorted) {
            initial[week.id] = week.buildLogEntry?.content ?? "";
          }
          setEntries(initial);
        }

        // Determine current week
        if (settingsRes.ok) {
          const settings = await settingsRes.json();
          if (settings.startDate) {
            const start = new Date(settings.startDate);
            const elapsed = Math.floor((Date.now() - start.getTime()) / (1000 * 60 * 60 * 24));
            const weekNum = Math.min(52, Math.max(1, Math.floor(elapsed / 7) + 1));
            setCurrentWeekNumber(weekNum);
          }
        }
      } catch {
        showToast("Failed to load build log", "error");
      } finally {
        setLoading(false);
      }
    }
    fetchWeeks();
  }, [showToast]);

  const handleChange = useCallback((weekId: number, value: string) => {
    setEntries((prev) => ({ ...prev, [weekId]: value }));
  }, []);

  const handleBlur = useCallback(
    async (weekId: number) => {
      const content = entries[weekId] ?? "";
      const week = weeks.find((w) => w.id === weekId);
      const original = week?.buildLogEntry?.content ?? "";
      if (content === original) return;

      setSaving((prev) => ({ ...prev, [weekId]: true }));
      try {
        const res = await fetch("/api/build-log", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ weekId, content }),
        });
        if (res.ok) {
          showToast("Build log saved", "success");
        } else {
          showToast("Failed to save", "error");
        }
      } catch {
        showToast("Failed to save", "error");
      } finally {
        setSaving((prev) => ({ ...prev, [weekId]: false }));
      }
    },
    [entries, weeks, showToast]
  );

  if (loading) {
    return (
      <div className="space-y-4 animate-fade-in">
        <div className="skeleton h-8 w-40" />
        <div className="skeleton h-4 w-72" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="skeleton h-32 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  // Categorize weeks
  const currentWeek = currentWeekNumber
    ? weeks.find((w) => w.weekNumber === currentWeekNumber)
    : null;

  const weeksWithContent = weeks.filter(
    (w) => entries[w.id]?.trim() && w.weekNumber !== currentWeekNumber
  );

  const emptyWeeks = weeks.filter(
    (w) => !entries[w.id]?.trim() && w.weekNumber !== currentWeekNumber
  );

  const totalWithEntries = weeks.filter((w) => entries[w.id]?.trim()).length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Build Log</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Document what you ship each week. Auto-saves when you leave a field.
        </p>
        {/* Enhancement #18: Entry count */}
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
          {totalWithEntries} of {weeks.length} weeks have entries
        </p>
      </div>

      {/* Current week - always shown at top, even if empty */}
      {currentWeek && (
        <div className="space-y-2">
          <h2 className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide">
            Current Week
          </h2>
          <BuildLogCard
            week={currentWeek}
            value={entries[currentWeek.id] ?? ""}
            saving={saving[currentWeek.id] ?? false}
            onChange={handleChange}
            onBlur={handleBlur}
            highlight
          />
        </div>
      )}

      {/* Weeks with content (expanded) */}
      {weeksWithContent.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Weeks with entries
          </h2>
          {weeksWithContent.map((week) => (
            <BuildLogCard
              key={week.id}
              week={week}
              value={entries[week.id] ?? ""}
              saving={saving[week.id] ?? false}
              onChange={handleChange}
              onBlur={handleBlur}
            />
          ))}
        </div>
      )}

      {/* Empty weeks - hidden by default */}
      {emptyWeeks.length > 0 && (
        <div className="space-y-4">
          {showAllWeeks ? (
            <>
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Empty weeks
                </h2>
                <button
                  onClick={() => setShowAllWeeks(false)}
                  className="min-h-[44px] min-w-[44px] px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                >
                  Hide empty weeks
                </button>
              </div>
              {emptyWeeks.map((week) => (
                <BuildLogCard
                  key={week.id}
                  week={week}
                  value={entries[week.id] ?? ""}
                  saving={saving[week.id] ?? false}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
              ))}
            </>
          ) : (
            <button
              onClick={() => setShowAllWeeks(true)}
              className="min-h-[44px] w-full px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              Show all {emptyWeeks.length} empty weeks for manual entry
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function BuildLogCard({
  week,
  value,
  saving,
  onChange,
  onBlur,
  highlight = false,
}: {
  week: WeekWithBuildLog;
  value: string;
  saving: boolean;
  onChange: (weekId: number, value: string) => void;
  onBlur: (weekId: number) => void;
  highlight?: boolean;
}) {
  return (
    <div className={`card p-4 ${highlight ? 'ring-2 ring-blue-200 dark:ring-blue-800' : ''}`}>
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          <span className={`text-xs font-bold mr-1.5 ${highlight ? 'text-blue-600 dark:text-blue-400' : 'text-blue-600 dark:text-blue-400'}`}>
            W{week.weekNumber}
          </span>
          {week.title}
        </h2>
        {saving && (
          <span className="text-xs text-blue-500 dark:text-blue-400 animate-pulse">Saving...</span>
        )}
      </div>
      <textarea
        className="w-full min-h-[80px] p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white dark:focus:bg-gray-700 resize-y transition-colors"
        placeholder="What did you ship this week?"
        value={value}
        onChange={(e) => onChange(week.id, e.target.value)}
        onBlur={() => onBlur(week.id)}
        aria-label={`Build log for Week ${week.weekNumber}: ${week.title}`}
      />
    </div>
  );
}
