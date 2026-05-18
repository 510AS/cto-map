import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ACHIEVEMENTS } from '@/lib/achievements';
import { calculateStreak } from '@/lib/calculations';

/**
 * GET /api/achievements
 * Returns all earned achievements.
 */
export async function GET() {
  try {
    const earned = await prisma.achievement.findMany({
      orderBy: { earnedAt: 'desc' },
    });
    return NextResponse.json(earned);
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/achievements
 * Checks conditions and awards new achievements.
 */
export async function POST() {
  try {
    const earned = await prisma.achievement.findMany();
    const earnedKeys = new Set(earned.map((a) => a.key));
    const newAchievements: string[] = [];

    // Get data for checks
    const [completedDays, weeks, buildLogs, reviews] = await Promise.all([
      prisma.day.findMany({ where: { isComplete: true }, select: { completedAt: true, weekId: true } }),
      prisma.week.findMany({ include: { days: true } }),
      prisma.buildLogEntry.findMany(),
      prisma.reviewResponse.findMany(),
    ]);

    // first_day: complete 1 day
    if (!earnedKeys.has('first_day') && completedDays.length >= 1) {
      newAchievements.push('first_day');
    }

    // week_warrior: complete all 6 days in a week
    if (!earnedKeys.has('week_warrior')) {
      const hasFullWeek = weeks.some((w) => {
        const nonSkipped = w.days.filter((d) => !d.skipped);
        return nonSkipped.length > 0 && nonSkipped.every((d) => d.isComplete);
      });
      if (hasFullWeek) newAchievements.push('week_warrior');
    }

    // streak_7 and streak_30
    const completionDates = completedDays
      .map((d) => d.completedAt)
      .filter((d): d is Date => d !== null);
    const streak = calculateStreak(completionDates, new Date());

    if (!earnedKeys.has('streak_7') && streak >= 7) {
      newAchievements.push('streak_7');
    }
    if (!earnedKeys.has('streak_30') && streak >= 30) {
      newAchievements.push('streak_30');
    }

    // phase_1: complete Phase 1 (weeks 1-8 typically)
    if (!earnedKeys.has('phase_1')) {
      const phase1Weeks = weeks.filter((w) => w.phaseId === 1);
      if (phase1Weeks.length > 0 && phase1Weeks.every((w) => w.isComplete)) {
        newAchievements.push('phase_1');
      }
    }

    // reviewer: 4 reviews in a week
    if (!earnedKeys.has('reviewer')) {
      const reviewsByWeek = new Map<number, number>();
      for (const r of reviews) {
        reviewsByWeek.set(r.weekId, (reviewsByWeek.get(r.weekId) ?? 0) + 1);
      }
      const hasFullReview = Array.from(reviewsByWeek.values()).some((count) => count >= 4);
      if (hasFullReview) newAchievements.push('reviewer');
    }

    // builder_10: build log for 10 weeks
    if (!earnedKeys.has('builder_10') && buildLogs.length >= 10) {
      newAchievements.push('builder_10');
    }

    // cto_graduate: all 52 weeks complete
    if (!earnedKeys.has('cto_graduate')) {
      const allComplete = weeks.length === 52 && weeks.every((w) => w.isComplete);
      if (allComplete) newAchievements.push('cto_graduate');
    }

    // Award new achievements
    const awarded = [];
    for (const key of newAchievements) {
      const def = ACHIEVEMENTS.find((a) => a.key === key);
      if (def) {
        const created = await prisma.achievement.create({
          data: { key: def.key, name: def.name, icon: def.icon },
        });
        awarded.push(created);
      }
    }

    return NextResponse.json({ awarded, total: earned.length + awarded.length });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
