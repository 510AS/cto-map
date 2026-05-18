import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseSuggestions } from '@/lib/suggestion-parser';

/**
 * GET /api/days/[dayId]/full
 *
 * Enhancement #7: Single API endpoint that returns all data needed for the day detail page.
 * Returns day info (with week/phase), task items grouped by category, and suggestions.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { dayId: string } }
) {
  try {
    const dayId = Number(params.dayId);
    if (isNaN(dayId)) {
      return NextResponse.json({ error: 'Invalid dayId' }, { status: 400 });
    }

    const day = await prisma.day.findUnique({
      where: { id: dayId },
      include: {
        week: {
          select: {
            weekNumber: true,
            title: true,
            phase: { select: { name: true, badge: true } },
          },
        },
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
          weekNumber: day.week.weekNumber,
          title: day.week.title,
          phase: day.week.phase,
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
