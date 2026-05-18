'use client';

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';

interface ProgressState {
  completedWeekIds: Set<number>;
  completedDayIds: Set<number>;
  totalCompletedWeeks: number;
  totalCompletedDays: number;
  totalDays: number;
  totalWeeks: number;
  overallPct: number; // based on days, not weeks
  lastUpdated: number;
}

interface ProgressContextValue {
  state: ProgressState;
  markDayComplete: (dayId: number, weekId: number, isComplete: boolean, allDaysInWeekComplete: boolean) => void;
  markWeekComplete: (weekId: number, isComplete: boolean) => void;
  refreshProgress: () => Promise<void>;
  forceRefresh: () => Promise<void>;
}

const ProgressContext = createContext<ProgressContextValue | null>(null);

export function useProgress() {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error('useProgress must be used within ProgressProvider');
  return ctx;
}

/** TTL for caching: 30 seconds */
const CACHE_TTL = 30000;

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ProgressState>({
    completedWeekIds: new Set(),
    completedDayIds: new Set(),
    totalCompletedWeeks: 0,
    totalCompletedDays: 0,
    totalDays: 312, // 52 weeks * 6 days
    totalWeeks: 52,
    overallPct: 0,
    lastUpdated: 0,
  });

  const [lastFetched, setLastFetched] = useState(0);

  const fetchProgressData = useCallback(async () => {
    try {
      const res = await fetch('/api/progress-summary');
      if (res.ok) {
        const data = await res.json();
        const completedDays = data.completedDayIds.length;
        const totalDays = data.totalDays ?? 312;
        setState({
          completedWeekIds: new Set(data.completedWeekIds),
          completedDayIds: new Set(data.completedDayIds),
          totalCompletedWeeks: data.completedWeekIds.length,
          totalCompletedDays: completedDays,
          totalDays,
          totalWeeks: 52,
          overallPct: totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0,
          lastUpdated: Date.now(),
        });
        setLastFetched(Date.now());
      }
    } catch {
      // Will retry on next navigation
    }
  }, []);

  // Enhancement #8: refreshProgress with 30-second TTL caching
  const refreshProgress = useCallback(async () => {
    const now = Date.now();
    if (now - lastFetched < CACHE_TTL) {
      // Skip fetch — cache is still fresh
      return;
    }
    await fetchProgressData();
  }, [lastFetched, fetchProgressData]);

  // Enhancement #8: forceRefresh bypasses the cache
  const forceRefresh = useCallback(async () => {
    await fetchProgressData();
  }, [fetchProgressData]);

  useEffect(() => {
    fetchProgressData();
  }, [fetchProgressData]);

  const markDayComplete = useCallback((dayId: number, weekId: number, isComplete: boolean, allDaysInWeekComplete: boolean) => {
    setState((prev) => {
      const newDayIds = new Set(prev.completedDayIds);
      const newWeekIds = new Set(prev.completedWeekIds);

      if (isComplete) {
        newDayIds.add(dayId);
      } else {
        newDayIds.delete(dayId);
      }

      if (allDaysInWeekComplete) {
        newWeekIds.add(weekId);
      } else {
        newWeekIds.delete(weekId);
      }

      const totalCompletedDays = newDayIds.size;
      return {
        completedWeekIds: newWeekIds,
        completedDayIds: newDayIds,
        totalCompletedWeeks: newWeekIds.size,
        totalCompletedDays: totalCompletedDays,
        totalDays: prev.totalDays,
        totalWeeks: prev.totalWeeks,
        overallPct: prev.totalDays > 0 ? Math.round((totalCompletedDays / prev.totalDays) * 100) : 0,
        lastUpdated: Date.now(),
      };
    });
    // Reset lastFetched so next refreshProgress will actually fetch
    setLastFetched(0);
  }, []);

  const markWeekComplete = useCallback((weekId: number, isComplete: boolean) => {
    setState((prev) => {
      const newWeekIds = new Set(prev.completedWeekIds);
      if (isComplete) {
        newWeekIds.add(weekId);
      } else {
        newWeekIds.delete(weekId);
      }
      return {
        ...prev,
        completedWeekIds: newWeekIds,
        totalCompletedWeeks: newWeekIds.size,
        lastUpdated: Date.now(),
      };
    });
  }, []);

  return (
    <ProgressContext.Provider value={{ state, markDayComplete, markWeekComplete, refreshProgress, forceRefresh }}>
      {children}
    </ProgressContext.Provider>
  );
}
