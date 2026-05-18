import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/flashcards
 * Returns weeks that have review responses for flashcard mode.
 */
export async function GET() {
  try {
    const weeks = await prisma.week.findMany({
      where: {
        reviewResponses: { some: {} },
      },
      select: {
        weekNumber: true,
        title: true,
        reviewResponses: {
          select: { prompt: true, response: true },
        },
      },
      orderBy: { weekNumber: 'asc' },
    });

    const flashcards = weeks.map((w) => ({
      weekNumber: w.weekNumber,
      title: w.title,
      responses: w.reviewResponses,
    }));

    return NextResponse.json(flashcards);
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
