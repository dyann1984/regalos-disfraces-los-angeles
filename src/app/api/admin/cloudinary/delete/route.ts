import { NextRequest, NextResponse } from "next/server";
import { requireFirebaseAdminRequest } from "@/lib/firebaseServerAuth";
import {
  CLOUDINARY_ROOT_FOLDER,
  extractCloudinaryPublicId,
  getCloudinaryServerConfig,
  signCloudinaryParams,
} from "@/lib/cloudinaryServer";

export const dynamic = "force-dynamic";

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
    const rawPublicId =
      typeof body?.publicId === "string" ? body.publicId.trim() : "";
    const rawImageUrl =
      typeof body?.imageUrl === "string" ? body.imageUrl.trim() : "";

    const publicId = rawPublicId || extractCloudinaryPublicId(rawImageUrl) || "";

    if (!publicId || !publicId.startsWith(`${CLOUDINARY_ROOT_FOLDER}/`)) {
      return NextResponse.json(
        {
          error: "Identificador de imagen de Cloudinary inválido o fuera de la carpeta de la tienda.",
          code: "INVALID_PUBLIC_ID",
        },
        { status: 400 }
      );
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const signature = signCloudinaryParams(
      {
        public_id: publicId,
        timestamp,
      },
      cloudinary.apiSecret
    );

    const formData = new FormData();
    formData.append("public_id", publicId);
    formData.append("api_key", cloudinary.apiKey);
    formData.append("timestamp", String(timestamp));
    formData.append("signature", signature);

    const destroyRes = await fetch(
      `https://api.cloudinary.com/v1_1/${encodeURIComponent(
        cloudinary.cloudName
      )}/image/destroy`,
      {
        method: "POST",
        body: formData,
      }
    );

    if (!destroyRes.ok) {
      const errText = await destroyRes.text();
      throw new Error(`Cloudinary destroy (${destroyRes.status}): ${errText.slice(0, 160)}`);
    }

    const destroyData = await destroyRes.json();

    return NextResponse.json({
      deleted: destroyData?.result === "ok" || destroyData?.result === "not found",
      publicId,
      result: destroyData?.result || "unknown",
    });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "No se pudo eliminar la imagen de Cloudinary.",
        code: "CLOUDINARY_DELETE_ERROR",
      },
      { status: 500 }
    );
  }
}
