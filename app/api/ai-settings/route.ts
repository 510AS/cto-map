import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const updateSchema = z.object({
  provider: z.enum(["openai", "anthropic", "google"]).optional(),
  apiKey: z.string().optional(),
  model: z.string().min(1).optional(),
});

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let settings = await prisma.aiSettings.findFirst();
    if (!settings) {
      settings = await prisma.aiSettings.create({
        data: { provider: "openai", model: "gpt-4o-mini" },
      });
    }

    return NextResponse.json({
      provider: settings.provider,
      model: settings.model,
      hasApiKey: !!settings.apiKey,
    });
  } catch (error) {
    console.error("AI settings fetch error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

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

    const settings = await prisma.aiSettings.upsert({
      where: { id: 1 },
      update: parsed.data,
      create: {
        provider: parsed.data.provider || "openai",
        model: parsed.data.model || "gpt-4o-mini",
        apiKey: parsed.data.apiKey,
      },
    });

    return NextResponse.json({
      provider: settings.provider,
      model: settings.model,
      hasApiKey: !!settings.apiKey,
    });
  } catch (error) {
    console.error("AI settings update error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
