'use client';

import { useState } from 'react';
import { Bookmark, BookmarkFormProps } from '@/lib/types';

/**
 * BookmarkForm allows the user to add a new bookmark.
 * Enhanced with better validation feedback and compact design.
 */
export default function BookmarkForm({ weekId, tagId, onBookmarkAdded }: BookmarkFormProps) {
  const [url, setUrl] = useState('');
  const [label, setLabel] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      setError('URL must begin with http:// or https://');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url,
          label: label || undefined,
          weekId: weekId ?? undefined,
          tagId: tagId ?? undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to save bookmark');
        return;
      }

      const bookmark: Bookmark = await res.json();
      onBookmarkAdded(bookmark);
      setUrl('');
      setLabel('');
    } catch {
      setError('Failed to save bookmark');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card p-4 space-y-3">
      <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Add Bookmark</h2>
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          value={url}
          onChange={(e) => { setUrl(e.target.value); setError(null); }}
          placeholder="https://example.com"
          className="flex-1 min-h-[44px] px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white dark:focus:bg-gray-700 transition-colors dark:placeholder:text-gray-500"
          aria-label="Bookmark URL"
          required
        />
        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Label (optional)"
          className="sm:w-40 min-h-[44px] px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white dark:focus:bg-gray-700 transition-colors dark:placeholder:text-gray-500"
          aria-label="Bookmark label"
        />
        <button
          type="submit"
          disabled={submitting || !url}
          className="min-h-[44px] min-w-[44px] px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {submitting ? '...' : 'Add'}
        </button>
      </div>
      {error && (
        <p className="text-xs text-red-600" role="alert">{error}</p>
      )}
    </form>
  );
}
