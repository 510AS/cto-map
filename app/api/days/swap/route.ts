import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/days/swap
 * Swaps the sortOrder of two adjacent days.
 * Body: { dayId1: number, dayId2: number }
 */
export async function POST(req: NextRequest) {
  try {
    const { dayId1, dayId2 } = await req.json();

    if (!dayId1 || !dayId2) {
      return NextResponse.json({ error: 'Both dayId1 and dayId2 are required' }, { status: 400 });
    }

    const [day1, day2] = await Promise.all([
      prisma.day.findUnique({ where: { id: dayId1 } }),
      prisma.day.findUnique({ where: { id: dayId2 } }),
    ]);

    if (!day1 || !day2) {
      return NextResponse.json({ error: 'One or both days not found' }, { status: 404 });
    }

    if (day1.weekId !== day2.weekId) {
      return NextResponse.json({ error: 'Days must be in the same week' }, { status: 400 });
    }

    // Swap sortOrder values using a transaction
    await prisma.$transaction([
      prisma.day.update({ where: { id: dayId1 }, data: { sortOrder: day2.sortOrder } }),
      prisma.day.update({ where: { id: dayId2 }, data: { sortOrder: day1.sortOrder } }),
    ]);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
