import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getLevel, getXpForNextLevel } from '@/lib/xp';

/**
 * GET /api/xp
 * Returns current XP, level, and progress to next level.
 * Enhancement #13: Added Cache-Control headers for 60-second caching.
 */
export async function GET() {
  try {
    const settings = await prisma.settings.findFirst({ where: { id: 1 } });
    const xp = settings?.xp ?? 0;
    const level = getLevel(xp);
    const nextLevel = getXpForNextLevel(xp);

    const response = NextResponse.json({
      xp,
      level,
      currentInLevel: nextLevel.current,
      neededForNext: nextLevel.needed,
      progress: nextLevel.progress,
    });

    // Enhancement #13: Cache for 60 seconds
    response.headers.set('Cache-Control', 'max-age=60, stale-while-revalidate=120');

    return response;
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/xp
 * Adds XP. Body: { amount: number }
 */
export async function POST(req: NextRequest) {
  try {
    const { amount } = await req.json();
    if (typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    const settings = await prisma.settings.upsert({
      where: { id: 1 },
      update: { xp: { increment: amount } },
      create: { id: 1, xp: amount },
    });

    const xp = settings.xp;
    const level = getLevel(xp);
    const nextLevel = getXpForNextLevel(xp);

    return NextResponse.json({
      xp,
      level,
      currentInLevel: nextLevel.current,
      neededForNext: nextLevel.needed,
      progress: nextLevel.progress,
    });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
