import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateStreak } from '@/lib/calculations';

/**
 * GET /api/progress-summary
 * Lightweight endpoint returning only IDs of completed weeks and days.
 * Used by the shared ProgressContext to keep all pages in sync.
 */
export async function GET() {
  try {
    const [completedWeeks, completedDays, totalDays] = await Promise.all([
      prisma.week.findMany({
        where: { isComplete: true },
        select: { id: true },
      }),
      prisma.day.findMany({
        where: { isComplete: true },
        select: { id: true, completedAt: true },
      }),
      prisma.day.count(),
    ]);

    // Calculate current streak
    const completionDates = completedDays
      .map((d) => d.completedAt)
      .filter((d): d is Date => d !== null);
    const currentStreak = calculateStreak(completionDates, new Date());

    return NextResponse.json({
      completedWeekIds: completedWeeks.map((w) => w.id),
      completedDayIds: completedDays.map((d) => d.id),
      totalDays,
      currentStreak,
    });
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
