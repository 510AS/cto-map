'use client';

import { useState } from 'react';
import { BulkCompleteRequest } from '@/lib/types';
import { useToast } from '@/lib/toast-context';

interface BulkCompleteButtonProps {
  dayId: number;
  category: 'learn' | 'build';
  hasIncompleteItems: boolean;
  onComplete: () => void;
}

/**
 * Button that marks all items in a category as complete via the bulk-complete API.
 * Only visible when at least one incomplete item exists in the category.
 */
export default function BulkCompleteButton({
  dayId,
  category,
  hasIncompleteItems,
  onComplete,
}: BulkCompleteButtonProps) {
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  // Only visible when at least one incomplete item exists
  if (!hasIncompleteItems) {
    return null;
  }

  const handleBulkComplete = async () => {
    setLoading(true);
    try {
      const body: BulkCompleteRequest = { dayId, category };
      const res = await fetch('/api/task-items/bulk-complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to bulk complete items');
      }

      onComplete();
      showToast(`All ${category} items marked complete`, 'success');
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : 'Failed to bulk complete items',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleBulkComplete}
      disabled={loading}
      className="inline-flex items-center gap-1.5 min-h-[44px] min-w-[44px] px-3 py-1.5 text-xs font-medium rounded-md bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-300 dark:hover:bg-green-900/50 border border-green-200 dark:border-green-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      aria-label={`Mark all ${category} items complete`}
    >
      {loading ? (
        <span className="inline-block w-3 h-3 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
      ) : (
        <svg
          className="w-3.5 h-3.5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      )}
      {loading ? 'Completing...' : 'Complete all'}
    </button>
  );
}
