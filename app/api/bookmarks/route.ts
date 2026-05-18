import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const weekId = searchParams.get('weekId');
    const tagId = searchParams.get('tagId');

    const where: { weekId?: number; tagId?: number } = {};
    if (weekId) {
      where.weekId = Number(weekId);
    }
    if (tagId) {
      where.tagId = Number(tagId);
    }

    const bookmarks = await prisma.bookmark.findMany({
      where,
      include: {
        week: { select: { weekNumber: true, title: true } },
        tag: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(bookmarks);
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { url?: string; label?: string; weekId?: number; tagId?: number };
    const { url, label, weekId, tagId } = body;

    if (!url || (!url.startsWith('http://') && !url.startsWith('https://'))) {
      return NextResponse.json(
        { error: 'URL must begin with http:// or https://' },
        { status: 422 }
      );
    }

    const bookmark = await prisma.bookmark.create({
      data: {
        url,
        label: label || null,
        weekId: weekId ?? null,
        tagId: tagId ?? null,
      },
    });

    return NextResponse.json(bookmark, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json() as { id?: number };
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Bookmark id is required' },
        { status: 400 }
      );
    }

    await prisma.bookmark.delete({
      where: { id: Number(id) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
