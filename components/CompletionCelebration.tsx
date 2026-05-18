'use client';

import { useEffect } from 'react';
import { CELEBRATION_MESSAGES } from '../lib/celebration-messages';

export { CELEBRATION_MESSAGES };

interface CompletionCelebrationProps {
  show: boolean;
  onDismiss: () => void;
}

/**
 * Animated overlay with motivational message on day completion.
 * Auto-dismisses after 3 seconds.
 * Requirements: 11.1, 11.2, 11.3, 11.4
 */
export default function CompletionCelebration({ show, onDismiss }: CompletionCelebrationProps) {
  useEffect(() => {
    if (!show) return;

    const timer = setTimeout(() => {
      onDismiss();
    }, 3000);

    return () => clearTimeout(timer);
  }, [show, onDismiss]);

  if (!show) return null;

  const message =
    CELEBRATION_MESSAGES[Math.floor(Math.random() * CELEBRATION_MESSAGES.length)];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 animate-fade-in"
      onClick={onDismiss}
      role="dialog"
      aria-label="Day completion celebration"
    >
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 mx-4 max-w-sm text-center animate-bounce-in">
        <div className="text-5xl mb-4" role="img" aria-label="celebration">
          🎊
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Day Complete!
        </h2>
        <p className="text-gray-600 dark:text-gray-300 text-sm">
          {message}
        </p>
      </div>
    </div>
  );
}
