import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseSuggestions } from '@/lib/suggestion-parser';
import { TaskItemSuggestion } from '@/lib/types';

/**
 * GET /api/task-items/suggestions?dayId=X
 *
 * Returns an array of TaskItemSuggestion objects combining:
 * 1. Template suggestions derived from the day's learnTask/buildTask descriptions
 * 2. Carry-over suggestions from the previous day (same week) incomplete items
 *
 * Requirements: 5.1, 5.4, 9.1, 9.2, 9.4
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const dayIdParam = searchParams.get('dayId');

    if (!dayIdParam) {
      return NextResponse.json(
        { error: 'Invalid dayId' },
        { status: 400 }
      );
    }

    const dayId = Number(dayIdParam);
    if (isNaN(dayId)) {
      return NextResponse.json(
        { error: 'Invalid dayId' },
        { status: 400 }
      );
    }

    // Fetch the day with its week info
    const day = await prisma.day.findUnique({
      where: { id: dayId },
      include: { week: true },
    });

    if (!day) {
      return NextResponse.json(
        { error: 'Day not found' },
        { status: 404 }
      );
    }

    const suggestions: TaskItemSuggestion[] = [];

    // 1. Generate template suggestions from learnTask/buildTask descriptions
    const learnSuggestions = parseSuggestions(day.learnTask, 'learn');
    const buildSuggestions = parseSuggestions(day.buildTask, 'build');

    // 2. Filter out suggestions that already exist as task items for this day
    const existingItems = await prisma.taskItem.findMany({
      where: { dayId },
      select: { title: true, category: true },
    });
    const existingSet = new Set(existingItems.map((item) => `${item.category}:${item.title.toLowerCase()}`));

    const filteredLearn = learnSuggestions.filter(
      (s) => !existingSet.has(`learn:${s.title.toLowerCase()}`)
    );
    const filteredBuild = buildSuggestions.filter(
      (s) => !existingSet.has(`build:${s.title.toLowerCase()}`)
    );

    suggestions.push(...filteredLearn, ...filteredBuild);

    // 2. Query previous day (same week) for incomplete items as carry-over suggestions
    // The previous day is the one with sortOrder immediately less than the current day's sortOrder
    const previousDay = await prisma.day.findFirst({
      where: {
        weekId: day.weekId,
        sortOrder: { lt: day.sortOrder },
      },
      orderBy: { sortOrder: 'desc' },
      include: {
        taskItems: {
          where: { isComplete: false },
        },
      },
    });

    if (previousDay && previousDay.taskItems.length > 0) {
      const carryOverSuggestions: TaskItemSuggestion[] = previousDay.taskItems
        .filter((item) => !existingSet.has(`${item.category}:${item.title.toLowerCase()}`))
        .map((item) => ({
          title: item.title,
          category: item.category as 'learn' | 'build',
          source: 'carry-over' as const,
          sourceNote: item.note,
        }));
      suggestions.push(...carryOverSuggestions);
    }

    return NextResponse.json(suggestions);
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
