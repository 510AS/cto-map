import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const { weekId, dayId, content } = await req.json();

    if (typeof content !== 'string') {
      return NextResponse.json(
        { error: 'content must be a string' },
        { status: 400 }
      );
    }

    if (!weekId && !dayId) {
      return NextResponse.json(
        { error: 'Either weekId or dayId must be provided' },
        { status: 400 }
      );
    }

    if (weekId) {
      const week = await prisma.week.update({
        where: { id: Number(weekId) },
        data: { note: content },
      });
      return NextResponse.json(week);
    }

    if (dayId) {
      const day = await prisma.day.update({
        where: { id: Number(dayId) },
        data: { note: content },
      });
      return NextResponse.json(day);
    }

    return NextResponse.json(
      { error: 'Either weekId or dayId must be provided' },
      { status: 400 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { weekId, dayId, content } = await req.json();

    if (typeof content !== 'string') {
      return NextResponse.json(
        { error: 'content must be a string' },
        { status: 400 }
      );
    }

    if (!weekId && !dayId) {
      return NextResponse.json(
        { error: 'Either weekId or dayId must be provided' },
        { status: 400 }
      );
    }

    if (weekId) {
      const week = await prisma.week.update({
        where: { id: Number(weekId) },
        data: { note: content },
      });
      return NextResponse.json(week);
    }

    if (dayId) {
      const day = await prisma.day.update({
        where: { id: Number(dayId) },
        data: { note: content },
      });
      return NextResponse.json(day);
    }

    return NextResponse.json(
      { error: 'Either weekId or dayId must be provided' },
      { status: 400 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
