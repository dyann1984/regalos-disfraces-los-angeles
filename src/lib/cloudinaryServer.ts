import crypto from "crypto";

export const CLOUDINARY_ROOT_FOLDER = "los-angeles-store";

export interface CloudinaryServerConfig {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
}

export function getCloudinaryServerConfig(): CloudinaryServerConfig | null {
  const cloudName =
    process.env.CLOUDINARY_CLOUD_NAME ||
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||
    "";
  const apiKey = process.env.CLOUDINARY_API_KEY || "";
  const apiSecret = process.env.CLOUDINARY_API_SECRET || "";

  if (!cloudName || !apiKey || !apiSecret) {
    return null;
  }

  return {
    cloudName: cloudName.trim(),
    apiKey: apiKey.trim(),
    apiSecret: apiSecret.trim(),
  };
}

export function signCloudinaryParams(
  params: Record<string, string | number>,
  apiSecret: string
): string {
  const sortedKeys = Object.keys(params)
    .filter((k) => params[k] !== undefined && params[k] !== null && params[k] !== "")
    .sort();

  const stringToSign = sortedKeys
    .map((key) => `${key}=${params[key]}`)
    .join("&");

  return crypto
    .createHash("sha1")
    .update(`${stringToSign}${apiSecret}`)
    .digest("hex");
}

export function extractCloudinaryPublicId(imageUrl: string): string | null {
  if (!imageUrl || !imageUrl.includes("res.cloudinary.com")) {
    return null;
  }
  try {
    const parsed = new URL(imageUrl);
    const marker = "/image/upload/";
    const idx = parsed.pathname.indexOf(marker);
    if (idx === -1) return null;

    let remainder = parsed.pathname.slice(idx + marker.length);
    // Quitar transformaciones opcionales y versión (ej. f_auto,q_auto/v1700000000/)
    const segments = remainder.split("/").filter(Boolean);
    const rootIndex = segments.indexOf(CLOUDINARY_ROOT_FOLDER);
    if (rootIndex === -1) return null;

    remainder = segments.slice(rootIndex).join("/");
    // Quitar extensión (.webp, .jpg, .png)
    const publicId = remainder.replace(/\.[^/.]+$/, "");
    return publicId.startsWith(`${CLOUDINARY_ROOT_FOLDER}/`) ? publicId : null;
  } catch {
    return null;
  }
}
