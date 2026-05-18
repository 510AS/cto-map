import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/heatmap
 * Returns all 312 days with their status for the curriculum heatmap.
 */
export async function GET() {
  try {
    const weeks = await prisma.week.findMany({
      select: {
        weekNumber: true,
        title: true,
        days: {
          select: {
            id: true,
            dayLabel: true,
            sortOrder: true,
            isComplete: true,
            learnComplete: true,
            buildComplete: true,
            skipped: true,
          },
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: { weekNumber: 'asc' },
    });

    const cells = weeks.flatMap((w) =>
      w.days.map((d) => ({
        id: d.id,
        weekNumber: w.weekNumber,
        weekTitle: w.title,
        dayLabel: d.dayLabel,
        sortOrder: d.sortOrder,
        status: d.skipped
          ? 'skipped'
          : d.isComplete
          ? 'complete'
          : d.learnComplete || d.buildComplete
          ? 'in-progress'
          : 'not-started',
      }))
    );

    return NextResponse.json(cells);
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
