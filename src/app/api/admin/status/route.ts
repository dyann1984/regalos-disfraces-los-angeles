import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const firebaseApiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "";
  const firebaseProjectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "";
  const firebaseStorageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "";

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY || "";
  const openaiKey = process.env.OPENAI_API_KEY || "";

  const cloudinaryCloudName =
    process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "";
  const cloudinaryApiKey = process.env.CLOUDINARY_API_KEY || "";
  const cloudinaryApiSecret = process.env.CLOUDINARY_API_SECRET || "";
  const cloudinaryConfigured = Boolean(
    cloudinaryCloudName && cloudinaryApiKey && cloudinaryApiSecret
  );

  const firebaseConfigured = Boolean(
    firebaseApiKey &&
      firebaseProjectId &&
      !firebaseProjectId.includes("tu-proyecto")
  );

  const firebaseStorageConfigured = Boolean(
    firebaseConfigured &&
      firebaseStorageBucket &&
      !firebaseStorageBucket.includes("tu-proyecto")
  );

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
  if (!firebaseConfigured && !supabaseConfigured) {
    if (!firebaseApiKey) missingVariables.push("NEXT_PUBLIC_FIREBASE_API_KEY");
    if (!firebaseProjectId) missingVariables.push("NEXT_PUBLIC_FIREBASE_PROJECT_ID");
  }
  if (!aiProvider) {
    missingVariables.push("GEMINI_API_KEY");
  }
  if (!cloudinaryCloudName) missingVariables.push("CLOUDINARY_CLOUD_NAME");
  if (!cloudinaryApiKey) missingVariables.push("CLOUDINARY_API_KEY");
  if (!cloudinaryApiSecret) missingVariables.push("CLOUDINARY_API_SECRET");

  return NextResponse.json({
    firebaseConfigured,
    firebaseStorageConfigured,
    cloudinaryConfigured,
    supabaseConfigured,
    aiConfigured: Boolean(aiProvider),
    aiProvider,
    missingVariables,
  });
}
