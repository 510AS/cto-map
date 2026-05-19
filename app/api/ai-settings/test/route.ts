import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/ai-settings/test
 * Sends a simple "Hello" message to the configured AI provider to verify the API key works.
 */
export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const settings = await prisma.aiSettings.findFirst();
    if (!settings?.apiKey) {
      return NextResponse.json(
        { success: false, error: "No API key configured" },
        { status: 400 }
      );
    }

    const testPrompt = "Reply with exactly: OK";
    const startTime = Date.now();

    const response = await callProvider(
      settings.provider,
      settings.apiKey,
      settings.model,
      testPrompt
    );

    const latency = Date.now() - startTime;

    if (response.success) {
      return NextResponse.json({
        success: true,
        message: "Connection successful",
        provider: settings.provider,
        model: settings.model,
        latency: latency + "ms",
        response: response.text?.substring(0, 100),
      });
    } else {
      return NextResponse.json({
        success: false,
        error: response.error,
        provider: settings.provider,
        model: settings.model,
      }, { status: 400 });
    }
  } catch (error) {
    console.error("AI test error:", error);
    return NextResponse.json(
      { success: false, error: "Something went wrong" },
      { status: 500 }
    );
  }
}

interface ProviderResponse {
  success: boolean;
  text?: string;
  error?: string;
}

async function callProvider(
  provider: string,
  apiKey: string,
  model: string,
  prompt: string
): Promise<ProviderResponse> {
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
          max_tokens: 10,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        return { success: false, error: err.error?.message || `HTTP ${res.status}: ${res.statusText}` };
      }
      const data = await res.json();
      return { success: true, text: data.choices?.[0]?.message?.content };
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
          max_tokens: 10,
          messages: [{ role: "user", content: prompt }],
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        return { success: false, error: err.error?.message || `HTTP ${res.status}: ${res.statusText}` };
      }
      const data = await res.json();
      return { success: true, text: data.content?.[0]?.text };
    }

    if (provider === "google") {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { maxOutputTokens: 10 },
          }),
        }
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        return { success: false, error: err.error?.message || `HTTP ${res.status}: ${res.statusText}` };
      }
      const data = await res.json();
      return { success: true, text: data.candidates?.[0]?.content?.parts?.[0]?.text };
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
          max_tokens: 10,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        return { success: false, error: err.error?.message || `HTTP ${res.status}: ${res.statusText}` };
      }
      const data = await res.json();
      return { success: true, text: data.choices?.[0]?.message?.content };
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
            max_tokens: 10,
          }),
        }
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        return { success: false, error: err.error?.message || err.error || `HTTP ${res.status}: ${res.statusText}` };
      }
      const data = await res.json();
      return { success: true, text: data.choices?.[0]?.message?.content || JSON.stringify(data).substring(0, 100) };
    }

    if (provider === "custom") {
      // Custom provider uses OpenAI-compatible API format
      // The model field should contain the full endpoint URL or model name
      return { success: false, error: "Custom provider requires manual configuration. Use OpenRouter for custom models." };
    }

    return { success: false, error: "Unknown provider: " + provider };
  } catch (err: any) {
    return { success: false, error: err.message || "Network error" };
  }
}
