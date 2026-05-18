'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useToast } from '@/lib/toast-context';

const PRESETS = [
  { label: '25m', minutes: 25 },
  { label: '15m', minutes: 15 },
  { label: '5m', minutes: 5 },
];

const STORAGE_KEY = 'pomodoro-timer-state';

interface StoredTimerState {
  isRunning: boolean;
  timeLeft: number;
  startedAt: number | null; // timestamp when timer was started
  completedToday: number;
  lastResetDate: string; // YYYY-MM-DD
  duration: number;
}

function getTodayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function loadStoredState(): StoredTimerState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveState(state: StoredTimerState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch { /* ignore */ }
}

export default function PomodoroTimer() {
  const [duration, setDuration] = useState(25 * 60);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);
  const [collapsed, setCollapsed] = useState(true);
  const { showToast } = useToast();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(false);

  // Restore from localStorage on mount
  useEffect(() => {
    const stored = loadStoredState();
    if (!stored) {
      mountedRef.current = true;
      return;
    }

    // Reset daily count at midnight
    const today = getTodayStr();
    const dailyCount = stored.lastResetDate === today ? stored.completedToday : 0;
    setCompletedCount(dailyCount);
    setDuration(stored.duration);

    if (stored.isRunning && stored.startedAt) {
      // Calculate elapsed time since timer was started
      const elapsed = Math.floor((Date.now() - stored.startedAt) / 1000);
      const remaining = stored.timeLeft - elapsed;
      if (remaining > 0) {
        setTimeLeft(remaining);
        setIsRunning(true);
      } else {
        // Timer completed while away
        setTimeLeft(0);
        setIsRunning(false);
        setCompletedCount((c) => c + 1);
        showToast('🍅 Pomodoro completed while you were away!', 'success');
      }
    } else {
      setTimeLeft(stored.timeLeft);
      setIsRunning(false);
    }

    mountedRef.current = true;
  }, [showToast]);

  // Persist state changes to localStorage
  useEffect(() => {
    if (!mountedRef.current) return;
    const state: StoredTimerState = {
      isRunning,
      timeLeft,
      startedAt: isRunning ? Date.now() : null,
      completedToday: completedCount,
      lastResetDate: getTodayStr(),
      duration,
    };
    saveState(state);
  }, [isRunning, timeLeft, completedCount, duration]);

  const reset = useCallback(() => {
    setIsRunning(false);
    setTimeLeft(duration);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, [duration]);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            setCompletedCount((c) => c + 1);
            showToast('🍅 Pomodoro complete! Take a break.', 'success');
            if (intervalRef.current) clearInterval(intervalRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, showToast]);

  function selectPreset(minutes: number) {
    const secs = minutes * 60;
    setDuration(secs);
    setTimeLeft(secs);
    setIsRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const progress = duration > 0 ? ((duration - timeLeft) / duration) * 100 : 0;
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  if (collapsed) {
    return (
      <button
        onClick={() => setCollapsed(false)}
        className="min-h-[44px] min-w-[44px] w-full flex items-center justify-between px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">🍅</span>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Pomodoro Timer</span>
          {completedCount > 0 && (
            <span className="text-xs bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 px-2 py-0.5 rounded-full">
              {completedCount} done today
            </span>
          )}
        </div>
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
    );
  }

  return (
    <div className="card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">🍅</span>
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Pomodoro Timer</h3>
          {completedCount > 0 && (
            <span className="text-xs bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 px-2 py-0.5 rounded-full">
              {completedCount} done today
            </span>
          )}
        </div>
        <button
          onClick={() => setCollapsed(true)}
          className="min-h-[44px] min-w-[44px] flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        </button>
      </div>

      {/* Circular progress */}
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-32 h-32">
          <svg className="w-32 h-32 -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50" cy="50" r="45"
              fill="none"
              stroke="currentColor"
              strokeWidth="6"
              className="text-gray-200 dark:text-gray-700"
            />
            <circle
              cx="50" cy="50" r="45"
              fill="none"
              stroke="currentColor"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="text-red-500 dark:text-red-400 transition-all duration-1000"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl font-bold text-gray-900 dark:text-gray-100 tabular-nums">
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </span>
          </div>
        </div>

        {/* Presets */}
        <div className="flex gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.minutes}
              onClick={() => selectPreset(p.minutes)}
              className={`min-h-[44px] min-w-[44px] px-3 py-2 text-xs font-medium rounded-lg border transition-colors ${
                duration === p.minutes * 60
                  ? 'bg-red-50 dark:bg-red-950 border-red-300 dark:border-red-700 text-red-700 dark:text-red-300'
                  : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Controls */}
        <div className="flex gap-2">
          <button
            onClick={() => setIsRunning(!isRunning)}
            className="min-h-[44px] min-w-[44px] px-5 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
          >
            {isRunning ? 'Pause' : timeLeft < duration ? 'Resume' : 'Start'}
          </button>
          <button
            onClick={reset}
            className="min-h-[44px] min-w-[44px] px-4 py-2 border border-gray-200 dark:border-gray-700 text-sm font-medium rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}
