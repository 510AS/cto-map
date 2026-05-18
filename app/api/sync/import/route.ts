import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/sync/import
 * Imports JSON data, merging with existing.
 */
export async function POST(req: NextRequest) {
  try {
    const data = await req.json();

    if (!data || data.version === undefined) {
      return NextResponse.json({ error: 'Invalid import data' }, { status: 400 });
    }

    let imported = { weeks: 0, days: 0, reviews: 0, bookmarks: 0, achievements: 0 };

    // Import settings
    if (data.settings?.startDate) {
      await prisma.settings.upsert({
        where: { id: 1 },
        update: {
          startDate: new Date(data.settings.startDate),
          xp: data.settings.xp ?? 0,
        },
        create: {
          id: 1,
          startDate: new Date(data.settings.startDate),
          xp: data.settings.xp ?? 0,
        },
      });
    }

    // Import week completion states
    if (data.weeks && Array.isArray(data.weeks)) {
      for (const w of data.weeks) {
        try {
          await prisma.week.update({
            where: { weekNumber: w.weekNumber },
            data: {
              isComplete: w.isComplete ?? false,
              hoursLogged: w.hoursLogged ?? null,
              note: w.note ?? null,
            },
          });
          imported.weeks++;
        } catch { /* skip if week doesn't exist */ }
      }
    }

    // Import day completion states
    if (data.days && Array.isArray(data.days)) {
      for (const d of data.days) {
        try {
          await prisma.day.updateMany({
            where: { weekId: d.weekId, sortOrder: d.sortOrder },
            data: {
              isComplete: d.isComplete ?? false,
              learnComplete: d.learnComplete ?? false,
              buildComplete: d.buildComplete ?? false,
              skipped: d.skipped ?? false,
              confidence: d.confidence ?? null,
              completedAt: d.completedAt ? new Date(d.completedAt) : null,
              note: d.note ?? null,
              reflection: d.reflection ?? null,
            },
          });
          imported.days++;
        } catch { /* skip */ }
      }
    }

    // Import reviews
    if (data.reviews && Array.isArray(data.reviews)) {
      for (const r of data.reviews) {
        try {
          await prisma.reviewResponse.upsert({
            where: { weekId_prompt: { weekId: r.weekId, prompt: r.prompt } },
            update: { response: r.response },
            create: { weekId: r.weekId, prompt: r.prompt, response: r.response },
          });
          imported.reviews++;
        } catch { /* skip */ }
      }
    }

    // Import bookmarks
    if (data.bookmarks && Array.isArray(data.bookmarks)) {
      for (const b of data.bookmarks) {
        try {
          const existing = await prisma.bookmark.findFirst({ where: { url: b.url, weekId: b.weekId } });
          if (!existing) {
            await prisma.bookmark.create({
              data: { url: b.url, label: b.label ?? null, weekId: b.weekId ?? null, tagId: b.tagId ?? null },
            });
            imported.bookmarks++;
          }
        } catch { /* skip */ }
      }
    }

    // Import achievements
    if (data.achievements && Array.isArray(data.achievements)) {
      for (const a of data.achievements) {
        try {
          await prisma.achievement.upsert({
            where: { key: a.key },
            update: {},
            create: { key: a.key, name: a.name, icon: a.icon, earnedAt: a.earnedAt ? new Date(a.earnedAt) : new Date() },
          });
          imported.achievements++;
        } catch { /* skip */ }
      }
    }

    return NextResponse.json({ success: true, imported });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
