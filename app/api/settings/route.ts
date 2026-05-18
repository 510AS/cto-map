import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const settings = await prisma.settings.findUnique({
      where: { id: 1 },
    });

    return NextResponse.json({
      startDate: settings?.startDate?.toISOString() ?? null,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { startDate } = body;

    if (!startDate) {
      return NextResponse.json(
        { error: 'startDate is required' },
        { status: 400 }
      );
    }

    const parsedDate = new Date(startDate);
    if (isNaN(parsedDate.getTime())) {
      return NextResponse.json(
        { error: 'startDate must be a valid ISO date string' },
        { status: 400 }
      );
    }

    const settings = await prisma.settings.upsert({
      where: { id: 1 },
      update: { startDate: parsedDate },
      create: { id: 1, startDate: parsedDate },
    });

    return NextResponse.json({
      startDate: settings.startDate?.toISOString() ?? null,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
