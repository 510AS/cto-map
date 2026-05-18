import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * PATCH /api/review-reminders/[id]
 * Updates confidence and reschedules the reminder.
 * Body: { confidence: number (1-5) }
 * 
 * Spaced repetition intervals based on confidence:
 * 1 = 1 day, 2 = 3 days, 3 = 7 days, 4 = 14 days, 5 = 30 days
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = Number(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid reminder ID' },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { confidence } = body;

    if (typeof confidence !== 'number' || confidence < 1 || confidence > 5) {
      return NextResponse.json(
        { error: 'Confidence must be a number between 1 and 5' },
        { status: 400 }
      );
    }

    const existing = await prisma.reviewReminder.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: 'Reminder not found' },
        { status: 404 }
      );
    }

    // Calculate new interval based on confidence
    const intervalMap: Record<number, number> = {
      1: 1,
      2: 3,
      3: 7,
      4: 14,
      5: 30,
    };

    const newInterval = intervalMap[confidence];
    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + newInterval);

    const updated = await prisma.reviewReminder.update({
      where: { id },
      data: {
        confidence,
        interval: newInterval,
        nextReview,
      },
      include: {
        week: { select: { weekNumber: true, title: true } },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
