import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const VALID_PROMPTS = ['learned', 'built', 'difficult', 'differently'] as const;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const weekIdParam = searchParams.get('weekId');

  if (!weekIdParam) {
    return NextResponse.json(
      { error: 'weekId query parameter is required' },
      { status: 400 }
    );
  }

  const weekId = Number(weekIdParam);
  if (isNaN(weekId)) {
    return NextResponse.json(
      { error: 'weekId must be a valid number' },
      { status: 400 }
    );
  }

  try {
    const responses = await prisma.reviewResponse.findMany({
      where: { weekId },
    });
    return NextResponse.json(responses);
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { weekId, prompt, response } = body;

    if (weekId == null || !prompt || response == null) {
      return NextResponse.json(
        { error: 'weekId, prompt, and response are required' },
        { status: 400 }
      );
    }

    if (!VALID_PROMPTS.includes(prompt)) {
      return NextResponse.json(
        { error: `prompt must be one of: ${VALID_PROMPTS.join(', ')}` },
        { status: 400 }
      );
    }

    const reviewResponse = await prisma.reviewResponse.upsert({
      where: {
        weekId_prompt: { weekId: Number(weekId), prompt },
      },
      update: {
        response,
      },
      create: {
        weekId: Number(weekId),
        prompt,
        response,
      },
    });

    return NextResponse.json(reviewResponse);
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
    const { weekId, prompt, response } = body;

    if (weekId == null || !prompt || response == null) {
      return NextResponse.json(
        { error: 'weekId, prompt, and response are required' },
        { status: 400 }
      );
    }

    if (!VALID_PROMPTS.includes(prompt)) {
      return NextResponse.json(
        { error: `prompt must be one of: ${VALID_PROMPTS.join(', ')}` },
        { status: 400 }
      );
    }

    const reviewResponse = await prisma.reviewResponse.upsert({
      where: {
        weekId_prompt: { weekId: Number(weekId), prompt },
      },
      update: {
        response,
      },
      create: {
        weekId: Number(weekId),
        prompt,
        response,
      },
    });

    return NextResponse.json(reviewResponse);
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
