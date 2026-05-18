import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/sync/export
 * Exports ALL data as JSON for multi-device sync.
 */
export async function GET() {
  try {
    const [settings, weeks, days, taskItems, notes, reviews, bookmarks, buildLogs, achievements] = await Promise.all([
      prisma.settings.findFirst({ where: { id: 1 } }),
      prisma.week.findMany({ select: { weekNumber: true, isComplete: true, hoursLogged: true, note: true } }),
      prisma.day.findMany({
        select: {
          weekId: true, sortOrder: true, isComplete: true, learnComplete: true,
          buildComplete: true, skipped: true, confidence: true, completedAt: true,
          note: true, reflection: true,
        },
      }),
      prisma.taskItem.findMany({
        select: {
          dayId: true, title: true, category: true, isComplete: true, sortOrder: true,
          timeEstimate: true, note: true, resourceUrl: true, priority: true, actualMinutes: true,
        },
      }),
      prisma.day.findMany({ where: { note: { not: null } }, select: { id: true, note: true, weekId: true, sortOrder: true } }),
      prisma.reviewResponse.findMany({ select: { weekId: true, prompt: true, response: true } }),
      prisma.bookmark.findMany({ select: { url: true, label: true, weekId: true, tagId: true } }),
      prisma.buildLogEntry.findMany({ select: { weekId: true, content: true } }),
      prisma.achievement.findMany({ select: { key: true, name: true, icon: true, earnedAt: true } }),
    ]);

    const exportData = {
      version: 2,
      exportedAt: new Date().toISOString(),
      settings: settings ? { startDate: settings.startDate, xp: settings.xp } : null,
      weeks,
      days,
      taskItems,
      reviews,
      bookmarks,
      buildLogs,
      achievements,
    };

    return NextResponse.json(exportData);
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
