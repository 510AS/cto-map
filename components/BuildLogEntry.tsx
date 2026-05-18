'use client';

import { useState, useEffect } from 'react';
import { BuildLogEntryProps } from '@/lib/types';

/**
 * BuildLogEntry renders a textarea for documenting shipped work for a given week.
 * Auto-saves on blur by calling POST /api/build-log with weekId and content.
 */
export default function BuildLogEntry({
  weekId,
  weekNumber,
  initialContent,
  onSave,
}: BuildLogEntryProps) {
  const [content, setContent] = useState(initialContent);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setContent(initialContent);
  }, [initialContent]);

  async function handleBlur() {
    if (content === initialContent) return;

    setSaving(true);
    try {
      const res = await fetch('/api/build-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weekId, content }),
      });

      if (res.ok) {
        onSave(content);
      }
    } catch {
      // Silently fail — user can retry
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label
          htmlFor={`build-log-${weekId}`}
          className="block text-sm font-medium text-gray-700"
        >
          Week {weekNumber} — Build Log
        </label>
        {saving && (
          <span className="text-xs text-blue-500">Saving...</span>
        )}
      </div>
      <textarea
        id={`build-log-${weekId}`}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onBlur={handleBlur}
        rows={6}
        className="block w-full min-h-[44px] px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-base resize-y"
        placeholder="Describe what you built and shipped this week..."
        aria-label={`Build log entry for Week ${weekNumber}`}
      />
    </div>
  );
}
