"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useToast } from "@/lib/toast-context";
import DayChecklist from "@/components/DayChecklist";

const QUOTES = [
  "The expert in anything was once a beginner.",
  "Small daily improvements lead to staggering long-term results.",
  "Code is like humor. When you have to explain it, it's bad.",
  "First, solve the problem. Then, write the code.",
  "The best time to plant a tree was 20 years ago. The second best time is now.",
  "Learning never exhausts the mind.",
  "Simplicity is the soul of efficiency.",
  "Make it work, make it right, make it fast.",
  "The only way to do great work is to love what you do.",
  "Progress, not perfection.",
];

interface TodayData {
  weekNumber: number;
  daySort: number;
}

interface DayData {
  id: number;
  dayLabel: string;
  learnTask: string;
  buildTask: string;
  isComplete: boolean;
  learnComplete: boolean;
  buildComplete: boolean;
  weekId: number;
  week?: { weekNumber: number; title: string };
}

export default function TodayPage() {
  const [todayInfo, setTodayInfo] = useState<TodayData | null>(null);
  const [day, setDay] = useState<DayData | null>(null);
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const quote = QUOTES[new Date().getDate() % QUOTES.length];

  useEffect(() => {
    async function fetchToday() {
      try {
        const todayRes = await fetch("/api/today");
        if (!todayRes.ok) throw new Error("No start date");
        const info: TodayData = await todayRes.json();
        setTodayInfo(info);

        const dayRes = await fetch(`/api/days/by-week?weekNumber=${info.weekNumber}&sortOrder=${info.daySort}`);
        if (dayRes.ok) {
          setDay(await dayRes.json());
        }

        // Fetch streak from progress summary
        const progressRes = await fetch("/api/progress-summary");
        if (progressRes.ok) {
          const pData = await progressRes.json();
          setStreak(pData.currentStreak ?? 0);
        }
      } catch {
        // No start date configured
      } finally {
        setLoading(false);
      }
    }
    fetchToday();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
        <div className="skeleton h-8 w-48" />
        <div className="skeleton h-32 w-full rounded-xl" />
        <div className="skeleton h-48 w-full rounded-xl" />
      </div>
    );
  }

  if (!todayInfo || !day) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 animate-fade-in">
        <div className="text-5xl mb-4">☀️</div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Good Morning!</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-6">Set your start date in Settings to see today&apos;s focus.</p>
        <Link href="/settings" className="min-h-[44px] px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors">
          Go to Settings
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="text-center space-y-2 pt-4">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Week {todayInfo.weekNumber} • {day.week?.title}
        </p>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          {day.dayLabel}
        </h1>
        {streak > 0 && (
          <p className="text-sm text-orange-600 dark:text-orange-400 font-medium">
            🔥 {streak} day streak
          </p>
        )}
      </div>

      {/* Quote */}
      <div className="text-center px-6">
        <p className="text-sm italic text-gray-500 dark:text-gray-400">&ldquo;{quote}&rdquo;</p>
      </div>

      {/* Learn Task */}
      <div className={`card p-5 ${day.learnComplete ? 'border-purple-200 dark:border-purple-800' : ''}`}>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg">📖</span>
          <h2 className="text-sm font-semibold text-purple-700 dark:text-purple-300">Learn</h2>
          {day.learnComplete && <span className="badge-green text-xs">✓</span>}
        </div>
        <p className={`text-base leading-relaxed ${day.learnComplete ? 'text-gray-400 dark:text-gray-500 line-through' : 'text-gray-800 dark:text-gray-200'}`}>
          {day.learnTask}
        </p>
      </div>

      {/* Build Task */}
      <div className={`card p-5 ${day.buildComplete ? 'border-emerald-200 dark:border-emerald-800' : ''}`}>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg">🛠️</span>
          <h2 className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">Build</h2>
          {day.buildComplete && <span className="badge-green text-xs">✓</span>}
        </div>
        <p className={`text-base leading-relaxed ${day.buildComplete ? 'text-gray-400 dark:text-gray-500 line-through' : 'text-gray-800 dark:text-gray-200'}`}>
          {day.buildTask}
        </p>
      </div>

      {/* Sub-tasks */}
      <div className="card p-5">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-4">
          Sub-tasks
        </h2>
        <DayChecklist dayId={day.id} />
      </div>

      {/* Link to full page */}
      <div className="text-center pb-6">
        <Link
          href={`/week/${todayInfo.weekNumber}/day/${todayInfo.daySort}`}
          className="min-h-[44px] inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950 transition-colors"
        >
          View Full Day Detail →
        </Link>
      </div>
    </div>
  );
}
