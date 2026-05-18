import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/analytics
 * Returns analytics data:
 * - Per-week completion counts
 * - Last 30 days completion history
 * - Tag stats (tag name, total weeks, completed weeks)
 * - Hours stats (total, average per week)
 */
export async function GET() {
  try {
    const [weeks, days, tags, settings] = await Promise.all([
      prisma.week.findMany({
        select: {
          id: true,
          weekNumber: true,
          isComplete: true,
          hoursLogged: true,
          days: { select: { isComplete: true, skipped: true } },
          tags: { select: { tag: { select: { name: true } } } },
        },
        orderBy: { weekNumber: 'asc' },
      }),
      prisma.day.findMany({
        where: { completedAt: { not: null } },
        select: { completedAt: true },
        orderBy: { completedAt: 'desc' },
      }),
      prisma.tag.findMany({
        select: {
          id: true,
          name: true,
          weeks: {
            select: {
              week: { select: { isComplete: true } },
            },
          },
        },
      }),
      prisma.settings.findUnique({ where: { id: 1 } }),
    ]);

    // Per-week completion counts
    const weeklyCompletions = weeks.map((w) => ({
      weekNumber: w.weekNumber,
      completedDays: w.days.filter((d) => d.isComplete).length,
      totalDays: w.days.filter((d) => !d.skipped).length,
    }));

    // Last 30 days completion history
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const last30Days: { date: string; completed: boolean }[] = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const hasCompletion = days.some((d) => {
        if (!d.completedAt) return false;
        return d.completedAt.toISOString().split('T')[0] === dateStr;
      });
      last30Days.push({ date: dateStr, completed: hasCompletion });
    }

    // Tag stats
    const tagStats = tags.map((t) => ({
      name: t.name,
      totalWeeks: t.weeks.length,
      completedWeeks: t.weeks.filter((wt) => wt.week.isComplete).length,
    }));

    // Hours stats
    const totalHours = weeks.reduce((sum, w) => sum + (w.hoursLogged ?? 0), 0);
    const weeksWithHours = weeks.filter((w) => w.hoursLogged != null && w.hoursLogged > 0);
    const averageHoursPerWeek = weeksWithHours.length > 0
      ? totalHours / weeksWithHours.length
      : 0;

    return NextResponse.json({
      weeklyCompletions,
      last30Days,
      tagStats,
      hoursStats: {
        totalHours,
        averageHoursPerWeek,
        weeksTracked: weeksWithHours.length,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
