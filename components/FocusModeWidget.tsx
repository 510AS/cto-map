'use client';

import { useEffect, useState, useCallback } from 'react';
import { TaskItem } from '@/lib/types';
import TaskItemRow from './TaskItemRow';

interface FocusModeWidgetProps {
  dayId: number;
  learnTask: string;
  buildTask: string;
  learnComplete?: boolean;
  buildComplete?: boolean;
}

/**
 * FocusModeWidget is a dashboard widget showing today's checklist items.
 * It allows toggling completion directly from the dashboard.
 * Falls back to existing Learn/Build cards when no task items exist.
 *
 * Requirements: 10.1, 10.2, 10.3, 10.4
 */
export default function FocusModeWidget({
  dayId,
  learnTask,
  buildTask,
  learnComplete = false,
  buildComplete = false,
}: FocusModeWidgetProps) {
  const [learnItems, setLearnItems] = useState<TaskItem[]>([]);
  const [buildItems, setBuildItems] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasItems, setHasItems] = useState(false);

  const fetchItems = useCallback(async () => {
    try {
      const res = await fetch(`/api/task-items?dayId=${dayId}`);
      if (!res.ok) {
        throw new Error('Failed to fetch task items');
      }
      const data = await res.json();
      const learn: TaskItem[] = data.learn ?? [];
      const build: TaskItem[] = data.build ?? [];
      setLearnItems(learn);
      setBuildItems(build);
      setHasItems(learn.length > 0 || build.length > 0);
    } catch {
      // Silently fail on fetch — fallback UI will show
      setHasItems(false);
    } finally {
      setLoading(false);
    }
  }, [dayId]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleToggled = useCallback(
    (updatedItem: TaskItem) => {
      // Update local state to reflect the toggle
      setLearnItems((prev) =>
        prev.map((item) =>
          item.id === updatedItem.id ? updatedItem : item
        )
      );
      setBuildItems((prev) =>
        prev.map((item) =>
          item.id === updatedItem.id ? updatedItem : item
        )
      );
    },
    []
  );

  // Loading state
  if (loading) {
    return (
      <div className="space-y-3 animate-pulse" data-testid="focus-mode-loading">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded" />
      </div>
    );
  }

  // Requirement 10.4: Fall back to Learn/Build cards when no task items exist
  if (!hasItems) {
    return (
      <div className="grid gap-3 sm:grid-cols-2" data-testid="focus-mode-fallback">
        <div
          className={`relative border rounded-xl p-4 transition-all ${
            learnComplete
              ? 'bg-purple-50 dark:bg-purple-950 border-purple-300 dark:border-purple-700'
              : 'bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950 dark:to-purple-900/50 border-purple-200 dark:border-purple-800'
          }`}
        >
          {learnComplete && (
            <div className="absolute top-2 right-2 w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          )}
          <p className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wide mb-2">
            📖 Learn
          </p>
          <p
            className={`text-sm leading-relaxed ${
              learnComplete
                ? 'text-purple-700 dark:text-purple-300 line-through decoration-purple-300'
                : 'text-gray-800 dark:text-gray-200'
            }`}
          >
            {learnTask}
          </p>
        </div>
        <div
          className={`relative border rounded-xl p-4 transition-all ${
            buildComplete
              ? 'bg-emerald-50 dark:bg-emerald-950 border-emerald-300 dark:border-emerald-700'
              : 'bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950 dark:to-emerald-900/50 border-emerald-200 dark:border-emerald-800'
          }`}
        >
          {buildComplete && (
            <div className="absolute top-2 right-2 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          )}
          <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide mb-2">
            🛠️ Build
          </p>
          <p
            className={`text-sm leading-relaxed ${
              buildComplete
                ? 'text-emerald-700 dark:text-emerald-300 line-through decoration-emerald-300'
                : 'text-gray-800 dark:text-gray-200'
            }`}
          >
            {buildTask}
          </p>
        </div>
      </div>
    );
  }

  // Requirement 10.1, 10.2: Interactive checklist widget
  const totalItems = learnItems.length + buildItems.length;
  const completedItems =
    learnItems.filter((i) => i.isComplete).length +
    buildItems.filter((i) => i.isComplete).length;
  const progressPct = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  return (
    <div className="space-y-4" data-testid="focus-mode-widget">
      {/* Progress summary */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {completedItems}/{totalItems} tasks done
        </span>
        <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
          {progressPct}%
        </span>
      </div>
      <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5 overflow-hidden">
        <div
          className="bg-gradient-to-r from-blue-500 to-indigo-500 h-1.5 rounded-full transition-all duration-300"
          style={{ width: `${progressPct}%` }}
          role="progressbar"
          aria-valuenow={progressPct}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>

      {/* Learn items */}
      {learnItems.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wide mb-1.5">
            📖 Learn
          </p>
          <div className="space-y-0.5">
            {learnItems.map((item) => (
              <TaskItemRow key={item.id} item={item} onToggled={handleToggled} />
            ))}
          </div>
        </div>
      )}

      {/* Build items */}
      {buildItems.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide mb-1.5">
            🛠️ Build
          </p>
          <div className="space-y-0.5">
            {buildItems.map((item) => (
              <TaskItemRow key={item.id} item={item} onToggled={handleToggled} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
