import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/ai-settings/models
 * Fetches available models from the configured AI provider using the stored API key.
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const settings = await prisma.aiSettings.findFirst();
    if (!settings?.apiKey) {
      return NextResponse.json(
        { error: "No API key configured", models: [] },
        { status: 400 }
      );
    }

    const models = await fetchModels(settings.provider, settings.apiKey);

    return NextResponse.json({ models, provider: settings.provider });
  } catch (error) {
    console.error("Fetch models error:", error);
    return NextResponse.json({ error: "Something went wrong", models: [] }, { status: 500 });
  }
}

async function fetchModels(provider: string, apiKey: string): Promise<string[]> {
  try {
    if (provider === "openai") {
      const res = await fetch("https://api.openai.com/v1/models", {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      if (!res.ok) return [];
      const data = await res.json();
      // Filter to chat models only
      const chatModels = (data.data || [])
        .map((m: any) => m.id as string)
        .filter((id: string) =>
          id.includes("gpt") || id.includes("o1") || id.includes("o3") || id.includes("chatgpt")
        )
        .sort();
      return chatModels;
    }

    if (provider === "anthropic") {
      // Anthropic doesn't have a public models list endpoint
      // Return known models
      return [
        "claude-sonnet-4-20250514",
        "claude-3-5-haiku-20241022",
        "claude-3-opus-20240229",
        "claude-3-5-sonnet-20241022",
        "claude-3-haiku-20240307",
      ];
    }

    if (provider === "google") {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
      );
      if (!res.ok) return [];
      const data = await res.json();
      const models = (data.models || [])
        .map((m: any) => m.name?.replace("models/", "") as string)
        .filter((name: string) => name && (name.includes("gemini") || name.includes("flash")))
        .sort();
      return models;
    }

    if (provider === "openrouter") {
      const res = await fetch("https://openrouter.ai/api/v1/models", {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      if (!res.ok) return [];
      const data = await res.json();
      const models = (data.data || [])
        .map((m: any) => m.id as string)
        .slice(0, 50) // Limit to top 50
        .sort();
      return models;
    }

    if (provider === "huggingface") {
      // Hugging Face doesn't have a simple "list my available models" endpoint
      // Return popular inference models
      return [
        "meta-llama/Llama-3.1-8B-Instruct",
        "meta-llama/Llama-3.1-70B-Instruct",
        "mistralai/Mistral-7B-Instruct-v0.3",
        "mistralai/Mixtral-8x7B-Instruct-v0.1",
        "microsoft/Phi-3-mini-4k-instruct",
        "google/gemma-2-9b-it",
        "Qwen/Qwen2.5-72B-Instruct",
      ];
    }

    return [];
  } catch {
    return [];
  }
}
