import { NextRequest, NextResponse } from "next/server";

export interface VerifiedFirebaseAdmin {
  uid: string;
  email: string;
}

type AdminVerificationResult =
  | { status: "ok"; admin: VerifiedFirebaseAdmin }
  | { status: "invalid_token"; detail?: string }
  | { status: "forbidden" }
  | { status: "unavailable"; detail?: string };

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs = 12_000
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function verifyFirebaseAdminDetailed(
  idToken: string,
  firebaseApiKey: string,
  firebaseProjectId: string
): Promise<AdminVerificationResult> {
  if (!idToken || !firebaseApiKey || !firebaseProjectId) {
    return { status: "invalid_token" };
  }

  let lookupRes: Response;
  try {
    lookupRes = await fetchWithTimeout(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(
        firebaseApiKey
      )}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
        cache: "no-store",
      }
    );
  } catch (err) {
    return {
      status: "unavailable",
      detail: err instanceof Error ? err.message : "Network error",
    };
  }

  if (lookupRes.status >= 500 || lookupRes.status === 429) {
    return { status: "unavailable", detail: `Identity Toolkit HTTP ${lookupRes.status}` };
  }

  if (!lookupRes.ok) {
    const errBody = await lookupRes.json().catch(() => ({}));
    const msg = String(errBody?.error?.message || "INVALID_ID_TOKEN");
    return { status: "invalid_token", detail: msg };
  }

  const lookupData = await lookupRes.json().catch(() => null);
  const account = lookupData?.users?.[0];
  if (!account?.localId) {
    return { status: "invalid_token", detail: "USER_NOT_FOUND" };
  }

  const uid = String(account.localId);
  const email = String(account.email || "").trim().toLowerCase();

  const allowedEmails = (process.env.NEXT_PUBLIC_ADMIN_ALLOWED_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  if (allowedEmails.length > 0 && (!email || !allowedEmails.includes(email))) {
    return { status: "forbidden" };
  }

  const checkAdminDoc = async (
    docId: string
  ): Promise<"ok" | "denied" | "unavailable"> => {
    const url = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(
      firebaseProjectId
    )}/databases/(default)/documents/admin_users/${encodeURIComponent(docId)}`;

    let res: Response;
    try {
      res = await fetchWithTimeout(url, {
        headers: { Authorization: `Bearer ${idToken}` },
        cache: "no-store",
      });
    } catch {
      return "unavailable";
    }

    if (res.status >= 500 || res.status === 429) {
      return "unavailable";
    }
    if (!res.ok) return "denied";

    const docData = await res.json().catch(() => null);
    const activeField = docData?.fields?.active;
    if (activeField && activeField.booleanValue === false) {
      return "denied";
    }
    return "ok";
  };

  const uidCheck = await checkAdminDoc(uid);
  if (uidCheck === "ok") {
    return { status: "ok", admin: { uid, email } };
  }
  if (uidCheck === "unavailable") {
    return { status: "unavailable", detail: "Firestore temporalmente no disponible" };
  }

  if (email) {
    const emailCheck = await checkAdminDoc(email);
    if (emailCheck === "ok") {
      return { status: "ok", admin: { uid, email } };
    }
    if (emailCheck === "unavailable") {
      return { status: "unavailable", detail: "Firestore temporalmente no disponible" };
    }
  }

  return { status: "forbidden" };
}

/**
 * Verifica el ID Token de Firebase Auth en el servidor y comprueba que el usuario
 * esté autorizado como administrador en Cloud Firestore (`admin_users/{uid}` o `admin_users/{email}`)
 * y opcionalmente en `NEXT_PUBLIC_ADMIN_ALLOWED_EMAILS`.
 *
 * No requiere exponer llaves privadas del Firebase Admin SDK: valida el token contra
 * Identity Toolkit y consulta `admin_users` usando el propio Bearer token del usuario
 * para respetar `firestore.rules`.
 */
export async function verifyFirebaseAdminOnServer(
  idToken: string,
  firebaseApiKey: string,
  firebaseProjectId: string
): Promise<VerifiedFirebaseAdmin | null> {
  const result = await verifyFirebaseAdminDetailed(
    idToken,
    firebaseApiKey.trim(),
    firebaseProjectId.trim()
  );
  return result.status === "ok" ? result.admin : null;
}

/**
 * Valida la cabecera Authorization: Bearer <idToken> contra Firebase Auth y admin_users.
 * Devuelve { admin } si es válido o { errorResponse } (401 / 403 / 503) en caso contrario.
 */
export async function requireFirebaseAdminRequest(
  req: NextRequest
): Promise<{ admin: VerifiedFirebaseAdmin } | { errorResponse: NextResponse }> {
  const firebaseApiKey = (process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "").trim();
  const firebaseProjectId = (process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "").trim();

  if (!firebaseApiKey || !firebaseProjectId || firebaseProjectId.includes("tu-proyecto")) {
    return {
      errorResponse: NextResponse.json(
        {
          error: "Firebase Authentication no está configurado en el servidor.",
          code: "FIREBASE_NOT_CONFIGURED",
        },
        { status: 503, headers: { "Cache-Control": "no-store" } }
      ),
    };
  }

  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";

  if (!token) {
    return {
      errorResponse: NextResponse.json(
        {
          error: "No autorizado. Inicia sesión como administradora en /admin.",
          code: "UNAUTHORIZED",
        },
        { status: 401, headers: { "Cache-Control": "no-store" } }
      ),
    };
  }

  const verification = await verifyFirebaseAdminDetailed(
    token,
    firebaseApiKey,
    firebaseProjectId
  );

  if (verification.status === "invalid_token") {
    return {
      errorResponse: NextResponse.json(
        {
          error: "Tu sesión administrativa expiró. Vuelve a iniciar sesión e intenta nuevamente.",
          code: "TOKEN_EXPIRED",
        },
        { status: 401, headers: { "Cache-Control": "no-store" } }
      ),
    };
  }

  if (verification.status === "unavailable") {
    return {
      errorResponse: NextResponse.json(
        {
          error:
            "El servicio de autenticación está respondiendo lento en este momento. Intenta nuevamente en unos segundos.",
          code: "AUTH_SERVICE_UNAVAILABLE",
        },
        { status: 503, headers: { "Cache-Control": "no-store" } }
      ),
    };
  }

  if (verification.status !== "ok") {
    return {
      errorResponse: NextResponse.json(
        {
          error: "Acceso denegado: tu cuenta no tiene permisos de administradora.",
          code: "FORBIDDEN",
        },
        { status: 403, headers: { "Cache-Control": "no-store" } }
      ),
    };
  }

  return { admin: verification.admin };
}
