import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY || "";
  const openaiKey = process.env.OPENAI_API_KEY || "";

  const supabaseConfigured = Boolean(
    supabaseUrl &&
      supabaseAnonKey &&
      supabaseUrl.startsWith("https://") &&
      !supabaseUrl.includes("tu-proyecto")
  );

  const aiProvider: "gemini" | "openai" | null = geminiKey
    ? "gemini"
    : openaiKey
      ? "openai"
      : null;

  const missingVariables: string[] = [];
  if (!supabaseConfigured) {
    if (!supabaseUrl) missingVariables.push("NEXT_PUBLIC_SUPABASE_URL");
    if (!supabaseAnonKey) missingVariables.push("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }
  if (!aiProvider) {
    missingVariables.push("GEMINI_API_KEY");
  }

  return NextResponse.json({
    supabaseConfigured,
    aiConfigured: Boolean(aiProvider),
    aiProvider,
    missingVariables,
  });
}
