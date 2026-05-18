import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/weeks/[weekId]
 * Fetch a week by its weekNumber (passed as weekId param).
 * Supports ?include=full to include days, reviewResponses, buildLogEntry, and phase.
 * Returns the week data.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { weekId: string } }
) {
  try {
    const weekNumber = Number(params.weekId);
    if (isNaN(weekNumber) || weekNumber < 1 || weekNumber > 52) {
      return NextResponse.json(
        { error: 'Week number must be between 1 and 52' },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(req.url);
    const include = searchParams.get('include');

    const week = await prisma.week.findUnique({
      where: { weekNumber },
      include: include === 'full'
        ? {
            days: {
              orderBy: { sortOrder: 'asc' },
              include: { taskItems: { orderBy: { sortOrder: 'asc' } } },
            },
            reviewResponses: true,
            buildLogEntry: true,
            phase: true,
          }
        : undefined,
    });

    if (!week) {
      return NextResponse.json(
        { error: 'Week not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(week);
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/weeks/[weekId]
 * Toggle week completion status.
 * Body: { isComplete: boolean }
 * Returns the updated week.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { weekId: string } }
) {
  try {
    const { isComplete } = await req.json();

    if (typeof isComplete !== 'boolean') {
      return NextResponse.json(
        { error: 'isComplete must be a boolean' },
        { status: 400 }
      );
    }

    const weekId = Number(params.weekId);
    if (isNaN(weekId)) {
      return NextResponse.json(
        { error: 'Invalid weekId' },
        { status: 400 }
      );
    }

    const week = await prisma.week.update({
      where: { id: weekId },
      data: { isComplete },
    });

    return NextResponse.json(week);
  } catch (error: unknown) {
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      (error as { code: string }).code === 'P2025'
    ) {
      return NextResponse.json(
        { error: 'Week not found' },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/weeks/[weekId]
 * Update hoursLogged for the week.
 * Body: { hoursLogged: number }
 * Returns the updated week.
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: { weekId: string } }
) {
  try {
    const { hoursLogged } = await req.json();

    if (typeof hoursLogged !== 'number' || isNaN(hoursLogged)) {
      return NextResponse.json(
        { error: 'hoursLogged must be a number' },
        { status: 400 }
      );
    }

    const weekId = Number(params.weekId);
    if (isNaN(weekId)) {
      return NextResponse.json(
        { error: 'Invalid weekId' },
        { status: 400 }
      );
    }

    const week = await prisma.week.update({
      where: { id: weekId },
      data: { hoursLogged },
    });

    return NextResponse.json(week);
  } catch (error: unknown) {
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      (error as { code: string }).code === 'P2025'
    ) {
      return NextResponse.json(
        { error: 'Week not found' },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
