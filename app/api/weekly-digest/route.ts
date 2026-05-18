import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateStreak } from '@/lib/calculations';

/**
 * GET /api/weekly-digest
 * Returns a summary for the current week.
 */
export async function GET() {
  try {
    const settings = await prisma.settings.findUnique({ where: { id: 1 } });
    if (!settings?.startDate) {
      return NextResponse.json({ error: 'Start date not configured' }, { status: 404 });
    }

    const today = new Date();
    const startDate = new Date(settings.startDate);
    const elapsedDays = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const weekNumber = Math.min(52, Math.max(1, Math.floor(elapsedDays / 7) + 1));

    const currentWeek = await prisma.week.findUnique({
      where: { weekNumber },
      include: {
        days: { include: { taskItems: true } },
        reviewResponses: true,
        buildLogEntry: true,
      },
    });

    if (!currentWeek) {
      return NextResponse.json({ error: 'Week not found' }, { status: 404 });
    }

    // Tasks completed
    const allTaskItems = currentWeek.days.flatMap((d) => d.taskItems);
    const tasksCompleted = allTaskItems.filter((t) => t.isComplete).length;
    const totalTasks = allTaskItems.length;

    // Hours logged
    const hoursLogged = currentWeek.hoursLogged ?? 0;

    // Current streak
    const completedDays = await prisma.day.findMany({
      where: { completedAt: { not: null } },
      select: { completedAt: true },
    });
    const completionDates = completedDays
      .map((d) => d.completedAt)
      .filter((d): d is Date => d !== null);
    const currentStreak = calculateStreak(completionDates, today);

    // Average confidence
    const confidences = currentWeek.days
      .map((d) => d.confidence)
      .filter((c): c is number => c !== null);
    const avgConfidence = confidences.length > 0
      ? Math.round((confidences.reduce((a, b) => a + b, 0) / confidences.length) * 10) / 10
      : null;

    // Carry-over items (incomplete tasks)
    const carryOverCount = allTaskItems.filter((t) => !t.isComplete).length;

    // Next week preview
    let nextWeekPreview = null;
    if (weekNumber < 52) {
      const nextWeek = await prisma.week.findUnique({
        where: { weekNumber: weekNumber + 1 },
        select: { title: true, goal: true },
      });
      if (nextWeek) {
        nextWeekPreview = { title: nextWeek.title, goal: nextWeek.goal };
      }
    }

    return NextResponse.json({
      weekNumber,
      title: currentWeek.title,
      tasksCompleted,
      totalTasks,
      hoursLogged,
      currentStreak,
      avgConfidence,
      carryOverCount,
      nextWeekPreview,
    });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
