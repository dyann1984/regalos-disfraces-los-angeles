import { doc, getDoc, increment, setDoc } from "firebase/firestore";
import { firestoreDb, isFirebaseConfigured } from "@/lib/firebase";

export type StoreMetricEvent =
  | "catalog_click"
  | "whatsapp_click"
  | "share_click"
  | "qr_download";

export interface StorePublicMetrics {
  catalog_clicks: number;
  whatsapp_clicks: number;
  share_clicks: number;
  qr_downloads: number;
  updated_at?: string;
}

const FIELD_MAP: Record<StoreMetricEvent, keyof Omit<StorePublicMetrics, "updated_at">> = {
  catalog_click: "catalog_clicks",
  whatsapp_click: "whatsapp_clicks",
  share_click: "share_clicks",
  qr_download: "qr_downloads",
};

/**
 * Registra únicamente contadores agregados anónimos (sin IP, sin cookies, sin datos personales).
 * Falla de forma silenciosa para nunca bloquear la experiencia de compra.
 */
export function trackStoreEvent(event: StoreMetricEvent): void {
  if (!isFirebaseConfigured || !firestoreDb) return;
  const field = FIELD_MAP[event];
  if (!field) return;

  const ref = doc(firestoreDb, "store_metrics", "public_clicks");
  setDoc(
    ref,
    {
      [field]: increment(1),
      updated_at: new Date().toISOString(),
    },
    { merge: true }
  ).catch(() => {
    // Silencioso: nunca interrumpir la navegación si las reglas de métricas aún no están publicadas
  });
}

/**
 * Lectura exclusiva de administradora para mostrar los totales anónimos en /admin.
 */
export async function fetchStorePublicMetrics(): Promise<StorePublicMetrics> {
  const empty: StorePublicMetrics = {
    catalog_clicks: 0,
    whatsapp_clicks: 0,
    share_clicks: 0,
    qr_downloads: 0,
  };
  if (!isFirebaseConfigured || !firestoreDb) return empty;
  try {
    const snap = await getDoc(doc(firestoreDb, "store_metrics", "public_clicks"));
    if (!snap.exists()) return empty;
    const data = snap.data();
    return {
      catalog_clicks: Number(data?.catalog_clicks || 0),
      whatsapp_clicks: Number(data?.whatsapp_clicks || 0),
      share_clicks: Number(data?.share_clicks || 0),
      qr_downloads: Number(data?.qr_downloads || 0),
      updated_at: typeof data?.updated_at === "string" ? data.updated_at : undefined,
    };
  } catch {
    return empty;
  }
}
