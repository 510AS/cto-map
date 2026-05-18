import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { detectBurnout } from '@/lib/burnout-detector';

/**
 * GET /api/burnout-check
 * Returns burnout risk level and suggestions.
 */
export async function GET() {
  try {
    const settings = await prisma.settings.findUnique({ where: { id: 1 } });
    if (!settings?.startDate) {
      return NextResponse.json({ risk: 'low', score: 0, suggestions: [], factors: [] });
    }

    const today = new Date();
    const startDate = new Date(settings.startDate);
    const elapsedDays = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const currentWeekNumber = Math.min(52, Math.max(1, Math.floor(elapsedDays / 7) + 1));

    // Get last 4 weeks of data
    const startWeek = Math.max(1, currentWeekNumber - 3);
    const weeks = await prisma.week.findMany({
      where: { weekNumber: { gte: startWeek, lte: currentWeekNumber } },
      include: { days: true },
      orderBy: { weekNumber: 'asc' },
    });

    const weekStats = weeks.map((w) => {
      const nonSkipped = w.days.filter((d) => !d.skipped);
      const confidences = w.days
        .map((d) => d.confidence)
        .filter((c): c is number => c !== null);
      const avgConfidence = confidences.length > 0
        ? confidences.reduce((a, b) => a + b, 0) / confidences.length
        : null;

      return {
        weekNumber: w.weekNumber,
        completedDays: nonSkipped.filter((d) => d.isComplete).length,
        totalDays: nonSkipped.length,
        skippedDays: w.days.filter((d) => d.skipped).length,
        confidence: avgConfidence,
      };
    });

    const result = detectBurnout(weekStats);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
