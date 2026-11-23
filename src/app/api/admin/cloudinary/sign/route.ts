import { NextRequest, NextResponse } from "next/server";
import { requireFirebaseAdminRequest } from "@/lib/firebaseServerAuth";
import {
  CLOUDINARY_ROOT_FOLDER,
  getCloudinaryServerConfig,
  signCloudinaryParams,
} from "@/lib/cloudinaryServer";

export const dynamic = "force-dynamic";

const ALLOWED_FOLDERS = new Set(["products", "gallery", "categories", "banners"]);

export async function POST(req: NextRequest) {
  try {
    const authResult = await requireFirebaseAdminRequest(req);
    if ("errorResponse" in authResult) {
      return authResult.errorResponse;
    }

    const cloudinary = getCloudinaryServerConfig();
    if (!cloudinary) {
      return NextResponse.json(
        {
          error:
            "Cloudinary no está configurado en el servidor. Configura CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY y CLOUDINARY_API_SECRET.",
          code: "CLOUDINARY_NOT_CONFIGURED",
        },
        { status: 503 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const rawFolder = typeof body?.folder === "string" ? body.folder.trim() : "products";
    const safeFolder = ALLOWED_FOLDERS.has(rawFolder) ? rawFolder : "products";

    const timestamp = Math.floor(Date.now() / 1000);
    const folder = `${CLOUDINARY_ROOT_FOLDER}/${safeFolder}`;

    const signature = signCloudinaryParams(
      {
        folder,
        timestamp,
      },
      cloudinary.apiSecret
    );

    return NextResponse.json(
      {
        cloudName: cloudinary.cloudName,
        apiKey: cloudinary.apiKey,
        timestamp,
        folder,
        signature,
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "No se pudo firmar la subida segura a Cloudinary.",
        code: "CLOUDINARY_SIGN_ERROR",
      },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
