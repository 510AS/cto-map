import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/knowledge
 * Returns tags with their weeks and completion status for the knowledge graph.
 */
export async function GET() {
  try {
    const tags = await prisma.tag.findMany({
      include: {
        weeks: {
          include: {
            week: {
              select: {
                weekNumber: true,
                title: true,
                isComplete: true,
                days: { select: { isComplete: true, learnComplete: true, buildComplete: true } },
              },
            },
          },
        },
      },
    });

    const result = tags.map((tag) => ({
      id: tag.id,
      name: tag.name,
      weeks: tag.weeks.map((wt) => {
        const completedDays = wt.week.days.filter((d) => d.isComplete).length;
        const totalDays = wt.week.days.length;
        const inProgress = !wt.week.isComplete && (completedDays > 0 || wt.week.days.some((d) => d.learnComplete || d.buildComplete));
        return {
          weekNumber: wt.week.weekNumber,
          title: wt.week.title,
          status: wt.week.isComplete ? 'complete' : inProgress ? 'in-progress' : 'not-started',
        };
      }),
    }));

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
