import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/days/by-week?weekNumber=X&sortOrder=Y
 * 
 * Fetches a single day by its week number and sort order.
 * Includes the week title and phase info for breadcrumb display.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const weekNumberParam = searchParams.get('weekNumber');
    const sortOrderParam = searchParams.get('sortOrder');

    if (!weekNumberParam || !sortOrderParam) {
      return NextResponse.json(
        { error: 'weekNumber and sortOrder are required' },
        { status: 400 }
      );
    }

    const weekNumber = Number(weekNumberParam);
    const sortOrder = Number(sortOrderParam);

    if (isNaN(weekNumber) || isNaN(sortOrder)) {
      return NextResponse.json(
        { error: 'weekNumber and sortOrder must be numbers' },
        { status: 400 }
      );
    }

    // Find the week first
    const week = await prisma.week.findUnique({
      where: { weekNumber },
      select: { id: true, weekNumber: true, title: true, phase: { select: { name: true, badge: true } } },
    });

    if (!week) {
      return NextResponse.json(
        { error: 'Week not found' },
        { status: 404 }
      );
    }

    // Find the day by weekId + sortOrder
    const day = await prisma.day.findUnique({
      where: { weekId_sortOrder: { weekId: week.id, sortOrder } },
    });

    if (!day) {
      return NextResponse.json(
        { error: 'Day not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ...day,
      week: {
        weekNumber: week.weekNumber,
        title: week.title,
        phase: week.phase,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
