import { NextRequest, NextResponse } from "next/server";

export interface VerifiedFirebaseAdmin {
  uid: string;
  email: string;
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
  if (!idToken || !firebaseApiKey || !firebaseProjectId) {
    return null;
  }

  const lookupRes = await fetch(
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

  if (!lookupRes.ok) return null;
  const lookupData = await lookupRes.json();
  const account = lookupData?.users?.[0];
  if (!account?.localId) return null;

  const uid = String(account.localId);
  const email = String(account.email || "").trim().toLowerCase();

  const allowedEmails = (process.env.NEXT_PUBLIC_ADMIN_ALLOWED_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  if (allowedEmails.length > 0 && (!email || !allowedEmails.includes(email))) {
    return null;
  }

  const checkAdminDoc = async (docId: string): Promise<boolean> => {
    const url = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(
      firebaseProjectId
    )}/databases/(default)/documents/admin_users/${encodeURIComponent(docId)}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${idToken}` },
      cache: "no-store",
    });
    if (!res.ok) return false;
    const docData = await res.json();
    const activeField = docData?.fields?.active;
    if (activeField && activeField.booleanValue === false) {
      return false;
    }
    return true;
  };

  if (await checkAdminDoc(uid)) {
    return { uid, email };
  }

  if (email && (await checkAdminDoc(email))) {
    return { uid, email };
  }

  return null;
}

/**
 * Valida la cabecera Authorization: Bearer <idToken> contra Firebase Auth y admin_users.
 * Devuelve { admin } si es válido o { errorResponse } (401 / 403 / 503) en caso contrario.
 */
export async function requireFirebaseAdminRequest(
  req: NextRequest
): Promise<{ admin: VerifiedFirebaseAdmin } | { errorResponse: NextResponse }> {
  const firebaseApiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "";
  const firebaseProjectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "";

  if (!firebaseApiKey || !firebaseProjectId || firebaseProjectId.includes("tu-proyecto")) {
    return {
      errorResponse: NextResponse.json(
        {
          error: "Firebase Authentication no está configurado en el servidor.",
          code: "FIREBASE_NOT_CONFIGURED",
        },
        { status: 503 }
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
        { status: 401 }
      ),
    };
  }

  const verifiedAdmin = await verifyFirebaseAdminOnServer(
    token,
    firebaseApiKey,
    firebaseProjectId
  );

  if (!verifiedAdmin) {
    return {
      errorResponse: NextResponse.json(
        {
          error: "Acceso denegado: tu cuenta no tiene permisos de administradora.",
          code: "FORBIDDEN",
        },
        { status: 403 }
      ),
    };
  }

  return { admin: verifiedAdmin };
}
