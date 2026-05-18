'use client';

import { useState, useEffect, useCallback } from 'react';
import { TaskItemSuggestion } from '@/lib/types';
import { useToast } from '@/lib/toast-context';

interface QuickAddPanelProps {
  dayId: number;
  onSuggestionsAccepted: () => void;
}

/**
 * QuickAddPanel displays template suggestions (from task descriptions) and
 * carry-over suggestions (incomplete items from previous day) with visual distinction.
 * Users can accept individual suggestions or all at once.
 *
 * Requirements: 5.1, 5.2, 5.3, 9.2, 9.3
 */
export default function QuickAddPanel({ dayId, onSuggestionsAccepted }: QuickAddPanelProps) {
  const [suggestions, setSuggestions] = useState<TaskItemSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState<Set<number>>(new Set());
  const [accepted, setAccepted] = useState<Set<number>>(new Set());
  const [acceptingAll, setAcceptingAll] = useState(false);
  const { showToast } = useToast();

  const fetchSuggestions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/task-items/suggestions?dayId=${dayId}`);
      if (!res.ok) throw new Error('Failed to fetch suggestions');
      const data: TaskItemSuggestion[] = await res.json();
      setSuggestions(data);
    } catch {
      showToast('Failed to load suggestions', 'error');
    } finally {
      setLoading(false);
    }
  }, [dayId, showToast]);

  useEffect(() => {
    fetchSuggestions();
  }, [fetchSuggestions]);

  async function acceptSuggestion(suggestion: TaskItemSuggestion, index: number) {
    if (accepted.has(index) || accepting.has(index)) return;

    setAccepting((prev) => new Set(prev).add(index));
    try {
      const res = await fetch('/api/task-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dayId,
          title: suggestion.title,
          category: suggestion.category,
          note: suggestion.sourceNote ?? undefined,
        }),
      });

      if (!res.ok) throw new Error('Failed to create task item');

      setAccepted((prev) => new Set(prev).add(index));
      onSuggestionsAccepted();
    } catch {
      showToast('Failed to add suggestion', 'error');
    } finally {
      setAccepting((prev) => {
        const next = new Set(prev);
        next.delete(index);
        return next;
      });
    }
  }

  async function acceptAll() {
    const remaining = suggestions.filter((_, i) => !accepted.has(i));
    if (remaining.length === 0) return;

    setAcceptingAll(true);
    let successCount = 0;

    for (let i = 0; i < suggestions.length; i++) {
      if (accepted.has(i)) continue;

      const suggestion = suggestions[i];
      try {
        const res = await fetch('/api/task-items', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            dayId,
            title: suggestion.title,
            category: suggestion.category,
            note: suggestion.sourceNote ?? undefined,
          }),
        });

        if (res.ok) {
          setAccepted((prev) => new Set(prev).add(i));
          successCount++;
        }
      } catch {
        // Continue with remaining suggestions
      }
    }

    if (successCount > 0) {
      onSuggestionsAccepted();
      showToast(`Added ${successCount} task${successCount > 1 ? 's' : ''}`, 'success');
    } else {
      showToast('Failed to add suggestions', 'error');
    }

    setAcceptingAll(false);
  }

  if (loading) {
    return (
      <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
        Loading suggestions...
      </div>
    );
  }

  if (suggestions.length === 0) {
    return null;
  }

  const templateSuggestions = suggestions
    .map((s, i) => ({ suggestion: s, index: i }))
    .filter(({ suggestion }) => suggestion.source === 'template');

  const carryOverSuggestions = suggestions
    .map((s, i) => ({ suggestion: s, index: i }))
    .filter(({ suggestion }) => suggestion.source === 'carry-over');

  const allAccepted = suggestions.every((_, i) => accepted.has(i));
  const remainingCount = suggestions.filter((_, i) => !accepted.has(i)).length;

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-4 space-y-4">
      {/* Header with Accept All button */}
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          💡 Suggestions
        </h4>
        {!allAccepted && (
          <button
            onClick={acceptAll}
            disabled={acceptingAll}
            className="text-xs font-medium min-h-[44px] min-w-[44px] px-3 py-1.5 rounded-md bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Accept all suggestions"
          >
            {acceptingAll ? 'Adding...' : `Add All (${remainingCount})`}
          </button>
        )}
      </div>

      {/* Template Suggestions */}
      {templateSuggestions.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-purple-600 dark:text-purple-400 uppercase tracking-wider">
            From task description
          </p>
          <ul className="space-y-1.5" role="list" aria-label="Template suggestions">
            {templateSuggestions.map(({ suggestion, index }) => (
              <SuggestionItem
                key={index}
                suggestion={suggestion}
                isAccepted={accepted.has(index)}
                isAccepting={accepting.has(index) || acceptingAll}
                onAccept={() => acceptSuggestion(suggestion, index)}
                variant="template"
              />
            ))}
          </ul>
        </div>
      )}

      {/* Carry-Over Suggestions */}
      {carryOverSuggestions.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-amber-600 dark:text-amber-400 uppercase tracking-wider">
            ↩ Carry-over from previous day
          </p>
          <ul className="space-y-1.5" role="list" aria-label="Carry-over suggestions">
            {carryOverSuggestions.map(({ suggestion, index }) => (
              <SuggestionItem
                key={index}
                suggestion={suggestion}
                isAccepted={accepted.has(index)}
                isAccepting={accepting.has(index) || acceptingAll}
                onAccept={() => acceptSuggestion(suggestion, index)}
                variant="carry-over"
              />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// SuggestionItem Sub-component
// =============================================================================

function SuggestionItem({
  suggestion,
  isAccepted,
  isAccepting,
  onAccept,
  variant,
}: {
  suggestion: TaskItemSuggestion;
  isAccepted: boolean;
  isAccepting: boolean;
  onAccept: () => void;
  variant: 'template' | 'carry-over';
}) {
  const categoryBadge = suggestion.category === 'learn'
    ? { label: 'Learn', classes: 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300' }
    : { label: 'Build', classes: 'bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300' };

  const borderColor = variant === 'template'
    ? 'border-purple-200 dark:border-purple-800'
    : 'border-amber-200 dark:border-amber-800';

  return (
    <li
      className={`flex items-center gap-2 p-2 rounded-md border transition-all ${
        isAccepted
          ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/40 opacity-60'
          : `${borderColor} bg-white dark:bg-gray-800 hover:shadow-sm`
      }`}
    >
      {/* Category badge */}
      <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${categoryBadge.classes} shrink-0`}>
        {categoryBadge.label}
      </span>

      {/* Title and note */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm truncate ${isAccepted ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-700 dark:text-gray-300'}`}>
          {suggestion.title}
        </p>
        {suggestion.sourceNote && (
          <p className="text-xs text-gray-400 dark:text-gray-500 truncate mt-0.5">
            {suggestion.sourceNote}
          </p>
        )}
      </div>

      {/* Accept button */}
      {isAccepted ? (
        <span className="text-xs text-green-600 dark:text-green-400 font-medium shrink-0">
          ✓ Added
        </span>
      ) : (
        <button
          onClick={onAccept}
          disabled={isAccepting}
          className="text-xs font-medium min-h-[44px] min-w-[44px] px-2.5 py-1 rounded bg-blue-50 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          aria-label={`Add "${suggestion.title}" to checklist`}
        >
          {isAccepting ? '...' : '+ Add'}
        </button>
      )}
    </li>
  );
}
