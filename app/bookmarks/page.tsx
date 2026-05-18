'use client';

import { useEffect, useState, useCallback } from 'react';
import { Bookmark } from '@/lib/types';
import BookmarkForm from '@/components/BookmarkForm';
import { useToast } from '@/lib/toast-context';

interface BookmarkWithRelations {
  id: number;
  url: string;
  label: string | null;
  weekId: number | null;
  tagId: number | null;
  createdAt: string;
  week?: { weekNumber: number; title: string } | null;
  tag?: { id: number; name: string } | null;
}

type GroupBy = 'week' | 'tag';

export default function BookmarksPage() {
  const [bookmarks, setBookmarks] = useState<BookmarkWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [groupBy, setGroupBy] = useState<GroupBy>('week');
  const { showToast } = useToast();

  const fetchBookmarks = useCallback(async () => {
    try {
      const res = await fetch('/api/bookmarks');
      if (res.ok) {
        const data = await res.json();
        setBookmarks(data);
      }
    } catch {
      showToast('Failed to load bookmarks', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { fetchBookmarks(); }, [fetchBookmarks]);

  const handleBookmarkAdded = (bookmark: Bookmark) => {
    fetchBookmarks();
    showToast('Bookmark added', 'success');
  };

  const handleDelete = async (id: number) => {
    // Optimistic delete
    setBookmarks((prev) => prev.filter((b) => b.id !== id));
    try {
      const res = await fetch('/api/bookmarks', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        showToast('Bookmark deleted', 'success');
      } else {
        fetchBookmarks(); // Revert
        showToast('Failed to delete', 'error');
      }
    } catch {
      fetchBookmarks(); // Revert
      showToast('Failed to delete', 'error');
    }
  };

  const groupedBookmarks = groupBookmarks(bookmarks, groupBy);

  if (loading) {
    return (
      <div className="space-y-4 animate-fade-in">
        <div className="skeleton h-8 w-48" />
        <div className="skeleton h-24 w-full rounded-xl" />
        <div className="skeleton h-32 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Bookmarks</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{bookmarks.length} saved resources</p>
        </div>
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          <button
            type="button"
            onClick={() => setGroupBy('week')}
            className={`min-h-[36px] px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              groupBy === 'week' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
            aria-pressed={groupBy === 'week'}
          >
            By Week
          </button>
          <button
            type="button"
            onClick={() => setGroupBy('tag')}
            className={`min-h-[36px] px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              groupBy === 'tag' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
            aria-pressed={groupBy === 'tag'}
          >
            By Tag
          </button>
        </div>
      </div>

      {/* Add Bookmark Form */}
      <BookmarkForm onBookmarkAdded={handleBookmarkAdded} />

      {/* Grouped Bookmarks */}
      {groupedBookmarks.length === 0 ? (
        <div className="text-center py-12 card">
          <p className="text-gray-400 text-lg mb-1">📑</p>
          <p className="text-gray-500">No bookmarks saved yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {groupedBookmarks.map((group) => (
            <div key={group.label} className="card overflow-hidden">
              <div className="bg-gray-50 dark:bg-gray-800/50 px-4 py-2.5 border-b border-gray-100 dark:border-gray-800">
                <h2 className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">{group.label}</h2>
              </div>
              <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                {group.bookmarks.map((bookmark) => (
                  <li key={bookmark.id} className="flex items-center justify-between px-4 py-3 gap-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <div className="flex-1 min-w-0">
                      <a
                        href={bookmark.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium truncate block hover:underline"
                      >
                        {bookmark.label || bookmark.url}
                      </a>
                      {bookmark.label && (
                        <p className="text-xs text-gray-400 dark:text-gray-500 truncate mt-0.5">{bookmark.url}</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDelete(bookmark.id)}
                      className="min-h-[36px] min-w-[36px] flex items-center justify-center text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 rounded-lg transition-colors"
                      aria-label={`Delete bookmark ${bookmark.label || bookmark.url}`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface BookmarkGroup {
  label: string;
  bookmarks: BookmarkWithRelations[];
}

function groupBookmarks(bookmarks: BookmarkWithRelations[], groupBy: GroupBy): BookmarkGroup[] {
  const groups = new Map<string, BookmarkWithRelations[]>();

  for (const bookmark of bookmarks) {
    let key: string;
    if (groupBy === 'week') {
      key = bookmark.week ? `Week ${bookmark.week.weekNumber}: ${bookmark.week.title}` : 'Unassigned';
    } else {
      key = bookmark.tag ? bookmark.tag.name : 'Untagged';
    }
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(bookmark);
  }

  const entries = Array.from(groups.entries()).sort(([a], [b]) => {
    if (a === 'Unassigned' || a === 'Untagged') return 1;
    if (b === 'Unassigned' || b === 'Untagged') return -1;
    return a.localeCompare(b, undefined, { numeric: true });
  });

  return entries.map(([label, bookmarks]) => ({ label, bookmarks }));
}
