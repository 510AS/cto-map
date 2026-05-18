'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';

/**
 * Global keyboard shortcuts handler.
 * - Cmd/Ctrl+K → /search
 * - T → navigate to today
 * - [ → previous day/week
 * - ] → next day/week
 */
export default function KeyboardShortcuts() {
  const router = useRouter();
  const pathname = usePathname();
  const [showHelp, setShowHelp] = useState(false);

  const handleKeyDown = useCallback(async (e: KeyboardEvent) => {
    // Don't trigger shortcuts when typing in inputs
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      return;
    }

    // Cmd/Ctrl+K → Search
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      router.push('/search');
      return;
    }

    // T → Today
    if (e.key === 't' || e.key === 'T') {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      try {
        const res = await fetch('/api/today');
        if (res.ok) {
          const data = await res.json();
          router.push(`/week/${data.weekNumber}/day/${data.daySort}`);
        }
      } catch { /* ignore */ }
      return;
    }

    // ? → Show help
    if (e.key === '?' && !e.metaKey && !e.ctrlKey) {
      setShowHelp((prev) => !prev);
      return;
    }

    // [ → Previous
    if (e.key === '[' && !e.metaKey && !e.ctrlKey) {
      navigatePrevNext('prev');
      return;
    }

    // ] → Next
    if (e.key === ']' && !e.metaKey && !e.ctrlKey) {
      navigatePrevNext('next');
      return;
    }
  }, [pathname, router]);

  function navigatePrevNext(direction: 'prev' | 'next') {
    // Match /week/X/day/Y pattern
    const dayMatch = pathname.match(/\/week\/(\d+)\/day\/(\d+)/);
    if (dayMatch) {
      const weekNum = parseInt(dayMatch[1]);
      const daySort = parseInt(dayMatch[2]);

      if (direction === 'prev') {
        if (daySort > 1) {
          router.push(`/week/${weekNum}/day/${daySort - 1}`);
        } else if (weekNum > 1) {
          router.push(`/week/${weekNum - 1}`);
        }
      } else {
        if (daySort < 6) {
          router.push(`/week/${weekNum}/day/${daySort + 1}`);
        } else if (weekNum < 52) {
          router.push(`/week/${weekNum + 1}`);
        }
      }
      return;
    }

    // Match /week/X pattern
    const weekMatch = pathname.match(/\/week\/(\d+)$/);
    if (weekMatch) {
      const weekNum = parseInt(weekMatch[1]);
      if (direction === 'prev' && weekNum > 1) {
        router.push(`/week/${weekNum - 1}`);
      } else if (direction === 'next' && weekNum < 52) {
        router.push(`/week/${weekNum + 1}`);
      }
    }
  }

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <>
      {showHelp && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowHelp(false)}>
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-2xl p-6 max-w-sm w-full mx-4 animate-bounce-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Keyboard Shortcuts</h2>
              <button
                onClick={() => setShowHelp(false)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                aria-label="Close shortcuts help"
              >
                ✕
              </button>
            </div>
            <div className="space-y-3">
              <ShortcutRow keys={['⌘', 'K']} description="Open Search" />
              <ShortcutRow keys={['T']} description="Jump to Today" />
              <ShortcutRow keys={['[']} description="Previous Day/Week" />
              <ShortcutRow keys={[']']} description="Next Day/Week" />
              <ShortcutRow keys={['?']} description="Toggle this help" />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function ShortcutRow({ keys, description }: { keys: string[]; description: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-600 dark:text-gray-300">{description}</span>
      <div className="flex items-center gap-1">
        {keys.map((key, i) => (
          <kbd key={i} className="px-2 py-1 text-xs font-mono bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-gray-700 dark:text-gray-300">
            {key}
          </kbd>
        ))}
      </div>
    </div>
  );
}
