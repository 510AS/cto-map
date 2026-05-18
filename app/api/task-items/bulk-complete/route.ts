import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateDayCompletion } from '@/lib/completion-calculator';
import { BulkCompleteRequest, TaskItem } from '@/lib/types';

/**
 * POST /api/task-items/bulk-complete
 *
 * Marks all task items in a specified category for a given day as complete.
 * Recalculates day completion state and updates Day fields accordingly.
 */
export async function POST(req: NextRequest) {
  try {
    const body: BulkCompleteRequest = await req.json();
    const { dayId, category } = body;

    // Validate dayId
    if (!dayId || typeof dayId !== 'number' || isNaN(dayId)) {
      return NextResponse.json(
        { error: 'Invalid dayId' },
        { status: 400 }
      );
    }

    // Validate category
    if (category !== 'learn' && category !== 'build') {
      return NextResponse.json(
        { error: "Category must be 'learn' or 'build'" },
        { status: 400 }
      );
    }

    // Verify day exists
    const day = await prisma.day.findUnique({ where: { id: dayId } });
    if (!day) {
      return NextResponse.json(
        { error: 'Day not found' },
        { status: 404 }
      );
    }

    // Mark all items in the specified category as complete
    await prisma.taskItem.updateMany({
      where: { dayId, category },
      data: { isComplete: true },
    });

    // Fetch all task items for this day to recalculate completion
    const allItems = await prisma.taskItem.findMany({
      where: { dayId },
      orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }],
    });

    // Calculate day completion from task item states
    const completionResult = calculateDayCompletion(
      allItems as unknown as TaskItem[],
      { learnComplete: day.learnComplete, buildComplete: day.buildComplete }
    );

    // Update day completion fields
    const updatedDay = await prisma.day.update({
      where: { id: dayId },
      data: {
        learnComplete: completionResult.learnComplete,
        buildComplete: completionResult.buildComplete,
        isComplete: completionResult.isComplete,
        completedAt: completionResult.isComplete ? new Date() : day.completedAt,
      },
    });

    return NextResponse.json({
      items: allItems,
      day: updatedDay,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
