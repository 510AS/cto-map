'use client';

import { useState } from 'react';
import { useProgress } from '@/lib/progress-context';
import Link from 'next/link';
import FocusModeWidget from '@/components/FocusModeWidget';
import ReviewsDueSection from '@/components/ReviewsDueSection';
import WeeklyChallenges from '@/components/WeeklyChallenges';
import BurnoutWarning from '@/components/BurnoutWarning';
import WeeklySummary from '@/components/WeeklySummary';
import ProgressBar from '@/components/ProgressBar';
import StreakBadge from '@/components/StreakBadge';

type TabId = 'today' | 'stats' | 'challenges';

interface DashboardTabsProps {
  // Today tab data
  currentWeek: {
    weekNumber: number;
    title: string;
    goal: string;
    phase: { name: string; badge: string };
    days: Array<{
      id: number;
      dayLabel: string;
      sortOrder: number;
      isComplete: boolean;
      learnComplete: boolean;
      buildComplete: boolean;
      learnTask: string;
      buildTask: string;
      skipped?: boolean;
    }>;
  };
  currentDay: {
    id: number;
    dayLabel: string;
    learnTask: string;
    buildTask: string;
    learnComplete: boolean;
    buildComplete: boolean;
    isComplete: boolean;
  } | null;
  weekPct: number;
  weekCompletedDays: number;
  weekTotalDays: number;
  // Stats tab data
  initialOverallPct: number;
  currentStreak: number;
  longestStreak: number;
  totalStudyDays: number;
  cumulativeHours: number;
  phasePct: number;
  phaseName: string;
  // Achievements preview
  recentAchievements?: Array<{ key: string; name: string; icon: string }>;
}

export default function DashboardTabs({
  currentWeek,
  currentDay,
  weekPct,
  weekCompletedDays,
  weekTotalDays,
  initialOverallPct,
  currentStreak,
  longestStreak,
  totalStudyDays,
  cumulativeHours,
  phasePct,
  phaseName,
  recentAchievements = [],
}: DashboardTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>('today');
  const { state } = useProgress();

  // Enhancement #6: Use context values when available (fresher than server data)
  const overallPct = state.lastUpdated > 0 ? state.overallPct : initialOverallPct;

  const tabs: { id: TabId; label: string }[] = [
    { id: 'today', label: 'Today' },
    { id: 'stats', label: 'Stats' },
    { id: 'challenges', label: 'Challenges' },
  ];

  return (
    <div className="space-y-6">
      {/* Tab bar */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex -mb-px gap-1" aria-label="Dashboard tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`min-h-[44px] min-w-[44px] px-4 py-2.5 text-sm font-medium border-b-2 transition-all rounded-t-lg ${
                activeTab === tab.id
                  ? "border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/50"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
              }`}
              aria-selected={activeTab === tab.id}
              role="tab"
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      <div role="tabpanel" className="animate-fade-in">
        {activeTab === 'today' && (
          <TodayTab
            currentWeek={currentWeek}
            currentDay={currentDay}
            weekPct={weekPct}
            weekCompletedDays={weekCompletedDays}
            weekTotalDays={weekTotalDays}
          />
        )}
        {activeTab === 'stats' && (
          <StatsTab
            overallPct={overallPct}
            currentStreak={currentStreak}
            longestStreak={longestStreak}
            totalStudyDays={totalStudyDays}
            cumulativeHours={cumulativeHours}
            phasePct={phasePct}
            phaseName={phaseName}
          />
        )}
        {activeTab === 'challenges' && (
          <ChallengesTab recentAchievements={recentAchievements} />
        )}
      </div>
    </div>
  );
}

