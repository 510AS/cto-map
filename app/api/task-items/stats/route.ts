import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateChecklistStats } from '@/lib/checklist-stats';

/**
 * GET /api/task-items/stats
 * Returns checklist statistics including average items per day,
 * overall completion rate, most productive day, and week-over-week trend.
 */
export async function GET() {
  try {
    // Fetch all days that have task items, including their task items and week info
    const daysWithItems = await prisma.day.findMany({
      where: {
        taskItems: {
          some: {},
        },
      },
      include: {
        taskItems: true,
        week: true,
      },
      orderBy: [
        { week: { weekNumber: 'asc' } },
        { sortOrder: 'asc' },
      ],
    });

    // Find the highest week number to determine current and previous weeks
    const allWeekNumbers = daysWithItems.map((d) => d.week.weekNumber);
    const maxWeekNumber = allWeekNumbers.length > 0 ? Math.max(...allWeekNumbers) : 0;
    const currentWeekNumber = maxWeekNumber;
    const previousWeekNumber = maxWeekNumber - 1;

    // Collect current week and previous week task items
    const currentWeekItems = daysWithItems
      .filter((d) => d.week.weekNumber === currentWeekNumber)
      .flatMap((d) => d.taskItems);

    const previousWeekItems = daysWithItems
      .filter((d) => d.week.weekNumber === previousWeekNumber)
      .flatMap((d) => d.taskItems);

    // Map days to the format expected by calculateChecklistStats
    // sortOrder represents the day's position within the week (0-6)
    const days = daysWithItems.map((d) => ({
      dayOfWeek: d.sortOrder,
      taskItems: d.taskItems.map((item) => ({
        id: item.id,
        title: item.title,
        category: item.category as 'learn' | 'build',
        isComplete: item.isComplete,
        sortOrder: item.sortOrder,
        timeEstimate: item.timeEstimate,
        note: item.note,
        createdAt: item.createdAt.toISOString(),
        dayId: item.dayId,
      })),
    }));

    // Map current and previous week items to TaskItem interface
    const mappedCurrentWeekItems = currentWeekItems.map((item) => ({
      id: item.id,
      title: item.title,
      category: item.category as 'learn' | 'build',
      isComplete: item.isComplete,
      sortOrder: item.sortOrder,
      timeEstimate: item.timeEstimate,
      note: item.note,
      createdAt: item.createdAt.toISOString(),
      dayId: item.dayId,
    }));

    const mappedPreviousWeekItems = previousWeekItems.map((item) => ({
      id: item.id,
      title: item.title,
      category: item.category as 'learn' | 'build',
      isComplete: item.isComplete,
      sortOrder: item.sortOrder,
      timeEstimate: item.timeEstimate,
      note: item.note,
      createdAt: item.createdAt.toISOString(),
      dayId: item.dayId,
    }));

    const stats = calculateChecklistStats(
      days,
      mappedCurrentWeekItems,
      mappedPreviousWeekItems
    );

    // Calculate estimate accuracy (actual vs estimated time)
    const itemsWithBoth = daysWithItems
      .flatMap((d) => d.taskItems)
      .filter((item) => item.timeEstimate != null && item.timeEstimate > 0 && (item as any).actualMinutes != null && (item as any).actualMinutes > 0);

    let estimateAccuracy = null;
    if (itemsWithBoth.length > 0) {
      const totalRatio = itemsWithBoth.reduce((sum, item) => {
        return sum + ((item as any).actualMinutes / item.timeEstimate!);
      }, 0);
      estimateAccuracy = {
        ratio: totalRatio / itemsWithBoth.length,
        count: itemsWithBoth.length,
      };
    }

    return NextResponse.json({ ...stats, estimateAccuracy });
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
