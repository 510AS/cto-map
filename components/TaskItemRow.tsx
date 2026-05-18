'use client';

import { useState } from 'react';
import { TaskItem } from '@/lib/types';
import { useToast } from '@/lib/toast-context';

interface TaskItemRowProps {
  item: TaskItem & { resourceUrl?: string | null; priority?: string | null; actualMinutes?: number | null };
  /** Optional callback invoked after a successful toggle with the updated item */
  onToggled?: (updatedItem: TaskItem) => void;
}

/**
 * TaskItemRow renders a single checklist item with checkbox, title,
 * optional note (secondary text), optional time estimate badge,
 * and optional resource link icon.
 */
export default function TaskItemRow({ item, onToggled }: TaskItemRowProps) {
  const [isComplete, setIsComplete] = useState(item.isComplete);
  const [toggling, setToggling] = useState(false);
  const [showActualInput, setShowActualInput] = useState(false);
  const [actualMinutes, setActualMinutes] = useState('');
  const { showToast } = useToast();

  async function handleToggle() {
    if (toggling) return;

    const newState = !isComplete;

    // Optimistic update
    setIsComplete(newState);
    setToggling(true);

    try {
      const res = await fetch(`/api/task-items/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isComplete: newState }),
      });

      if (!res.ok) {
        throw new Error('Toggle failed');
      }

      const updatedItem: TaskItem = await res.json();
      onToggled?.(updatedItem);

      // Show actual minutes input when completing a task
      if (newState && !item.actualMinutes) {
        setShowActualInput(true);
      }
    } catch {
      // Rollback on failure
      setIsComplete(!newState);
      showToast('Failed to update task — please try again', 'error');
    } finally {
      setToggling(false);
    }
  }

  const categoryColors = item.category === 'learn'
    ? {
        checkbox: isComplete
          ? 'bg-purple-500 border-purple-500'
          : 'border-purple-300 dark:border-purple-600 hover:border-purple-400',
        title: isComplete
          ? 'text-gray-400 dark:text-gray-500 line-through'
          : 'text-gray-900 dark:text-gray-100',
        badge: 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300',
        row: isComplete
          ? 'bg-purple-50/40 dark:bg-purple-950/20'
          : 'hover:bg-gray-50 dark:hover:bg-gray-800/50',
      }
    : {
        checkbox: isComplete
          ? 'bg-emerald-500 border-emerald-500'
          : 'border-emerald-300 dark:border-emerald-600 hover:border-emerald-400',
        title: isComplete
          ? 'text-gray-400 dark:text-gray-500 line-through'
          : 'text-gray-900 dark:text-gray-100',
        badge: 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300',
        row: isComplete
          ? 'bg-emerald-50/40 dark:bg-emerald-950/20'
          : 'hover:bg-gray-50 dark:hover:bg-gray-800/50',
      };

  return (
    <div
      className={`flex items-start gap-3 px-3 py-2 rounded-lg transition-all duration-150 ${categoryColors.row} ${toggling ? 'opacity-70 pointer-events-none' : ''}`}
      data-testid={`task-item-row-${item.id}`}
    >
      {/* Checkbox */}
      <label className="flex items-center justify-center min-h-[36px] min-w-[36px] shrink-0 cursor-pointer">
        <div
          className={`w-[18px] h-[18px] rounded border-2 flex items-center justify-center transition-all duration-200 ${categoryColors.checkbox} ${isComplete ? 'text-white' : ''}`}
        >
          {isComplete && (
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </div>
        <input
          type="checkbox"
          checked={isComplete}
          onChange={handleToggle}
          className="sr-only"
          disabled={toggling}
          aria-label={`Mark "${item.title}" as ${isComplete ? 'incomplete' : 'complete'}`}
        />
      </label>

      {/* Content */}
      <div className="flex-1 min-w-0 pt-1.5">
        <div className="flex items-center gap-2">
          <span className={`text-sm leading-snug ${categoryColors.title} transition-all duration-200`}>
            {item.title}
          </span>
          {item.timeEstimate != null && (
            <span
              className={`inline-flex items-center text-[11px] font-medium px-1.5 py-0.5 rounded ${categoryColors.badge} shrink-0`}
              aria-label={`Estimated time: ${item.timeEstimate} minutes`}
            >
              {item.timeEstimate}m
            </span>
          )}
          {/* Priority dot */}
          {(item as any).priority && (
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                (item as any).priority === 'easy' ? 'bg-green-500' :
                (item as any).priority === 'medium' ? 'bg-yellow-500' :
                'bg-red-500'
              }`}
              title={`Difficulty: ${(item as any).priority}`}
            />
          )}
          {/* Resource URL link icon */}
          {(item as any).resourceUrl && (
            <a
              href={(item as any).resourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 min-h-[28px] min-w-[28px] flex items-center justify-center text-blue-500 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
              aria-label="Open resource link"
              title={(item as any).resourceUrl}
              onClick={(e) => e.stopPropagation()}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          )}
        </div>
        {item.note && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">
            {item.note}
          </p>
        )}
        {/* Actual minutes input - shown when task is just completed */}
        {showActualInput && (
          <div className="flex items-center gap-2 mt-1.5">
            <input
              type="number"
              value={actualMinutes}
              onChange={(e) => setActualMinutes(e.target.value)}
              placeholder="How long? (min)"
              min="0"
              className="w-28 min-h-[28px] px-2 py-0.5 text-xs border border-gray-200 dark:border-gray-700 rounded bg-gray-50 dark:bg-gray-800 dark:text-gray-200 focus:ring-1 focus:ring-blue-500 focus:border-transparent"
              autoFocus
              onKeyDown={async (e) => {
                if (e.key === 'Enter' && actualMinutes) {
                  try {
                    await fetch(`/api/task-items/${item.id}`, {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ actualMinutes: parseInt(actualMinutes) }),
                    });
                    setShowActualInput(false);
                  } catch { /* ignore */ }
                }
                if (e.key === 'Escape') setShowActualInput(false);
              }}
              onBlur={async () => {
                if (actualMinutes) {
                  try {
                    await fetch(`/api/task-items/${item.id}`, {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ actualMinutes: parseInt(actualMinutes) }),
                    });
                  } catch { /* ignore */ }
                }
                setShowActualInput(false);
              }}
            />
            <span className="text-[10px] text-gray-400 dark:text-gray-500">Enter to save, Esc to skip</span>
          </div>
        )}
        {(item as any).actualMinutes && !showActualInput && (
          <span className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
            Actual: {(item as any).actualMinutes}m
          </span>
        )}
      </div>
    </div>
  );
}