function TodayTab({
  currentWeek,
  currentDay,
  weekPct,
  weekCompletedDays,
  weekTotalDays,
}: {
  currentWeek: DashboardTabsProps['currentWeek'];
  currentDay: DashboardTabsProps['currentDay'];
  weekPct: number;
  weekCompletedDays: number;
  weekTotalDays: number;
}) {
  return (
    <div className="space-y-6">
      {/* Current Week Card */}
      <section className="card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="badge-blue">Week {currentWeek.weekNumber}</span>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{currentWeek.title}</h2>
          </div>
          <Link
            href={`/week/${currentWeek.weekNumber}`}
            className="min-h-[44px] min-w-[44px] inline-flex items-center text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
          >
            View →
          </Link>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-300">{currentWeek.goal}</p>
        <div>
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
            <span>{weekCompletedDays}/{weekTotalDays} days</span>
            <span>{Math.round(weekPct)}%</span>
          </div>
          <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${weekPct}%` }}
              role="progressbar"
              aria-valuenow={Math.round(weekPct)}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
        </div>
        {/* Mini day grid */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {currentWeek.days.map((d) => (
            <Link
              key={d.id}
              href={`/week/${currentWeek.weekNumber}/day/${d.sortOrder}`}
              className={`p-2 rounded-lg border text-center transition-all hover:shadow-sm ${
                d.skipped
                  ? 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 opacity-50'
                  : d.isComplete
                  ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-blue-300 dark:hover:border-blue-700'
              }`}
            >
              <p className={`text-xs font-medium ${
                d.skipped ? 'text-gray-400 dark:text-gray-500 line-through' :
                d.isComplete ? 'text-green-700 dark:text-green-300' : 'text-gray-700 dark:text-gray-300'
              }`}>
                {d.dayLabel.replace('Day ', 'D')}
              </p>
              {!d.skipped && (
                <div className="flex items-center justify-center gap-1 mt-1">
                  <div className={`w-2 h-2 rounded-full ${d.learnComplete ? 'bg-purple-500' : 'bg-gray-300 dark:bg-gray-600'}`} />
                  <div className={`w-2 h-2 rounded-full ${d.buildComplete ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'}`} />
                </div>
              )}
            </Link>
          ))}
        </div>
      </section>

      {/* Today's Tasks */}
      {currentDay && (
        <section className="card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Today — {currentDay.dayLabel}
            </h3>
            {currentDay.isComplete ? (
              <span className="badge-green">✓ Done</span>
            ) : (currentDay.learnComplete || currentDay.buildComplete) ? (
              <span className="badge-blue">In Progress</span>
            ) : null}
          </div>
          <FocusModeWidget
            dayId={currentDay.id}
            learnTask={currentDay.learnTask}
            buildTask={currentDay.buildTask}
            learnComplete={currentDay.learnComplete}
            buildComplete={currentDay.buildComplete}
          />
        </section>
      )}

      {/* Reviews Due */}
      <ReviewsDueSection />
    </div>
  );
}

function StatsTab({
  overallPct,
  currentStreak,
  longestStreak,
  totalStudyDays,
  cumulativeHours,
  phasePct,
  phaseName,
}: {
  overallPct: number;
  currentStreak: number;
  longestStreak: number;
  totalStudyDays: number;
  cumulativeHours: number;
  phasePct: number;
  phaseName: string;
}) {
  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="stat-card">
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{overallPct > 0 && overallPct < 1 ? '<1' : Math.round(overallPct)}%</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Overall</p>
        </div>
        <div className="stat-card">
          <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{currentStreak}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Day Streak 🔥</p>
        </div>
        <div className="stat-card">
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">{totalStudyDays}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Study Days</p>
        </div>
        <div className="stat-card">
          <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{cumulativeHours.toFixed(0)}h</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Total Hours</p>
        </div>
      </div>

      {/* Progress Bars */}
      <section className="card p-5 space-y-4">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Progress</h3>
        <ProgressBar percentage={overallPct} label="Overall Curriculum" />
        <ProgressBar percentage={phasePct} label={`Phase: ${phaseName}`} />
      </section>

      {/* Streak & Stats */}
      <div className="grid gap-4 sm:grid-cols-2">
        <StreakBadge currentStreak={currentStreak} longestStreak={longestStreak} />
        <div className="card p-4">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Study Summary</p>
          <div className="mt-2 space-y-1">
            <p className="text-xs text-gray-500 dark:text-gray-400">{totalStudyDays} total study days</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{cumulativeHours.toFixed(1)} hours invested</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {totalStudyDays > 0 ? (cumulativeHours / totalStudyDays).toFixed(1) : '0'} avg hours/day
            </p>
          </div>
        </div>
      </div>

      {/* Weekly Summary */}
      <WeeklySummary />
    </div>
  );
}

function ChallengesTab({
  recentAchievements,
}: {
  recentAchievements: Array<{ key: string; name: string; icon: string }>;
}) {
  return (
    <div className="space-y-6">
      {/* Weekly Challenges */}
      <WeeklyChallenges />

      {/* Burnout Warning */}
      <BurnoutWarning />

      {/* Achievements Preview */}
      {recentAchievements.length > 0 && (
        <section className="card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
              Recent Achievements
            </h3>
            <Link
              href="/achievements"
              className="min-h-[44px] min-w-[44px] inline-flex items-center text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
            >
              View All →
            </Link>
          </div>
          <div className="flex gap-3">
            {recentAchievements.map((a) => (
              <div key={a.key} className="flex items-center gap-2 px-3 py-2 bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <span className="text-xl">{a.icon}</span>
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{a.name}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {recentAchievements.length === 0 && (
        <section className="card p-5 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Complete days and maintain streaks to unlock achievements! 🏆
          </p>
        </section>
      )}
    </div>
  );
}
