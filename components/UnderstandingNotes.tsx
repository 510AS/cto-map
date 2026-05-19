'use client';

import { useState, useEffect, useRef } from 'react';
import { useToast } from '@/lib/toast-context';

interface Note {
  id: number;
  content: string;
  confidence: number;
  aiScore: number | null;
  aiFeedback: string | null;
  aiSuggestions: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface UnderstandingNotesProps {
  taskItemId: number;
  taskTitle: string;
}

export default function UnderstandingNotes({ taskItemId, taskTitle }: UnderstandingNotesProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [content, setContent] = useState('');
  const [confidence, setConfidence] = useState(3);
  const [saving, setSaving] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load existing notes
  useEffect(() => {
    async function fetchNotes() {
      try {
        const res = await fetch(`/api/understanding-notes?taskItemId=${taskItemId}`);
        if (res.ok) {
          const data = await res.json();
          setNotes(data);
          // Load the latest note content
          if (data.length > 0) {
            setContent(data[0].content);
            setConfidence(data[0].confidence);
          }
        }
      } catch {
        // Silently fail, user can still write
      } finally {
        setLoading(false);
      }
    }
    fetchNotes();
  }, [taskItemId]);

  // Offline-first: save to localStorage on change
  useEffect(() => {
    if (content) {
      localStorage.setItem(`note-draft-${taskItemId}`, content);
    }
  }, [content, taskItemId]);

  // Load from localStorage on mount (offline-first)
  useEffect(() => {
    const draft = localStorage.getItem(`note-draft-${taskItemId}`);
    if (draft && !notes.length) {
      setContent(draft);
    }
  }, [taskItemId, notes.length]);

  async function handleSave() {
    if (!content.trim()) return;
    setSaving(true);

    try {
      const latestNote = notes[0];

      if (latestNote) {
        // Update existing note
        const res = await fetch('/api/understanding-notes', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: latestNote.id, content, confidence }),
        });
        if (res.ok) {
          const updated = await res.json();
          setNotes([updated, ...notes.slice(1)]);
          localStorage.removeItem(`note-draft-${taskItemId}`);
          showToast('Note saved', 'success');
        }
      } else {
        // Create new note
        const res = await fetch('/api/understanding-notes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ taskItemId, content, confidence }),
        });
        if (res.ok) {
          const created = await res.json();
          setNotes([created, ...notes]);
          localStorage.removeItem(`note-draft-${taskItemId}`);
          showToast('Note saved', 'success');
        }
      }
    } catch {
      showToast('Failed to save note', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleReview() {
    const latestNote = notes[0];
    if (!latestNote) {
      // Save first, then review
      await handleSave();
      return;
    }

    setReviewing(true);
    try {
      const res = await fetch('/api/understanding-notes/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ noteId: latestNote.id }),
      });

      if (!res.ok) {
        const data = await res.json();
        showToast(data.error || 'Review failed', 'error');
        return;
      }

      const reviewed = await res.json();
      setNotes([reviewed, ...notes.slice(1)]);
      showToast('AI review complete', 'success');
    } catch {
      showToast('Review failed', 'error');
    } finally {
      setReviewing(false);
    }
  }

  // Auto-save debounce (save to localStorage immediately, DB after 2s idle)
  function handleContentChange(value: string) {
    setContent(value);
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      // Only auto-save to localStorage, not DB
      localStorage.setItem(`note-draft-${taskItemId}`, value);
    }, 500);
  }

  const latestNote = notes[0];
  const hasUnsavedChanges = latestNote ? content !== latestNote.content : content.trim().length > 0;

  if (loading) {
    return <div className="h-20 skeleton rounded-lg mt-2" />;
  }

  return (
    <div className="mt-3 space-y-3">
      {/* Text area for notes */}
      <div className="relative">
        <textarea
          value={content}
          onChange={(e) => handleContentChange(e.target.value)}
          placeholder="Write what you understood about this task..."
          rows={3}
          className="w-full min-h-[80px] px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y transition-colors placeholder:text-gray-400 dark:placeholder:text-gray-500"
          aria-label={`Understanding notes for: ${taskTitle}`}
        />
        {hasUnsavedChanges && (
          <span className="absolute top-2 right-2 w-2 h-2 bg-amber-400 rounded-full" title="Unsaved changes" />
        )}
      </div>

      {/* Confidence self-assessment */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500 dark:text-gray-400">My confidence:</span>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => setConfidence(level)}
              className={`min-h-[28px] min-w-[28px] flex items-center justify-center rounded text-xs font-medium transition-colors ${
                confidence >= level
                  ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-700'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 border border-gray-200 dark:border-gray-700'
              }`}
              aria-label={`Confidence level ${level}`}
            >
              {level}
            </button>
          ))}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !content.trim()}
          className="min-h-[36px] px-3 py-1.5 text-xs font-medium bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
        <button
          type="button"
          onClick={handleReview}
          disabled={reviewing || !content.trim()}
          className="min-h-[36px] px-3 py-1.5 text-xs font-medium bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-1.5"
        >
          {reviewing ? (
            <>
              <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Reviewing...
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              Review my understanding
            </>
          )}
        </button>

        {notes.length > 1 && (
          <button
            type="button"
            onClick={() => setShowHistory(!showHistory)}
            className="min-h-[36px] px-2 py-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
          >
            History ({notes.length})
          </button>
        )}
      </div>

      {/* AI Score badge */}
      {latestNote?.aiScore != null && (
        <div className="p-3 rounded-lg bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/30 border border-purple-200 dark:border-purple-800 space-y-2">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-medium text-gray-600 dark:text-gray-300">Understanding:</span>
              <span className={`text-sm font-bold ${
                latestNote.aiScore >= 80 ? 'text-green-600 dark:text-green-400' :
                latestNote.aiScore >= 50 ? 'text-yellow-600 dark:text-yellow-400' :
                'text-red-600 dark:text-red-400'
              }`}>
                {latestNote.aiScore}%
              </span>
            </div>
            {/* Progress bar */}
            <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  latestNote.aiScore >= 80 ? 'bg-green-500' :
                  latestNote.aiScore >= 50 ? 'bg-yellow-500' :
                  'bg-red-500'
                }`}
                style={{ width: `${latestNote.aiScore}%` }}
              />
            </div>
          </div>

          {latestNote.aiFeedback && (
            <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-line">
              {latestNote.aiFeedback}
            </p>
          )}

          {latestNote.aiSuggestions && (
            <div className="pt-1 border-t border-purple-200 dark:border-purple-800">
              <p className="text-xs font-medium text-purple-700 dark:text-purple-300 mb-1">Questions to explore:</p>
              <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                {latestNote.aiSuggestions}
              </p>
            </div>
          )}

          <p className="text-[10px] text-gray-400 dark:text-gray-500">
            Reviewed {new Date(latestNote.reviewedAt!).toLocaleDateString()}
          </p>
        </div>
      )}

      {/* History */}
      {showHistory && notes.length > 1 && (
        <div className="space-y-2 pt-2 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Previous notes:</p>
          {notes.slice(1).map((note) => (
            <div key={note.id} className="p-2 rounded bg-gray-50 dark:bg-gray-800/50 text-xs space-y-1">
              <p className="text-gray-600 dark:text-gray-300 line-clamp-2">{note.content}</p>
              <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500">
                <span>{new Date(note.createdAt).toLocaleDateString()}</span>
                {note.aiScore != null && <span>Score: {note.aiScore}%</span>}
                <span>Confidence: {note.confidence}/5</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
