import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateDayCompletion } from '@/lib/completion-calculator';
import { TaskItem } from '@/lib/types';
import { CreateTaskItemSchema } from '@/lib/validators';

/**
 * GET /api/task-items?dayId=X
 *
 * Fetches task items for a given day, ordered by sortOrder ascending
 * within each category, grouped as learn items first then build items.
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

    // Verify the day exists
    const day = await prisma.day.findUnique({ where: { id: dayId } });
    if (!day) {
      return NextResponse.json(
        { error: 'Day not found' },
        { status: 404 }
      );
    }

    const taskItems = await prisma.taskItem.findMany({
      where: { dayId },
      orderBy: { sortOrder: 'asc' },
    });

    // Group by category: learn first, then build
    const learnItems = taskItems.filter((item) => item.category === 'learn');
    const buildItems = taskItems.filter((item) => item.category === 'build');

    return NextResponse.json({
      learn: learnItems,
      build: buildItems,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/task-items
 *
 * Creates a new task item for a given day.
 * Validates using Zod schema.
 * Assigns sortOrder = max existing sortOrder for that day+category + 1.
 * Runs completion calculator and updates Day completion fields.
 */
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.json();

    // Validate with Zod
    const parseResult = CreateTaskItemSchema.safeParse(rawBody);
    if (!parseResult.success) {
      const firstError = parseResult.error.errors[0];
      return NextResponse.json(
        { error: firstError.message },
        { status: 400 }
      );
    }

    const { dayId, title, category, timeEstimate, note, resourceUrl } = parseResult.data;
    const priority = (parseResult.data as any).priority;

    // Verify the day exists
    const day = await prisma.day.findUnique({ where: { id: dayId } });
    if (!day) {
      return NextResponse.json(
        { error: 'Day not found' },
        { status: 404 }
      );
    }

    // Calculate sortOrder: max existing sortOrder for this day+category + 1
    const maxSortOrderItem = await prisma.taskItem.findFirst({
      where: { dayId, category },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    });

    const sortOrder = maxSortOrderItem ? maxSortOrderItem.sortOrder + 1 : 0;

    // Create the task item
    const createdItem = await prisma.taskItem.create({
      data: {
        title,
        category,
        isComplete: false,
        sortOrder,
        timeEstimate: timeEstimate ?? null,
        note: note ?? null,
        resourceUrl: resourceUrl ?? null,
        priority: priority ?? null,
        dayId,
      },
    });

    // Run completion calculator and update Day completion fields
    const allItems = await prisma.taskItem.findMany({
      where: { dayId },
    });

    const itemsAsTaskItems: TaskItem[] = allItems.map((item) => ({
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

    const completion = calculateDayCompletion(itemsAsTaskItems, {
      learnComplete: day.learnComplete,
      buildComplete: day.buildComplete,
    });

    await prisma.day.update({
      where: { id: dayId },
      data: {
        learnComplete: completion.learnComplete,
        buildComplete: completion.buildComplete,
        isComplete: completion.isComplete,
        completedAt: completion.isComplete ? new Date() : null,
      },
    });

    return NextResponse.json(createdItem, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
