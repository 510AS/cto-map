'use client';

import { useState } from 'react';
import { useToast } from '@/lib/toast-context';

interface DailyReflectionProps {
  dayId: number;
  initialReflection: string | null;
}

export default function DailyReflection({ dayId, initialReflection }: DailyReflectionProps) {
  const [reflection, setReflection] = useState(initialReflection || '');
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  async function handleBlur() {
    const trimmed = reflection.trim();
    if (trimmed === (initialReflection || '').trim()) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/days/${dayId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reflection: trimmed }),
      });
      if (res.ok) {
        showToast('Reflection saved', 'success');
      } else {
        showToast('Failed to save reflection', 'error');
      }
    } catch {
      showToast('Failed to save reflection', 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="card p-5 space-y-3 border-amber-200 dark:border-amber-800">
      <div className="flex items-center gap-2">
        <span className="text-lg">💡</span>
        <h2 className="text-sm font-semibold text-amber-700 dark:text-amber-300 uppercase tracking-wide">
          Daily Reflection
        </h2>
        {saving && <span className="text-xs text-blue-500">Saving...</span>}
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400">
        What was the key insight today?
      </p>
      <textarea
        value={reflection}
        onChange={(e) => setReflection(e.target.value)}
        onBlur={handleBlur}
        rows={3}
        placeholder="Capture your key insight or takeaway..."
        className="block w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl text-sm resize-y bg-gray-50 dark:bg-gray-800 focus:bg-white dark:focus:bg-gray-700 focus:ring-2 focus:ring-amber-500 focus:border-transparent dark:text-gray-200 dark:placeholder:text-gray-500 transition-colors"
      />
    </section>
  );
}
