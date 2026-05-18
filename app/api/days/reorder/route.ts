import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * PATCH /api/days/reorder
 * Reorders days within a week.
 * Body: { weekId: number, orderedIds: number[] }
 */
export async function PATCH(req: NextRequest) {
  try {
    const { weekId, orderedIds } = await req.json();

    if (!weekId || !Array.isArray(orderedIds)) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    // Verify the week exists
    const week = await prisma.week.findUnique({ where: { id: weekId } });
    if (!week) {
      return NextResponse.json({ error: 'Week not found' }, { status: 404 });
    }

    // Update sort orders using a transaction
    await prisma.$transaction(
      orderedIds.map((dayId, index) =>
        prisma.day.update({
          where: { id: dayId },
          data: { sortOrder: index + 1 },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
