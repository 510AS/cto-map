'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useToast } from '@/lib/toast-context';

interface ReviewReminder {
  id: number;
  weekId: number;
  nextReview: string;
  interval: number;
  confidence: number;
  week: { weekNumber: number; title: string };
}

/**
 * Shows due review reminders on the dashboard with re-rate buttons.
 */
export default function ReviewsDueSection() {
  const [reminders, setReminders] = useState<ReviewReminder[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    async function fetchReminders() {
      try {
        const res = await fetch('/api/review-reminders');
        if (res.ok) {
          const data = await res.json();
          setReminders(data);
        }
      } catch { /* ignore */ }
      finally { setLoading(false); }
    }
    fetchReminders();
  }, []);

  async function handleRate(reminderId: number, confidence: number) {
    try {
      const res = await fetch(`/api/review-reminders/${reminderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confidence }),
      });
      if (res.ok) {
        setReminders((prev) => prev.filter((r) => r.id !== reminderId));
        showToast('Review rescheduled', 'success');
      }
    } catch {
      showToast('Failed to update', 'error');
    }
  }

  if (loading || reminders.length === 0) return null;

  return (
    <section className="card p-5 space-y-3 border-amber-200 dark:border-amber-800">
      <div className="flex items-center gap-2">
        <span className="text-lg">🔄</span>
        <h3 className="text-sm font-semibold text-amber-700 dark:text-amber-300 uppercase tracking-wide">Reviews Due</h3>
        <span className="text-xs bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-full">{reminders.length}</span>
      </div>
      <div className="space-y-3">
        {reminders.map((reminder) => (
          <div key={reminder.id} className="flex items-center justify-between gap-3 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg">
            <div className="flex-1 min-w-0">
              <Link
                href={`/week/${reminder.week.weekNumber}`}
                className="text-sm font-medium text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400"
              >
                Week {reminder.week.weekNumber}: {reminder.week.title}
              </Link>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => handleRate(reminder.id, star)}
                  className="min-h-[36px] min-w-[36px] flex items-center justify-center text-lg hover:scale-110 transition-transform text-gray-300 dark:text-gray-600 hover:text-yellow-500"
                  aria-label={`Rate ${star} out of 5`}
                  title={`Confidence: ${star}/5`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
