"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import TagFilter from "@/components/TagFilter";
import { Tag } from "@/lib/types";

interface TimelineWeek {
  id: number;
  weekNumber: number;
  title: string;
  saasEvolution: string;
  isComplete: boolean;
  phaseId: number;
  tags: { tagId: number; tag: { id: number; name: string } }[];
}

interface TimelinePhase {
  id: number;
  name: string;
  badge: string;
  sortOrder: number;
  weeks: TimelineWeek[];
}

export default function TimelinePage() {
  const [phases, setPhases] = useState<TimelinePhase[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/timeline");
        if (!res.ok) throw new Error("Failed to fetch timeline data");
        const data = await res.json();
        setPhases(data.phases);
        setTags(data.tags);
      } catch {
        setError("Failed to load timeline data.");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const filteredPhases = phases
    .map((phase) => ({
      ...phase,
      weeks: phase.weeks.filter((week) => {
        if (selectedTagIds.length === 0) return true;
        return week.tags.some((wt) => selectedTagIds.includes(wt.tagId));
      }),
    }))
    .filter((phase) => phase.weeks.length > 0);

  // Calculate overall stats
  const totalWeeks = phases.reduce((sum, p) => sum + p.weeks.length, 0);
  const completedWeeks = phases.reduce((sum, p) => sum + p.weeks.filter((w) => w.isComplete).length, 0);

  if (loading) {
    return (
      <div className="space-y-4 animate-fade-in">
        <div className="skeleton h-8 w-56" />
        <div className="skeleton h-12 w-full rounded-xl" />
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="skeleton h-20 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Timeline</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">SaaS Evolution Journey</p>
        </div>
        <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">
          {completedWeeks}/{totalWeeks} complete
        </span>
      </div>

      {/* Tag Filter */}
      {tags.length > 0 && (
        <div className="card p-4">
          <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Filter by Tag</h2>
          <TagFilter tags={tags} selectedTagIds={selectedTagIds} onSelectionChange={setSelectedTagIds} />
        </div>
      )}

      {/* Timeline grouped by phase */}
      <div className="space-y-8">
        {filteredPhases.map((phase) => {
          const phaseComplete = phase.weeks.filter((w) => w.isComplete).length;
          return (
            <section key={phase.id} aria-labelledby={`phase-${phase.id}`}>
              {/* Phase header */}
              <div className="sticky top-0 bg-gray-50/95 dark:bg-gray-950/95 backdrop-blur-sm z-10 pb-3 pt-1 -mx-4 px-4 sm:-mx-6 sm:px-6">
                <div className="flex items-center justify-between">
                  <h2 id={`phase-${phase.id}`} className="text-base font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                    <span>{phase.badge}</span>
                    {phase.name}
                  </h2>
                  <span className="text-xs text-gray-500 dark:text-gray-400">{phaseComplete}/{phase.weeks.length}</span>
                </div>
              </div>

              {/* Weeks in this phase */}
              <div className="relative pl-6 border-l-2 border-gray-200 dark:border-gray-700 space-y-3 ml-2">
                {phase.weeks.map((week) => (
                  <Link
                    key={week.id}
                    href={`/week/${week.weekNumber}`}
                    className={`block relative min-h-[44px] p-4 rounded-xl border transition-all duration-150 hover:shadow-md ${
                      week.isComplete
                        ? "bg-green-50/80 dark:bg-green-950/40 border-green-200 dark:border-green-800 hover:bg-green-50 dark:hover:bg-green-950/60"
                        : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800"
                    }`}
                  >
                    {/* Timeline dot */}
                    <div
                      className={`absolute -left-[calc(1.5rem+5px)] top-5 w-3 h-3 rounded-full border-2 transition-colors ${
                        week.isComplete
                          ? "bg-green-500 border-green-600"
                          : "bg-white dark:bg-gray-900 border-gray-400 dark:border-gray-600"
                      }`}
                      aria-hidden="true"
                    />

                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-semibold text-gray-400 dark:text-gray-500">W{week.weekNumber}</span>
                          {week.isComplete && (
                            <span className="badge-green text-[10px]">✓</span>
                          )}
                        </div>
                        <h3 className={`mt-0.5 text-sm font-medium ${week.isComplete ? "text-green-900 dark:text-green-200" : "text-gray-900 dark:text-gray-100"}`}>
                          {week.title}
                        </h3>
                        <p className={`mt-1 text-xs line-clamp-1 ${week.isComplete ? "text-green-600 dark:text-green-400" : "text-gray-500 dark:text-gray-400"}`}>
                          {week.saasEvolution}
                        </p>
                      </div>

                      <svg className="w-4 h-4 text-gray-300 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>

                    {/* Tags */}
                    {week.tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {week.tags.slice(0, 4).map((wt) => (
                          <span
                            key={wt.tagId}
                            className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                              week.isComplete ? "bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300" : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
                            }`}
                          >
                            {wt.tag.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      {filteredPhases.length === 0 && (
        <div className="text-center py-12 card">
          <p className="text-gray-500">No weeks match the selected tag filters.</p>
          <button onClick={() => setSelectedTagIds([])} className="mt-2 text-sm text-blue-600 hover:underline">
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}
