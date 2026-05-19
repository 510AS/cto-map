import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const createSchema = z.object({
  taskItemId: z.number().int().positive(),
  content: z.string().min(1, "Note content is required"),
  confidence: z.number().int().min(1).max(5).optional(),
});

const updateSchema = z.object({
  id: z.number().int().positive(),
  content: z.string().min(1).optional(),
  confidence: z.number().int().min(1).max(5).optional(),
});

// GET - fetch notes for a task item (with history)
export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const taskItemId = searchParams.get("taskItemId");

    if (!taskItemId) {
      return NextResponse.json({ error: "taskItemId is required" }, { status: 400 });
    }

    const notes = await prisma.understandingNote.findMany({
      where: { taskItemId: parseInt(taskItemId) },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(notes);
  } catch (error) {
    console.error("Understanding notes fetch error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// POST - create a new understanding note
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = createSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { taskItemId, content, confidence } = parsed.data;

    // Verify task item exists
    const taskItem = await prisma.taskItem.findUnique({
      where: { id: taskItemId },
    });

    if (!taskItem) {
      return NextResponse.json({ error: "Task item not found" }, { status: 404 });
    }

    const note = await prisma.understandingNote.create({
      data: {
        taskItemId,
        content,
        confidence: confidence || 3,
      },
    });

    return NextResponse.json(note, { status: 201 });
  } catch (error) {
    console.error("Understanding note create error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// PUT - update an existing note
export async function PUT(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = updateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { id, ...data } = parsed.data;

    const note = await prisma.understandingNote.update({
      where: { id },
      data,
    });

    return NextResponse.json(note);
  } catch (error) {
    console.error("Understanding note update error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
