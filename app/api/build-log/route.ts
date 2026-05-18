import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const weeks = await prisma.week.findMany({
      orderBy: { weekNumber: 'asc' },
      select: {
        id: true,
        weekNumber: true,
        title: true,
        buildLogEntry: {
          select: {
            id: true,
            content: true,
          },
        },
      },
    });

    return NextResponse.json(weeks);
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { weekId, content } = await req.json();

    if (!weekId || typeof weekId !== 'number') {
      return NextResponse.json(
        { error: 'weekId is required and must be a number' },
        { status: 400 }
      );
    }

    if (content === undefined || content === null) {
      return NextResponse.json(
        { error: 'content is required' },
        { status: 400 }
      );
    }

    const entry = await prisma.buildLogEntry.upsert({
      where: { weekId },
      create: { weekId, content },
      update: { content },
    });

    return NextResponse.json(entry);
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { weekId, content } = await req.json();

    if (!weekId || typeof weekId !== 'number') {
      return NextResponse.json(
        { error: 'weekId is required and must be a number' },
        { status: 400 }
      );
    }

    if (content === undefined || content === null) {
      return NextResponse.json(
        { error: 'content is required' },
        { status: 400 }
      );
    }

    const entry = await prisma.buildLogEntry.upsert({
      where: { weekId },
      create: { weekId, content },
      update: { content },
    });

    return NextResponse.json(entry);
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
