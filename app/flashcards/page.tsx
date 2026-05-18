"use client";

import { useEffect, useState, useCallback } from "react";

interface FlashcardData {
  weekNumber: number;
  title: string;
  responses: { prompt: string; response: string }[];
}

const MASTERY_KEY = 'flashcard-mastery';
const MASTERY_THRESHOLD = 3;

interface MasteryData {
  [cardKey: string]: number; // cardKey -> "I remember" count
}

function loadMastery(): MasteryData {
  try {
    const raw = localStorage.getItem(MASTERY_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveMastery(data: MasteryData) {
  try {
    localStorage.setItem(MASTERY_KEY, JSON.stringify(data));
  } catch { /* ignore */ }
}

function getCardKey(card: FlashcardData): string {
  return `w${card.weekNumber}-${card.title}`;
}

/**
 * Enhancement #17: Flashcard Session Tracking
 * - Tracks reviewed cards in component state
 * - Shows "X/Y reviewed this session" counter
 * - After reviewing all cards, shows "Session Complete! 🎉"
 * - "Reset Session" button to start over
 * - "I remember" increments localStorage counter; after 3 times, card is "mastered"
 */
export default function FlashcardsPage() {
  const [cards, setCards] = useState<FlashcardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [reviewedIds, setReviewedIds] = useState<Set<number>>(new Set());
  const [mastery, setMastery] = useState<MasteryData>({});
  const [sessionComplete, setSessionComplete] = useState(false);

  useEffect(() => {
    setMastery(loadMastery());
  }, []);

  useEffect(() => {
    async function fetchFlashcards() {
      try {
        const res = await fetch("/api/flashcards");
        if (res.ok) setCards(await res.json());
      } catch { /* ignore */ }
      finally { setLoading(false); }
    }
    fetchFlashcards();
  }, []);

  const markReviewed = useCallback((index: number) => {
    setReviewedIds((prev) => {
      const next = new Set(prev);
      next.add(index);
      return next;
    });
  }, []);

  function handleRemember() {
    const card = cards[currentIndex];
    const key = getCardKey(card);

    // Increment mastery count
    const newMastery = { ...mastery, [key]: (mastery[key] || 0) + 1 };
    setMastery(newMastery);
    saveMastery(newMastery);

    markReviewed(currentIndex);
    goNext();
  }

  function handleNeedReview() {
    markReviewed(currentIndex);
    goNext();
  }

  function goNext() {
    setFlipped(false);
    const nextIndex = (currentIndex + 1) % cards.length;
    setCurrentIndex(nextIndex);

    // Check if all cards have been reviewed
    const newReviewed = new Set(reviewedIds);
    newReviewed.add(currentIndex);
    if (newReviewed.size >= cards.length) {
      setSessionComplete(true);
    }
  }

  function handlePrev() {
    setFlipped(false);
    setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length);
  }

  function handleNext() {
    setFlipped(false);
    setCurrentIndex((prev) => (prev + 1) % cards.length);
  }

  function resetSession() {
    setReviewedIds(new Set());
    setSessionComplete(false);
    setCurrentIndex(0);
    setFlipped(false);
  }

  if (loading) {
    return (
      <div className="space-y-4 animate-fade-in">
        <div className="skeleton h-8 w-48" />
        <div className="skeleton h-64 w-full max-w-lg mx-auto rounded-xl" />
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-fade-in">
        <div className="text-5xl mb-4">🃏</div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Flashcards</h1>
        <p className="text-gray-500 dark:text-gray-400">
          No flashcards yet. Complete weekly reviews to generate flashcards.
        </p>
      </div>
    );
  }

  // Session complete screen
  if (sessionComplete) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-fade-in max-w-lg mx-auto">
        <div className="text-6xl mb-4">🎉</div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Session Complete!</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          You reviewed all {cards.length} cards this session. Great work!
        </p>
        <button
          onClick={resetSession}
          className="min-h-[44px] min-w-[44px] px-6 py-3 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          Start New Session
        </button>
      </div>
    );
  }

  const card = cards[currentIndex];
  const learnedResponse = card.responses.find((r) => r.prompt === 'learned');
  const cardKey = getCardKey(card);
  const isMastered = (mastery[cardKey] || 0) >= MASTERY_THRESHOLD;

  return (
    <div className="space-y-6 animate-fade-in max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Flashcards</h1>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {currentIndex + 1} / {cards.length}
        </span>
      </div>

      {/* Session progress */}
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
          {reviewedIds.size}/{cards.length} reviewed this session
        </span>
        {reviewedIds.size > 0 && (
          <button
            onClick={resetSession}
            className="min-h-[44px] min-w-[44px] px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
          >
            Reset Session
          </button>
        )}
      </div>

      {/* Session progress bar */}
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
        <div
          className="h-full bg-blue-500 dark:bg-blue-400 rounded-full transition-all duration-300"
          style={{ width: `${(reviewedIds.size / cards.length) * 100}%` }}
        />
      </div>

      {/* Card */}
      <div
        className={`relative w-full h-64 cursor-pointer ${isMastered ? 'opacity-50' : ''}`}
        onClick={() => setFlipped(!flipped)}
        style={{ perspective: '1000px' }}
      >
        <div
          className="relative w-full h-full transition-transform duration-500"
          style={{
            transformStyle: 'preserve-3d',
            transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          }}
        >
          {/* Front */}
          <div
            className="absolute inset-0 card p-6 flex flex-col items-center justify-center text-center"
            style={{ backfaceVisibility: 'hidden' }}
          >
            {isMastered && (
              <span className="absolute top-3 right-3 text-xs bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 px-2 py-0.5 rounded-full">
                ✓ Mastered
              </span>
            )}
            <span className="text-xs text-gray-500 dark:text-gray-400 mb-2">Week {card.weekNumber}</span>
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">{card.title}</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">What did you learn?</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-4">Tap to flip</p>
          </div>

          {/* Back */}
          <div
            className="absolute inset-0 card p-6 flex flex-col items-center justify-center text-center overflow-y-auto"
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          >
            <span className="text-xs text-gray-500 dark:text-gray-400 mb-2">Answer</span>
            <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed">
              {learnedResponse?.response || 'No review response recorded.'}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-4">Tap to flip back</p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={handlePrev}
          className="min-h-[44px] min-w-[44px] px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          ← Previous
        </button>

        <div className="flex gap-2">
          <button
            onClick={handleRemember}
            className="min-h-[44px] px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
          >
            ✓ I remember
          </button>
          <button
            onClick={handleNeedReview}
            className="min-h-[44px] px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700 transition-colors"
          >
            ↻ Need review
          </button>
        </div>

        <button
          onClick={handleNext}
          className="min-h-[44px] min-w-[44px] px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          Next →
        </button>
      </div>

      {/* Mastery info */}
      {isMastered && (
        <p className="text-center text-xs text-green-600 dark:text-green-400">
          You&apos;ve remembered this card {mastery[cardKey]} times — it&apos;s mastered!
        </p>
      )}
    </div>
  );
}
