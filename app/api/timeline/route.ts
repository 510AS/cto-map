import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/timeline
 * Returns all phases with their weeks (including tags) in chronological order,
 * plus all unique tags for filtering.
 */
export async function GET() {
  try {
    const phases = await prisma.phase.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        weeks: {
          orderBy: { weekNumber: 'asc' },
          select: {
            id: true,
            weekNumber: true,
            title: true,
            saasEvolution: true,
            isComplete: true,
            phaseId: true,
            tags: {
              include: {
                tag: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    const tags = await prisma.tag.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
      },
    });

    return NextResponse.json({ phases, tags });
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
