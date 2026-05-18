import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateDayCompletion } from '@/lib/completion-calculator';
import { TaskItem } from '@/lib/types';
import { UpdateTaskItemSchema } from '@/lib/validators';

/**
 * PATCH /api/task-items/[id]
 *
 * Updates a task item's fields (isComplete, title, timeEstimate, note, resourceUrl).
 * After updating, recalculates day completion and persists the result.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = Number(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid task item ID' },
        { status: 400 }
      );
    }

    const rawBody = await req.json();

    // Validate with Zod
    const parseResult = UpdateTaskItemSchema.safeParse(rawBody);
    if (!parseResult.success) {
      const firstError = parseResult.error.errors[0];
      return NextResponse.json(
        { error: firstError.message },
        { status: 400 }
      );
    }

    const body = parseResult.data;

    // Find the existing task item
    const existing = await prisma.taskItem.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: 'Task item not found' },
        { status: 404 }
      );
    }

    // Build update data from provided fields
    const updateData: Record<string, unknown> = {};
    if (body.isComplete !== undefined) updateData.isComplete = body.isComplete;
    if (body.title !== undefined) updateData.title = body.title;
    if (body.timeEstimate !== undefined) updateData.timeEstimate = body.timeEstimate;
    if (body.note !== undefined) updateData.note = body.note;
    if (body.resourceUrl !== undefined) updateData.resourceUrl = body.resourceUrl;
    if (body.priority !== undefined) updateData.priority = body.priority;
    if (body.actualMinutes !== undefined) updateData.actualMinutes = body.actualMinutes;

    // Update the task item
    const updated = await prisma.taskItem.update({
      where: { id },
      data: updateData,
    });

    // Recalculate day completion
    const allItems = await prisma.taskItem.findMany({
      where: { dayId: existing.dayId },
    });

    const day = await prisma.day.findUnique({ where: { id: existing.dayId } });
    if (!day) {
      return NextResponse.json(
        { error: 'Day not found' },
        { status: 404 }
      );
    }

    const taskItemsForCalc: TaskItem[] = allItems.map((item) => ({
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

    const completion = calculateDayCompletion(taskItemsForCalc, {
      learnComplete: day.learnComplete,
      buildComplete: day.buildComplete,
    });

    // Update day completion fields
    await prisma.day.update({
      where: { id: existing.dayId },
      data: {
        learnComplete: completion.learnComplete,
        buildComplete: completion.buildComplete,
        isComplete: completion.isComplete,
        completedAt: completion.isComplete ? new Date() : null,
      },
    });

    return NextResponse.json({
      id: updated.id,
      title: updated.title,
      category: updated.category,
      isComplete: updated.isComplete,
      sortOrder: updated.sortOrder,
      timeEstimate: updated.timeEstimate,
      note: updated.note,
      resourceUrl: (updated as any).resourceUrl,
      priority: (updated as any).priority,
      actualMinutes: (updated as any).actualMinutes,
      createdAt: updated.createdAt.toISOString(),
      dayId: updated.dayId,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/task-items/[id]
 *
 * Removes a task item. After deletion, recalculates day completion.
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = Number(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid task item ID' },
        { status: 400 }
      );
    }

    // Find the existing task item
    const existing = await prisma.taskItem.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: 'Task item not found' },
        { status: 404 }
      );
    }

    // Delete the task item
    await prisma.taskItem.delete({ where: { id } });

    // Fetch remaining items for the day
    const remainingItems = await prisma.taskItem.findMany({
      where: { dayId: existing.dayId },
    });

    const day = await prisma.day.findUnique({ where: { id: existing.dayId } });
    if (!day) {
      return NextResponse.json(
        { error: 'Day not found' },
        { status: 404 }
      );
    }

    const taskItemsForCalc: TaskItem[] = remainingItems.map((item) => ({
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

    const completion = calculateDayCompletion(taskItemsForCalc, {
      learnComplete: day.learnComplete,
      buildComplete: day.buildComplete,
    });

    // Update day completion fields
    await prisma.day.update({
      where: { id: existing.dayId },
      data: {
        learnComplete: completion.learnComplete,
        buildComplete: completion.buildComplete,
        isComplete: completion.isComplete,
        completedAt: completion.isComplete ? new Date() : null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
