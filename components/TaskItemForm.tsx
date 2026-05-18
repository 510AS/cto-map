'use client';

import { useState } from 'react';
import { CreateTaskItemRequest } from '@/lib/types';

interface TaskItemFormProps {
  dayId: number;
  category: 'learn' | 'build';
  onItemCreated: () => void;
}

/**
 * Inline form for adding new task items with title input,
 * optional time estimate, optional note, and optional resource URL.
 */
export default function TaskItemForm({ dayId, category, onItemCreated }: TaskItemFormProps) {
  const [title, setTitle] = useState('');
  const [timeEstimate, setTimeEstimate] = useState('');
  const [note, setNote] = useState('');
  const [resourceUrl, setResourceUrl] = useState('');
  const [priority, setPriority] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const validate = (): string | null => {
    if (!title.trim()) {
      return 'Title is required and cannot be empty';
    }
    if (note.length > 500) {
      return 'Note must be 500 characters or fewer';
    }
    if (timeEstimate !== '') {
      const parsed = Number(timeEstimate);
      if (isNaN(parsed) || parsed <= 0) {
        return 'Time estimate must be a positive number';
      }
    }
    if (resourceUrl.trim() && !resourceUrl.trim().startsWith('http')) {
      return 'Resource URL must start with http:// or https://';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    const body: any = {
      dayId,
      title: title.trim(),
      category,
    };

    if (timeEstimate !== '') {
      body.timeEstimate = Number(timeEstimate);
    }

    if (note.trim()) {
      body.note = note.trim();
    }

    if (resourceUrl.trim()) {
      body.resourceUrl = resourceUrl.trim();
    }

    if (priority) {
      body.priority = priority;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/task-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to create task item');
        return;
      }

      // Reset form on success
      setTitle('');
      setTimeEstimate('');
      setNote('');
      setResourceUrl('');
      setPriority(null);
      setExpanded(false);
      onItemCreated();
    } catch {
      setError('Failed to create task item');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div className="flex gap-2">
        <input
          type="text"
          value={title}
          onChange={(e) => { setTitle(e.target.value); setError(null); }}
          placeholder={`Add ${category} item...`}
          className="flex-1 min-h-[44px] px-3 py-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white dark:focus:bg-gray-700 transition-colors dark:placeholder:text-gray-500"
          aria-label={`New ${category} task title`}
        />
        <button
          type="submit"
          disabled={submitting || !title.trim()}
          className="min-h-[44px] min-w-[44px] px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {submitting ? '...' : 'Add'}
        </button>
      </div>

      {!expanded && title.trim() && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
        >
          + Add time estimate, note, or resource URL
        </button>
      )}

      {expanded && (
        <div className="flex flex-col gap-2 pl-1">
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="number"
              value={timeEstimate}
              onChange={(e) => { setTimeEstimate(e.target.value); setError(null); }}
              placeholder="Minutes (optional)"
              min="1"
              className="sm:w-36 min-h-[32px] px-3 py-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white dark:focus:bg-gray-700 transition-colors dark:placeholder:text-gray-500"
              aria-label="Time estimate in minutes"
            />
            <input
              type="text"
              value={note}
              onChange={(e) => { setNote(e.target.value); setError(null); }}
              placeholder="Note (optional, max 500 chars)"
              maxLength={500}
              className="flex-1 min-h-[32px] px-3 py-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white dark:focus:bg-gray-700 transition-colors dark:placeholder:text-gray-500"
              aria-label="Task note"
            />
          </div>
          <input
            type="url"
            value={resourceUrl}
            onChange={(e) => { setResourceUrl(e.target.value); setError(null); }}
            placeholder="Resource URL (optional)"
            className="min-h-[32px] px-3 py-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white dark:focus:bg-gray-700 transition-colors dark:placeholder:text-gray-500"
            aria-label="Resource URL"
          />
          {/* Priority selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-gray-500 dark:text-gray-400">Difficulty:</span>
            {(['easy', 'medium', 'hard'] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPriority(priority === p ? null : p)}
                className={`min-h-[28px] px-2 py-0.5 text-[10px] font-medium rounded border transition-colors ${
                  priority === p
                    ? p === 'easy' ? 'bg-green-100 dark:bg-green-900/50 border-green-300 dark:border-green-700 text-green-700 dark:text-green-300'
                    : p === 'medium' ? 'bg-yellow-100 dark:bg-yellow-900/50 border-yellow-300 dark:border-yellow-700 text-yellow-700 dark:text-yellow-300'
                    : 'bg-red-100 dark:bg-red-900/50 border-red-300 dark:border-red-700 text-red-700 dark:text-red-300'
                    : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      )}

      {note.length > 0 && (
        <p className="text-xs text-gray-400 dark:text-gray-500 pl-1">
          {note.length}/500 characters
        </p>
      )}

      {error && (
        <p className="text-xs text-red-600 dark:text-red-400 pl-1" role="alert">{error}</p>
      )}
    </form>
  );
}
