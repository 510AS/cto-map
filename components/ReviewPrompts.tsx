'use client';

import { useState } from 'react';
import { ReviewPromptsProps, ReviewPromptType } from '@/lib/types';

/** The four fixed weekly review prompts with their labels and keys. */
const PROMPTS: { key: ReviewPromptType; label: string }[] = [
  { key: 'learned', label: 'What did I learn?' },
  { key: 'built', label: 'What did I build?' },
  { key: 'difficult', label: 'What was difficult?' },
  { key: 'differently', label: 'What will I do differently next week?' },
];

/**
 * ReviewPrompts renders four text areas for weekly reflection prompts.
 * Auto-saves each response on blur by calling POST /api/reviews.
 */
export default function ReviewPrompts({ weekId, existingResponses, onSave }: ReviewPromptsProps) {
  const [responses, setResponses] = useState<Record<ReviewPromptType, string>>(() => {
    const initial: Record<ReviewPromptType, string> = {
      learned: '',
      built: '',
      difficult: '',
      differently: '',
    };
    for (const r of existingResponses) {
      if (r.prompt in initial) {
        initial[r.prompt as ReviewPromptType] = r.response;
      }
    }
    return initial;
  });

  const [saving, setSaving] = useState<ReviewPromptType | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleBlur = async (prompt: ReviewPromptType) => {
    const response = responses[prompt];
    setError(null);
    setSaving(prompt);

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weekId, prompt, response }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to save review response');
        return;
      }

      onSave(prompt, response);
    } catch {
      setError('Failed to save review response');
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-800">Weekly Review</h2>
      {PROMPTS.map(({ key, label }) => (
        <div key={key} className="space-y-1">
          <label
            htmlFor={`review-${key}`}
            className="block text-sm font-medium text-gray-700"
          >
            {label}
          </label>
          <textarea
            id={`review-${key}`}
            value={responses[key]}
            onChange={(e) =>
              setResponses((prev) => ({ ...prev, [key]: e.target.value }))
            }
            onBlur={() => handleBlur(key)}
            placeholder="Write your reflection..."
            rows={3}
            className="w-full min-h-[44px] px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y"
            aria-label={label}
          />
          {saving === key && (
            <p className="text-xs text-gray-500">Saving...</p>
          )}
        </div>
      ))}
      {error && (
        <p className="text-sm text-red-600" role="alert">{error}</p>
      )}
    </div>
  );
}
