'use client';

import { useState, useRef } from 'react';
import { NoteEditorProps } from '@/lib/types';

/**
 * NoteEditor renders a textarea that auto-saves when the user blurs (clicks away).
 * Calls POST /api/notes with the weekId or dayId and content.
 */
export default function NoteEditor({ initialContent, weekId, dayId, onSave }: NoteEditorProps) {
  const [content, setContent] = useState(initialContent);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const lastSavedRef = useRef(initialContent);

  const handleBlur = async () => {
    // Only save if content has changed since last save
    if (content === lastSavedRef.current) {
      return;
    }

    setError(null);
    setSaving(true);
    setSaved(false);

    try {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weekId: weekId ?? undefined,
          dayId: dayId ?? undefined,
          content,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to save note');
        return;
      }

      lastSavedRef.current = content;
      setSaved(true);
      onSave(content);
    } catch (err) {
      setError('Failed to save note');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-2">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onBlur={handleBlur}
        placeholder="Write your notes here..."
        className="w-full min-h-[120px] px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y"
        aria-label="Note editor"
      />
      <div className="flex items-center gap-2 min-h-[24px]">
        {saving && (
          <span className="text-xs text-gray-500">Saving...</span>
        )}
        {saved && !saving && (
          <span className="text-xs text-green-600">Saved</span>
        )}
        {error && (
          <span className="text-xs text-red-600" role="alert">{error}</span>
        )}
      </div>
    </div>
  );
}
