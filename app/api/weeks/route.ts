import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/weeks
 * Returns all 52 weeks with their phase, days, and tags (including tag details).
 * Used by the progress overview page to display all weeks grouped by phase.
 */
export async function GET() {
  try {
    const weeks = await prisma.week.findMany({
      include: {
        phase: true,
        days: {
          orderBy: { sortOrder: 'asc' },
        },
        tags: {
          include: {
            tag: true,
          },
        },
      },
      orderBy: { weekNumber: 'asc' },
    });

    return NextResponse.json(weeks);
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
