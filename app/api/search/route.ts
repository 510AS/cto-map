import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/search?q=term
 * Searches across day notes, week notes, build log content,
 * review responses, bookmark labels, and task item titles.
 * Returns results grouped by type with links.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q')?.trim();

    if (!q || q.length < 2) {
      return NextResponse.json(
        { error: 'Search query must be at least 2 characters' },
        { status: 400 }
      );
    }

    // SQLite uses LIKE for case-insensitive search with contains
    const searchTerm = `%${q}%`;

    const [days, weeks, buildLogs, reviews, bookmarks, taskItems] = await Promise.all([
      // Day notes
      prisma.day.findMany({
        where: { note: { contains: q } },
        select: { id: true, dayLabel: true, note: true, sortOrder: true, week: { select: { weekNumber: true } } },
        take: 20,
      }),
      // Week notes
      prisma.week.findMany({
        where: { note: { contains: q } },
        select: { id: true, weekNumber: true, title: true, note: true },
        take: 20,
      }),
      // Build log content
      prisma.buildLogEntry.findMany({
        where: { content: { contains: q } },
        select: { id: true, content: true, week: { select: { weekNumber: true, title: true } } },
        take: 20,
      }),
      // Review responses
      prisma.reviewResponse.findMany({
        where: { response: { contains: q } },
        select: { id: true, prompt: true, response: true, week: { select: { weekNumber: true, title: true } } },
        take: 20,
      }),
      // Bookmark labels
      prisma.bookmark.findMany({
        where: { label: { contains: q } },
        select: { id: true, url: true, label: true },
        take: 20,
      }),
      // Task item titles
      prisma.taskItem.findMany({
        where: { title: { contains: q } },
        select: { id: true, title: true, category: true, day: { select: { sortOrder: true, week: { select: { weekNumber: true } } } } },
        take: 20,
      }),
    ]);

    const results = {
      days: days.map((d) => ({
        id: d.id,
        label: d.dayLabel,
        snippet: d.note?.substring(0, 100) || '',
        link: `/week/${d.week.weekNumber}/day/${d.sortOrder}`,
      })),
      weeks: weeks.map((w) => ({
        id: w.id,
        label: `Week ${w.weekNumber}: ${w.title}`,
        snippet: w.note?.substring(0, 100) || '',
        link: `/week/${w.weekNumber}`,
      })),
      buildLogs: buildLogs.map((b) => ({
        id: b.id,
        label: `Build Log - Week ${b.week.weekNumber}`,
        snippet: b.content.substring(0, 100),
        link: `/week/${b.week.weekNumber}`,
      })),
      reviews: reviews.map((r) => ({
        id: r.id,
        label: `Review (${r.prompt}) - Week ${r.week.weekNumber}`,
        snippet: r.response.substring(0, 100),
        link: `/week/${r.week.weekNumber}`,
      })),
      bookmarks: bookmarks.map((b) => ({
        id: b.id,
        label: b.label || b.url,
        snippet: b.url,
        link: '/bookmarks',
      })),
      taskItems: taskItems.map((t) => ({
        id: t.id,
        label: t.title,
        snippet: `${t.category} task`,
        link: `/week/${t.day.week.weekNumber}/day/${t.day.sortOrder}`,
      })),
    };

    return NextResponse.json(results);
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
