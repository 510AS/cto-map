import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/review-reminders
 * Returns due review reminders (nextReview <= now).
 */
export async function GET() {
  try {
    const now = new Date();

    const reminders = await prisma.reviewReminder.findMany({
      where: {
        nextReview: { lte: now },
      },
      include: {
        week: { select: { weekNumber: true, title: true } },
      },
      orderBy: { nextReview: 'asc' },
    });

    return NextResponse.json(reminders);
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/review-reminders
 * Creates a new review reminder.
 * Body: { weekId: number, interval?: number }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { weekId, interval } = body;

    if (!weekId || typeof weekId !== 'number') {
      return NextResponse.json(
        { error: 'weekId is required and must be a number' },
        { status: 400 }
      );
    }

    // Verify week exists
    const week = await prisma.week.findUnique({ where: { id: weekId } });
    if (!week) {
      return NextResponse.json(
        { error: 'Week not found' },
        { status: 404 }
      );
    }

    const reminderInterval = interval && typeof interval === 'number' ? interval : 1;
    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + reminderInterval);

    const reminder = await prisma.reviewReminder.create({
      data: {
        weekId,
        interval: reminderInterval,
        nextReview,
        confidence: 3,
      },
      include: {
        week: { select: { weekNumber: true, title: true } },
      },
    });

    return NextResponse.json(reminder, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
