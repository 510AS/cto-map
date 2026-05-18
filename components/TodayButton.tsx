'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Floating "Today" button that navigates to the current day.
 * Positioned bottom-right on desktop, above bottom nav on mobile.
 */
export default function TodayButton() {
  const router = useRouter();
  const [todayInfo, setTodayInfo] = useState<{ weekNumber: number; daySort: number } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchToday() {
      try {
        const res = await fetch('/api/today');
        if (res.ok) {
          const data = await res.json();
          setTodayInfo(data);
        }
      } catch {
        // Silently fail — button just won't appear
      }
    }
    fetchToday();
  }, []);

  function handleClick() {
    if (!todayInfo || loading) return;
    setLoading(true);
    router.push(`/week/${todayInfo.weekNumber}/day/${todayInfo.daySort}`);
    setTimeout(() => setLoading(false), 1000);
  }

  if (!todayInfo) return null;

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="fixed bottom-24 md:bottom-6 right-4 z-40 min-h-[44px] min-w-[44px] px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-full shadow-lg hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl transition-all duration-200 flex items-center gap-2 disabled:opacity-50"
      aria-label="Go to today"
      title="Jump to today"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
      <span className="text-sm">Today</span>
    </button>
  );
}
