import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseSuggestions } from '@/lib/suggestion-parser';

/**
 * GET /api/days/by-week/full?weekNumber=X&sortOrder=Y
 *
 * Enhancement #7: Single API endpoint that finds a day by weekNumber + sortOrder
 * and returns all data needed for the day detail page.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const weekNumber = Number(searchParams.get('weekNumber'));
    const sortOrder = Number(searchParams.get('sortOrder'));

    if (isNaN(weekNumber) || isNaN(sortOrder)) {
      return NextResponse.json(
        { error: 'weekNumber and sortOrder are required' },
        { status: 400 }
      );
    }

    const week = await prisma.week.findUnique({
      where: { weekNumber },
      select: {
        id: true,
        weekNumber: true,
        title: true,
        phase: { select: { name: true, badge: true } },
      },
    });

    if (!week) {
      return NextResponse.json({ error: 'Week not found' }, { status: 404 });
    }

    const day = await prisma.day.findFirst({
      where: { weekId: week.id, sortOrder },
      include: {
        taskItems: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!day) {
      return NextResponse.json({ error: 'Day not found' }, { status: 404 });
    }

    // Group task items by category
    const learnItems = day.taskItems.filter((t) => t.category === 'learn');
    const buildItems = day.taskItems.filter((t) => t.category === 'build');

    // Generate suggestions if no task items exist
    let suggestions: { title: string; category: string }[] = [];
    if (day.taskItems.length === 0) {
      const learnSuggestions = parseSuggestions(day.learnTask, 'learn');
      const buildSuggestions = parseSuggestions(day.buildTask, 'build');
      suggestions = [...learnSuggestions, ...buildSuggestions];
    }

    return NextResponse.json({
      day: {
        id: day.id,
        dayLabel: day.dayLabel,
        learnTask: day.learnTask,
        buildTask: day.buildTask,
        sortOrder: day.sortOrder,
        isComplete: day.isComplete,
        learnComplete: day.learnComplete,
        buildComplete: day.buildComplete,
        completedAt: day.completedAt,
        note: day.note,
        weekId: day.weekId,
        skipped: (day as any).skipped ?? false,
        confidence: (day as any).confidence ?? null,
        reflection: (day as any).reflection ?? null,
        week: {
          weekNumber: week.weekNumber,
          title: week.title,
          phase: week.phase,
        },
      },
      taskItems: {
        learn: learnItems.map((t) => ({
          id: t.id,
          title: t.title,
          category: t.category,
          isComplete: t.isComplete,
          sortOrder: t.sortOrder,
          timeEstimate: t.timeEstimate,
          note: t.note,
          resourceUrl: (t as any).resourceUrl ?? null,
          priority: (t as any).priority ?? null,
          actualMinutes: (t as any).actualMinutes ?? null,
          createdAt: t.createdAt.toISOString(),
          dayId: t.dayId,
        })),
        build: buildItems.map((t) => ({
          id: t.id,
          title: t.title,
          category: t.category,
          isComplete: t.isComplete,
          sortOrder: t.sortOrder,
          timeEstimate: t.timeEstimate,
          note: t.note,
          resourceUrl: (t as any).resourceUrl ?? null,
          priority: (t as any).priority ?? null,
          actualMinutes: (t as any).actualMinutes ?? null,
          createdAt: t.createdAt.toISOString(),
          dayId: t.dayId,
        })),
      },
      suggestions,
    });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
