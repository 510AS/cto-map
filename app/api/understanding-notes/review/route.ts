import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";

const schema = z.object({
  noteId: z.number().int().positive(),
});

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limit: 10 reviews per user per minute
    const { success } = rateLimit(`ai-review:${session.user.id}`, { limit: 10, windowSeconds: 60 });
    if (!success) {
      return NextResponse.json(
        { error: "Too many review requests. Please wait a moment." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "noteId is required" }, { status: 400 });
    }

    const { noteId } = parsed.data;

    // Fetch the note with its task item context
    const note = await prisma.understandingNote.findUnique({
      where: { id: noteId },
      include: {
        taskItem: {
          include: {
            day: {
              select: { dayLabel: true, learnTask: true, buildTask: true },
            },
          },
        },
      },
    });

    if (!note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    // Fetch AI settings
    const aiSettings = await prisma.aiSettings.findFirst();
    if (!aiSettings?.apiKey) {
      return NextResponse.json(
        { error: "AI is not configured. Please add your API key in Settings." },
        { status: 400 }
      );
    }

    // Build the prompt
    const taskContext = note.taskItem.category === "learn"
      ? note.taskItem.day.learnTask
      : note.taskItem.day.buildTask;

    const prompt = `You are an expert technical educator evaluating a student's understanding of a topic.

TOPIC/TASK: "${note.taskItem.title}"
CONTEXT: ${taskContext}
DAY: ${note.taskItem.day.dayLabel}

STUDENT'S EXPLANATION:
"${note.content}"

STUDENT'S SELF-CONFIDENCE: ${note.confidence}/5

Please evaluate their understanding and respond in this exact JSON format:
{
  "score": <number 0-100 representing understanding percentage>,
  "feedback": "<what they got right and demonstrated good understanding of>",
  "gaps": "<what's missing, inaccurate, or could be deeper>",
  "suggestions": "<2-3 specific questions they should explore to deepen understanding>"
}

Be encouraging but honest. A score of 100 means perfect, comprehensive understanding. A score of 50 means they have the basics but are missing important nuances.`;

    // Call the AI provider
    const aiResponse = await callAiProvider(aiSettings.provider, aiSettings.apiKey, aiSettings.model, prompt);

    if (!aiResponse) {
      return NextResponse.json(
        { error: "AI review failed. Please check your API key and try again." },
        { status: 500 }
      );
    }

    // Parse AI response
    let parsed_response;
    try {
      // Extract JSON from the response (handle markdown code blocks)
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON found");
      parsed_response = JSON.parse(jsonMatch[0]);
    } catch {
      return NextResponse.json(
        { error: "AI returned an invalid response. Please try again." },
        { status: 500 }
      );
    }

    // Update the note with AI feedback
    const updatedNote = await prisma.understandingNote.update({
      where: { id: noteId },
      data: {
        aiScore: Math.min(100, Math.max(0, parsed_response.score)),
        aiFeedback: `${parsed_response.feedback}\n\n${parsed_response.gaps}`,
        aiSuggestions: parsed_response.suggestions,
        reviewedAt: new Date(),
      },
    });

    return NextResponse.json(updatedNote);
  } catch (error) {
    console.error("AI review error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

async function callAiProvider(
  provider: string,
  apiKey: string,
  model: string,
  prompt: string
): Promise<string | null> {
  try {
    if (provider === "openai") {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: prompt }],
          temperature: 0.3,
          max_tokens: 1000,
        }),
      });

      if (!res.ok) return null;
      const data = await res.json();
      return data.choices?.[0]?.message?.content || null;
    }

    if (provider === "anthropic") {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model,
          max_tokens: 1000,
          messages: [{ role: "user", content: prompt }],
        }),
      });

      if (!res.ok) return null;
      const data = await res.json();
      return data.content?.[0]?.text || null;
    }

    if (provider === "google") {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
          }),
        }
      );

      if (!res.ok) return null;
      const data = await res.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || null;
    }

    return null;
  } catch {
    return null;
  }
}

    if (provider === "google") {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
          }),
        }
      );

      if (!res.ok) return null;
      const data = await res.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || null;
    }

    if (provider === "openrouter") {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: prompt }],
          temperature: 0.3,
          max_tokens: 1000,
        }),
      });

      if (!res.ok) return null;
      const data = await res.json();
      return data.choices?.[0]?.message?.content || null;
    }

    if (provider === "huggingface") {
      const res = await fetch(
        `https://api-inference.huggingface.co/models/${model}/v1/chat/completions`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model,
            messages: [{ role: "user", content: prompt }],
            max_tokens: 1000,
          }),
        }
      );

      if (!res.ok) return null;
      const data = await res.json();
      return data.choices?.[0]?.message?.content || null;
    }

    return null;
  } catch {
    return null;
  }
}
