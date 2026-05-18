'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import TagFilter from '@/components/TagFilter';
import ProgressBar from '@/components/ProgressBar';
import ChecklistStats from '@/components/ChecklistStats';
import { Tag, Phase, Week, Day, WeekTag } from '@/lib/types';
import { overallCompletionPct, phaseCompletionPct, weekCompletionPct } from '@/lib/calculations';
import { useProgress } from '@/lib/progress-context';
import { useToast } from '@/lib/toast-context';

interface WeekWithRelations extends Week {
  days: (Day & { confidence?: number | null })[];
  tags: (WeekTag & { tag: Tag })[];
  phase: Phase;
}

interface PhaseGroup {
  phase: Phase;
  weeks: WeekWithRelations[];
}

export default function ProgressPage() {
  const [weeks, setWeeks] = useState<WeekWithRelations[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Enhancement #5: Track expanded phases
  const [expandedPhases, setExpandedPhases] = useState<Set<number>>(new Set());
  const [currentPhaseId, setCurrentPhaseId] = useState<number | null>(null);
  const { markWeekComplete } = useProgress();
  const { showToast } = useToast();

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/weeks');
        if (!res.ok) throw new Error('Failed to fetch weeks');
        const data: WeekWithRelations[] = await res.json();
        setWeeks(data);

        const tagMap = new Map<number, Tag>();
        for (const week of data) {
          for (const wt of week.tags) {
            if (wt.tag && !tagMap.has(wt.tag.id)) {
              tagMap.set(wt.tag.id, wt.tag);
            }
          }
        }
        setTags(Array.from(tagMap.values()).sort((a, b) => a.name.localeCompare(b.name)));

        // Determine current phase based on settings/startDate
        try {
          const settingsRes = await fetch('/api/settings');
          if (settingsRes.ok) {
            const settings = await settingsRes.json();
            if (settings.startDate) {
              const start = new Date(settings.startDate);
              const elapsed = Math.floor((Date.now() - start.getTime()) / (1000 * 60 * 60 * 24));
              const currentWeekNum = Math.min(52, Math.max(1, Math.floor(elapsed / 7) + 1));
              const currentWeek = data.find((w) => w.weekNumber === currentWeekNum);
              if (currentWeek) {
                setCurrentPhaseId(currentWeek.phaseId);
                setExpandedPhases(new Set([currentWeek.phaseId]));
              }
            }
          }
        } catch { /* ignore */ }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleToggleWeekComplete = useCallback(async (weekId: number, currentIsComplete: boolean) => {
    const newIsComplete = !currentIsComplete;

    // Optimistic update
    setWeeks((prev) => prev.map((w) => (w.id === weekId ? { ...w, isComplete: newIsComplete } : w)));

    try {
      const res = await fetch(`/api/weeks/${weekId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isComplete: newIsComplete }),
      });
      if (!res.ok) {
        setWeeks((prev) => prev.map((w) => (w.id === weekId ? { ...w, isComplete: currentIsComplete } : w)));
        showToast('Failed to update week', 'error');
      } else {
        markWeekComplete(weekId, newIsComplete);
        showToast(newIsComplete ? 'Week marked complete! 🎉' : 'Week marked incomplete', 'success');
      }
    } catch {
      setWeeks((prev) => prev.map((w) => (w.id === weekId ? { ...w, isComplete: currentIsComplete } : w)));
      showToast('Failed to update week', 'error');
    }
  }, [markWeekComplete, showToast]);

  // Enhancement #5: Toggle phase expansion
  function togglePhase(phaseId: number) {
    setExpandedPhases((prev) => {
      const next = new Set(prev);
      if (next.has(phaseId)) {
        next.delete(phaseId);
      } else {
        next.add(phaseId);
      }
      return next;
    });
  }

  // Filter weeks by selected tags
  const filteredWeeks = selectedTagIds.length === 0
    ? weeks
    : weeks.filter((w) => w.tags.some((wt) => selectedTagIds.includes(wt.tagId)));

  // Group filtered weeks by phase
  const phaseGroups: PhaseGroup[] = [];
  const phaseMap = new Map<number, PhaseGroup>();
  for (const week of filteredWeeks) {
    if (!phaseMap.has(week.phaseId)) {
      phaseMap.set(week.phaseId, { phase: week.phase, weeks: [] });
    }
    phaseMap.get(week.phaseId)!.weeks.push(week);
  }
  for (const group of phaseMap.values()) phaseGroups.push(group);
  phaseGroups.sort((a, b) => a.phase.sortOrder - b.phase.sortOrder);

  const totalCompletedWeeks = weeks.filter((w) => w.isComplete).length;
  const totalCompletedDays = weeks.reduce((sum, w) => sum + w.days.filter((d) => d.isComplete).length, 0);
  const totalDays = weeks.reduce((sum, w) => sum + w.days.length, 0);
  const overallPct = totalDays > 0 ? (totalCompletedDays / totalDays) * 100 : 0;

  if (loading) {
    return (
      <div className="space-y-4 animate-fade-in">
        <div className="skeleton h-8 w-48" />
        <div className="skeleton h-16 w-full rounded-xl" />
        <div className="skeleton h-12 w-full rounded-xl" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="skeleton h-32 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <p className="text-red-600 font-medium">Error: {error}</p>
        <button onClick={() => window.location.reload()} className="text-sm text-blue-600 hover:underline">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Progress</h1>
        <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">
          {totalCompletedDays}/{totalDays} days
        </span>
      </div>

      {/* Overall completion */}
      <div className="card p-5">
        <ProgressBar percentage={overallPct} label="Overall Curriculum" />
      </div>

      {/* Checklist statistics */}
      <ChecklistStats />

      {/* Tag filter */}
      {tags.length > 0 && (
        <div className="card p-4">
          <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Filter by Tag</h2>
          <TagFilter tags={tags} selectedTagIds={selectedTagIds} onSelectionChange={setSelectedTagIds} />
        </div>
      )}

      {/* Phase groups - Enhancement #5: Collapsible */}
      {phaseGroups.map((group) => {
        const completedInPhase = group.weeks.filter((w) => w.isComplete).length;
        const totalInPhase = group.weeks.length;
        const phasePctVal = phaseCompletionPct(completedInPhase, totalInPhase);
        const isExpanded = expandedPhases.has(group.phase.id);
        const isCurrent = group.phase.id === currentPhaseId;

        // Enhancement #11: Check if any day in this phase has low confidence
        const hasLowConfidence = group.weeks.some((w) =>
          w.days.some((d) => d.confidence != null && d.confidence < 3)
        );

        return (
          <section key={group.phase.id} className="card overflow-hidden">
            {/* Phase header - clickable to expand/collapse */}
            <button
              onClick={() => togglePhase(group.phase.id)}
              className="w-full p-4 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800 text-left hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors min-h-[44px]"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <svg
                    className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  <span className="text-lg" aria-hidden="true">{group.phase.badge}</span>
                  <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">{group.phase.name}</h2>
                  {isCurrent && (
                    <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full font-medium">
                      Current
                    </span>
                  )}
                  {/* Enhancement #11: Low confidence badge */}
                  {hasLowConfidence && (
                    <span className="text-xs bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300 px-2 py-0.5 rounded-full font-medium">
                      ⚠️ Review
                    </span>
                  )}
                </div>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  {completedInPhase}/{totalInPhase}
                </span>
              </div>
              <ProgressBar percentage={phasePctVal} />
            </button>

            {/* Week list - with smooth height animation */}
            <div
              className={`transition-all duration-300 ease-in-out overflow-hidden ${
                isExpanded ? 'max-h-[5000px] opacity-100' : 'max-h-0 opacity-0'
              }`}
            >
              <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                {group.weeks
                  .sort((a, b) => a.weekNumber - b.weekNumber)
                  .map((week) => {
                    const completedDays = week.days.filter((d) => d.isComplete).length;
                    const totalDays = week.days.length;
                    const weekPctVal = weekCompletionPct(completedDays, totalDays);

                    // Enhancement #11: Check if any day in this week has low confidence
                    const weekHasLowConfidence = week.days.some(
                      (d) => d.confidence != null && d.confidence < 3
                    );

                    return (
                      <li key={week.id} className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                        {/* Completion toggle */}
                        <button
                          type="button"
                          onClick={() => handleToggleWeekComplete(week.id, week.isComplete)}
                          className={`min-h-[40px] min-w-[40px] flex items-center justify-center rounded-full border-2 transition-all duration-200 shrink-0 ${
                            week.isComplete
                              ? 'bg-green-500 border-green-500 text-white shadow-sm'
                              : 'bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 text-gray-400 hover:border-green-400 hover:text-green-400'
                          }`}
                          aria-label={`Mark week ${week.weekNumber} ${week.isComplete ? 'incomplete' : 'complete'}`}
                          aria-pressed={week.isComplete}
                        >
                          {week.isComplete && (
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </button>

                        {/* Week info — clickable link */}
                        <Link href={`/week/${week.weekNumber}`} className="flex-1 min-w-0 min-h-[44px] group">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-gray-400 dark:text-gray-500">W{week.weekNumber}</span>
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                              {week.title}
                            </p>
                            {/* Enhancement #11: Low confidence badge on week */}
                            {weekHasLowConfidence && (
                              <span className="text-xs bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300 px-1.5 py-0.5 rounded font-medium shrink-0">
                                ⚠️ Review
                              </span>
                            )}
                          </div>
                          {/* Tags */}
                          {week.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {week.tags.slice(0, 3).map((wt) => (
                                <span key={wt.tagId} className="text-[10px] bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-1.5 py-0.5 rounded">
                                  {wt.tag.name}
                                </span>
                              ))}
                              {week.tags.length > 3 && (
                                <span className="text-[10px] text-gray-400 dark:text-gray-500">+{week.tags.length - 3}</span>
                              )}
                            </div>
                          )}
                        </Link>

                        {/* Mini progress */}
                        <div className="flex items-center gap-2 shrink-0">
                          <div className="w-16 bg-gray-100 dark:bg-gray-800 rounded-full h-1.5 overflow-hidden hidden sm:block">
                            <div
                              className={`h-1.5 rounded-full transition-all ${
                                weekPctVal === 100 ? 'bg-green-500' : 'bg-blue-500'
                              }`}
                              style={{ width: `${weekPctVal}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium text-gray-500 dark:text-gray-400 w-8 text-right">
                            {Math.round(weekPctVal)}%
                          </span>
                        </div>
                      </li>
                    );
                  })}
              </ul>
            </div>
          </section>
        );
      })}

      {filteredWeeks.length === 0 && (
        <div className="text-center py-12 card">
          <p className="text-gray-500 dark:text-gray-400">No weeks match the selected tags.</p>
          <button
            onClick={() => setSelectedTagIds([])}
            className="mt-2 text-sm text-blue-600 hover:underline"
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}
