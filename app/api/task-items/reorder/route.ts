import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ReorderTaskItemsRequest } from '@/lib/types';

/**
 * PATCH /api/task-items/reorder
 *
 * Reorders task items within a category for a given day.
 * Accepts a ReorderTaskItemsRequest body with dayId, category, and orderedIds.
 * Updates sortOrder for each item in a single transaction.
 */
export async function PATCH(req: NextRequest) {
  try {
    const body = (await req.json()) as ReorderTaskItemsRequest;
    const { dayId, category, orderedIds } = body;

    // Validate dayId
    if (!dayId || isNaN(Number(dayId))) {
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

    // Validate orderedIds is a non-empty array
    if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
      return NextResponse.json(
        { error: 'orderedIds must be a non-empty array' },
        { status: 400 }
      );
    }

    // Verify the day exists
    const day = await prisma.day.findUnique({ where: { id: Number(dayId) } });
    if (!day) {
      return NextResponse.json(
        { error: 'Day not found' },
        { status: 404 }
      );
    }

    // Fetch existing items for this day+category
    const existingItems = await prisma.taskItem.findMany({
      where: { dayId: Number(dayId), category },
      orderBy: { sortOrder: 'asc' },
    });

    const existingIds = existingItems.map((item) => item.id);

    // Validate that orderedIds match existing items for this day+category
    const orderedIdsSet = new Set(orderedIds);
    const existingIdsSet = new Set(existingIds);

    if (orderedIdsSet.size !== orderedIds.length) {
      return NextResponse.json(
        { error: 'Provided IDs do not match existing items' },
        { status: 400 }
      );
    }

    if (
      orderedIdsSet.size !== existingIdsSet.size ||
      !orderedIds.every((id) => existingIdsSet.has(id))
    ) {
      return NextResponse.json(
        { error: 'Provided IDs do not match existing items' },
        { status: 400 }
      );
    }

    // Update sortOrder for each item in a single transaction
    const updates = orderedIds.map((id, index) =>
      prisma.taskItem.update({
        where: { id },
        data: { sortOrder: index },
      })
    );

    await prisma.$transaction(updates);

    // Fetch and return the updated items in new order
    const updatedItems = await prisma.taskItem.findMany({
      where: { dayId: Number(dayId), category },
      orderBy: { sortOrder: 'asc' },
    });

    return NextResponse.json(updatedItems);
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
