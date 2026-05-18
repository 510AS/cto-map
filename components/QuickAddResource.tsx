'use client';

import { useState } from 'react';
import { useToast } from '@/lib/toast-context';

interface QuickAddResourceProps {
  dayId: number;
  weekId: number;
}

export default function QuickAddResource({ dayId, weekId }: QuickAddResourceProps) {
  const [showInput, setShowInput] = useState(false);
  const [url, setUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { showToast } = useToast();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmedUrl = url.trim();
    if (!trimmedUrl) return;

    if (!trimmedUrl.startsWith('http://') && !trimmedUrl.startsWith('https://')) {
      showToast('URL must start with http:// or https://', 'error');
      return;
    }

    setSubmitting(true);
    try {
      // Create bookmark
      await fetch('/api/bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: trimmedUrl, weekId }),
      });

      // Create task item with the URL
      await fetch('/api/task-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dayId,
          title: `📎 ${trimmedUrl.replace(/^https?:\/\//, '').split('/')[0]}`,
          category: 'learn',
          resourceUrl: trimmedUrl,
        }),
      });

      showToast('Resource added!', 'success');
      setUrl('');
      setShowInput(false);
    } catch {
      showToast('Failed to add resource', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  if (!showInput) {
    return (
      <button
        onClick={() => setShowInput(true)}
        className="min-h-[44px] min-w-[44px] flex items-center gap-2 px-3 py-2 text-xs font-medium text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
        Quick Add Resource
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="url"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="https://..."
        autoFocus
        className="flex-1 min-h-[44px] px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-gray-50 dark:bg-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
      />
      <button
        type="submit"
        disabled={submitting || !url.trim()}
        className="min-h-[44px] min-w-[44px] px-3 py-2 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        {submitting ? '...' : 'Add'}
      </button>
      <button
        type="button"
        onClick={() => { setShowInput(false); setUrl(''); }}
        className="min-h-[44px] min-w-[44px] px-3 py-2 border border-gray-200 dark:border-gray-700 text-xs rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
      >
        Cancel
      </button>
    </form>
  );
}
