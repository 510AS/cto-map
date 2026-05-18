import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/today
 * Returns the current weekNumber and daySort based on the settings startDate.
 */
export async function GET() {
  try {
    const settings = await prisma.settings.findUnique({ where: { id: 1 } });

    if (!settings?.startDate) {
      return NextResponse.json(
        { error: 'Start date not configured' },
        { status: 404 }
      );
    }

    const today = new Date();
    const startDate = new Date(settings.startDate);
    const elapsedMs = today.getTime() - startDate.getTime();
    const elapsedDays = Math.floor(elapsedMs / (1000 * 60 * 60 * 24));

    // Calculate week number (1-indexed)
    const weekNumber = Math.min(52, Math.max(1, Math.floor(elapsedDays / 7) + 1));

    // Calculate day within the week (1-6, capped at 6 since we have 6 days per week)
    const dayInWeek = (elapsedDays % 7) + 1;
    const daySort = Math.min(6, Math.max(1, dayInWeek));

    return NextResponse.json({ weekNumber, daySort });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
