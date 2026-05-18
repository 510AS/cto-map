import { prisma } from '@/lib/prisma';
import {
  getCurrentWeekNumber,
  calculateStreak,
  calculateLongestStreak,
  countStudyDays,
  phaseCompletionPct,
} from '@/lib/calculations';
import Link from 'next/link';
import DashboardTabs from '@/components/DashboardTabs';

export const dynamic = 'force-dynamic';

/**
 * Enhancement #1: Dashboard reorganized with tabbed layout (Today | Stats | Challenges).
 * Enhancement #6: DashboardTabs client component uses ProgressContext for real-time updates.
 * Server component fetches initial data, client component overrides with context when available.
 */
export default async function DashboardPage() {
  // Fetch settings to get start date
  const settings = await prisma.settings.findFirst({ where: { id: 1 } });
  const startDate = settings?.startDate;

  // If no start date is set, show prompt to configure it
  if (!startDate) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 animate-fade-in">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border border-blue-200 dark:border-blue-800 rounded-2xl p-10 max-w-md w-full shadow-lg">
          <div className="text-5xl mb-4">🚀</div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-3">
            Welcome to CTO Learning Helper
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
            Set your curriculum start date to begin tracking your 52-week journey to Technical CTO mastery.
          </p>
          <Link
            href="/settings"
            className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg"
          >
            Get Started →
          </Link>
        </div>
      </div>
    );
  }

  // Calculate current week number
  const today = new Date();
  const currentWeekNumber = getCurrentWeekNumber(startDate, today);

  // Parallelize all DB queries
  const [currentWeek, allWeeks, completedDays, recentAchievements] = await Promise.all([
    prisma.week.findUnique({
      where: { weekNumber: currentWeekNumber },
      include: {
        days: { orderBy: { sortOrder: 'asc' } },
        phase: true,
      },
    }),
    prisma.week.findMany({
      select: { isComplete: true, phaseId: true, hoursLogged: true },
    }),
    prisma.day.findMany({
      where: { completedAt: { not: null } },
      select: { completedAt: true },
    }),
    prisma.achievement.findMany({
      orderBy: { earnedAt: 'desc' },
      take: 3,
      select: { key: true, name: true, icon: true },
    }),
  ]);

  if (!currentWeek) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 dark:text-gray-400">
          Week data not found. Please run the seed command first.
        </p>
      </div>
    );
  }

  // Check if curriculum is complete
  const elapsedDays = Math.floor(
    (today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  const curriculumComplete = elapsedDays >= 52 * 7;

  // Determine current day within the week
  const dayOfWeek = ((elapsedDays % 7) + 1);
  const currentDay = currentWeek.days.find((d) => d.sortOrder === dayOfWeek) ?? currentWeek.days[0];

  // Calculate stats
  const totalDaysInCurriculum = 312;
  const totalCompletedDaysCount = completedDays.length;
  const overallPct = totalDaysInCurriculum > 0 ? (totalCompletedDaysCount / totalDaysInCurriculum) * 100 : 0;

  const phaseWeeks = allWeeks.filter((w) => w.phaseId === currentWeek.phaseId);
  const completedPhaseWeeks = phaseWeeks.filter((w) => w.isComplete).length;
  const phasePct = phaseCompletionPct(completedPhaseWeeks, phaseWeeks.length);

  const cumulativeHours = allWeeks.reduce((sum, w) => sum + (w.hoursLogged ?? 0), 0);

  const completionDates = completedDays
    .map((d) => d.completedAt)
    .filter((d): d is Date => d !== null);

  const currentStreak = calculateStreak(completionDates, today);
  const longestStreak = calculateLongestStreak(completionDates);
  const totalStudyDays = countStudyDays(completionDates);

  // Week day completion
  const weekCompletedDays = currentWeek.days.filter((d) => d.isComplete).length;
  const weekTotalDays = currentWeek.days.length;
  const weekPct = weekTotalDays > 0 ? (weekCompletedDays / weekTotalDays) * 100 : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Week {currentWeekNumber} of 52 • {currentWeek.phase.badge} {currentWeek.phase.name}
          </p>
        </div>
        {curriculumComplete && (
          <span className="badge-green text-sm px-3 py-1">🎉 Complete!</span>
        )}
      </div>

      {/* Tabbed content (client component) */}
      <DashboardTabs
        currentWeek={{
          weekNumber: currentWeek.weekNumber,
          title: currentWeek.title,
          goal: currentWeek.goal,
          phase: { name: currentWeek.phase.name, badge: currentWeek.phase.badge },
          days: currentWeek.days.map((d) => ({
            id: d.id,
            dayLabel: d.dayLabel,
            sortOrder: d.sortOrder,
            isComplete: d.isComplete,
            learnComplete: d.learnComplete,
            buildComplete: d.buildComplete,
            learnTask: d.learnTask,
            buildTask: d.buildTask,
            skipped: (d as any).skipped,
          })),
        }}
        currentDay={currentDay ? {
          id: currentDay.id,
          dayLabel: currentDay.dayLabel,
          learnTask: currentDay.learnTask,
          buildTask: currentDay.buildTask,
          learnComplete: currentDay.learnComplete,
          buildComplete: currentDay.buildComplete,
          isComplete: currentDay.isComplete,
        } : null}
        weekPct={weekPct}
        weekCompletedDays={weekCompletedDays}
        weekTotalDays={weekTotalDays}
        initialOverallPct={overallPct}
        currentStreak={currentStreak}
        longestStreak={longestStreak}
        totalStudyDays={totalStudyDays}
        cumulativeHours={cumulativeHours}
        phasePct={phasePct}
        phaseName={currentWeek.phase.name}
        recentAchievements={recentAchievements}
      />
    </div>
  );
}
