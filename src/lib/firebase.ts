// ============================================================================
// FIREBASE DE GOOGLE (AUTH + CLOUD FIRESTORE + CLOUD STORAGE)
// Proyecto: REGALOS, DISFRACES Y MÁS — LOS ÁNGELES
// ============================================================================

import { getApp, getApps, initializeApp, FirebaseApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  Auth,
  User,
} from "firebase/auth";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  Firestore,
} from "firebase/firestore";
import { getDownloadURL, getStorage, ref, uploadBytes, FirebaseStorage } from "firebase/storage";
import {
  Category,
  CustomerOrder,
  Product,
  StoreBanner,
  StoreGalleryPhoto,
} from "@/types/store";
import {
  INITIAL_BANNERS,
  INITIAL_CATEGORIES,
  INITIAL_STORE_GALLERY,
} from "@/data/mockCatalog";
import {
  ALLOWED_IMAGE_TYPES,
  MAX_IMAGE_SIZE_BYTES,
  mapBannerToRow,
  mapCategoryToRow,
  mapOrderToRow,
  mapProductToRow,
  mapRowToBanner,
  mapRowToCategory,
  mapRowToGalleryPhoto,
  mapRowToOrder,
  mapRowToProduct,
  STORAGE_BUCKET,
  validateImageFile,
} from "@/lib/supabase";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
};

/**
 * Verifica si las variables públicas de Firebase están configuradas.
 * No utiliza claves fijas ni sesiones simuladas.
 */
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
    firebaseConfig.projectId &&
    !firebaseConfig.projectId.includes("tu-proyecto")
);

export const isFirebaseStorageConfigured = Boolean(
  isFirebaseConfigured &&
    firebaseConfig.storageBucket &&
    !firebaseConfig.storageBucket.includes("tu-proyecto")
);

let firebaseApp: FirebaseApp | null = null;
let firebaseAuth: Auth | null = null;
let firestoreDb: Firestore | null = null;
let firebaseStorage: FirebaseStorage | null = null;

if (isFirebaseConfigured) {
  firebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  firebaseAuth = getAuth(firebaseApp);
  firestoreDb = getFirestore(firebaseApp);
  if (isFirebaseStorageConfigured) {
    firebaseStorage = getStorage(firebaseApp);
  }
}

export { firebaseApp, firebaseAuth, firestoreDb, firebaseStorage };

/**
 * Correos autorizados opcionales definidos en variables de entorno (separados por coma)
 * como capa adicional a la colección `admin_users` en Cloud Firestore.
 */
function getAllowedAdminEmailsFromEnv(): string[] {
  const raw = process.env.NEXT_PUBLIC_ADMIN_ALLOWED_EMAILS || "";
  return raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * Verifica estrictamente que el usuario autenticado en Firebase Auth tenga autorización
 * exclusiva de administradora:
 * 1. Verifica en Cloud Firestore `admin_users/{uid}` o `admin_users/{email_lower}`.
 * 2. Si se definió `NEXT_PUBLIC_ADMIN_ALLOWED_EMAILS`, exige además que el correo coincida.
 */
export async function verifyFirebaseAdmin(user: User | null): Promise<boolean> {
  if (!user || !firestoreDb) return false;

  const emailLower = (user.email || "").trim().toLowerCase();
  const envAllowedEmails = getAllowedAdminEmailsFromEnv();

  // Si la propietaria restringió explícitamente por correo en variables de entorno, validar primero
  if (envAllowedEmails.length > 0 && (!emailLower || !envAllowedEmails.includes(emailLower))) {
    return false;
  }

  try {
    // 1. Buscar documento por UID en admin_users/{uid}
    const uidSnap = await getDoc(doc(firestoreDb, "admin_users", user.uid));
    if (uidSnap.exists()) {
      const data = uidSnap.data();
      if (data?.role === "owner" || data?.role === "admin" || data?.authorized !== false) {
        return true;
      }
    }

    // 2. Buscar documento por correo en minúsculas en admin_users/{email}
    if (emailLower) {
      const emailSnap = await getDoc(doc(firestoreDb, "admin_users", emailLower));
      if (emailSnap.exists()) {
        const data = emailSnap.data();
        if (data?.role === "owner" || data?.role === "admin" || data?.authorized !== false) {
          return true;
        }
      }
    }
  } catch {
    // Si las reglas de seguridad de Firestore deniegan la lectura o aún no existe el documento:
    // permitir únicamente si el correo figura explícitamente en NEXT_PUBLIC_ADMIN_ALLOWED_EMAILS
    if (envAllowedEmails.length > 0 && emailLower && envAllowedEmails.includes(emailLower)) {
      return true;
    }
    return false;
  }

  // Respaldo si el correo está autorizado explícitamente en NEXT_PUBLIC_ADMIN_ALLOWED_EMAILS
  if (envAllowedEmails.length > 0 && emailLower && envAllowedEmails.includes(emailLower)) {
    return true;
  }

  return false;
}

/**
 * Inicio de sesión con Correo y Contraseña en Firebase Authentication.
 */
export async function signInAdminWithEmail(email: string, password: string): Promise<User> {
  if (!firebaseAuth) {
    throw new Error("Panel administrativo temporalmente no disponible.");
  }
  const credential = await signInWithEmailAndPassword(firebaseAuth, email.trim(), password);
  const authorized = await verifyFirebaseAdmin(credential.user);
  if (!authorized) {
    await signOut(firebaseAuth);
    throw new Error("Acceso denegado: esta cuenta no tiene autorización administrativa.");
  }
  return credential.user;
}

/**
 * Inicio de sesión con cuenta de Google de la propietaria en Firebase Authentication.
 */
export async function signInAdminWithGoogle(): Promise<User> {
  if (!firebaseAuth) {
    throw new Error("Panel administrativo temporalmente no disponible.");
  }
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  const credential = await signInWithPopup(firebaseAuth, provider);
  const authorized = await verifyFirebaseAdmin(credential.user);
  if (!authorized) {
    await signOut(firebaseAuth);
    throw new Error("Acceso denegado: esta cuenta de Google no está autorizada como administradora.");
  }
  return credential.user;
}

export async function signOutFirebaseAdmin(): Promise<void> {
  if (firebaseAuth) {
    await signOut(firebaseAuth);
  }
}

async function fetchWithClientTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function waitMs(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isAbortError(err: unknown): boolean {
  return (
    err instanceof Error &&
    (err.name === "AbortError" || err.message.toLowerCase().includes("aborted"))
  );
}

function isTransientNetworkError(err: unknown): boolean {
  if (isAbortError(err)) return true;
  if (!(err instanceof Error)) return false;
  const msg = err.message.toLowerCase();
  return (
    err.name === "TypeError" ||
    msg.includes("failed to fetch") ||
    msg.includes("networkerror") ||
    msg.includes("load failed") ||
    msg.includes("network request failed")
  );
}

function isRetryableHttpStatus(status: number): boolean {
  return status === 408 || status === 429 || (status >= 500 && status <= 599);
}

function mapUploadHttpError(status: number, serverMessage?: string): string {
  if (status === 401) {
    return "Tu sesión administrativa expiró. Vuelve a iniciar sesión en /admin e intenta nuevamente.";
  }
  if (status === 403) {
    return (
      serverMessage ||
      "Acceso denegado: tu cuenta no tiene permisos de administradora para subir fotografías."
    );
  }
  if (status === 413) {
    return "La fotografía es demasiado pesada para el servidor (límite 10 MB). Toma una foto más ligera e intenta de nuevo.";
  }
  if (status === 429) {
    return "Demasiados intentos de subida seguidos. Espera unos segundos e intenta nuevamente.";
  }
  if (status >= 500) {
    return (
      serverMessage ||
      "El servicio de imágenes presentó un error temporal. Intenta nuevamente en unos segundos."
    );
  }
  return serverMessage || `No se pudo subir la fotografía (error HTTP ${status}).`;
}

interface CloudinarySignPayload {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  folder: string;
  signature: string;
}

async function requestCloudinarySignature(
  folder: "products" | "gallery" | "categories" | "banners"
): Promise<CloudinarySignPayload> {
  const user = firebaseAuth?.currentUser;
  if (!user) {
    throw new Error("Debes iniciar sesión como administradora para subir fotografías.");
  }

  let forceRefresh = false;
  const maxAttempts = 3;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    let idToken: string;
    try {
      idToken = await user.getIdToken(forceRefresh);
    } catch {
      throw new Error(
        "No se pudo renovar tu sesión administrativa. Verifica tu conexión o inicia sesión nuevamente."
      );
    }

    if (!idToken) {
      throw new Error("Debes iniciar sesión como administradora para subir fotografías.");
    }

    try {
      const signRes = await fetchWithClientTimeout(
        "/api/admin/cloudinary/sign",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({ folder }),
        },
        15_000
      );

      const signData = await signRes.json().catch(() => ({}));

      // Si el token expiró (401), forzar renovación una vez y reintentar de inmediato
      if (signRes.status === 401 && !forceRefresh) {
        forceRefresh = true;
        continue;
      }

      if (!signRes.ok) {
        if (isRetryableHttpStatus(signRes.status) && attempt < maxAttempts) {
          await waitMs(700 * attempt);
          continue;
        }
        throw new Error(mapUploadHttpError(signRes.status, signData?.error));
      }

      if (
        !signData?.cloudName ||
        !signData?.apiKey ||
        !signData?.signature ||
        !signData?.folder
      ) {
        throw new Error("El servidor devolvió una firma de subida incompleta.");
      }

      return {
        cloudName: String(signData.cloudName),
        apiKey: String(signData.apiKey),
        timestamp: Number(signData.timestamp),
        folder: String(signData.folder),
        signature: String(signData.signature),
      };
    } catch (err) {
      if (isTransientNetworkError(err) && attempt < maxAttempts) {
        await waitMs(800 * attempt);
        continue;
      }
      if (isAbortError(err)) {
        throw new Error(
          "La autorización de subida tardó demasiado por conexión lenta. Verifica tu internet e intenta nuevamente."
        );
      }
      if (isTransientNetworkError(err)) {
        throw new Error(
          "Sin conexión o se perdió la señal al autorizar la subida. Verifica tu red e intenta nuevamente."
        );
      }
      throw err;
    }
  }

  throw new Error("No se pudo autorizar la subida segura a Cloudinary.");
}

/**
 * Sube una fotografía tomada desde el celular o galería usando firma segura en servidor:
 * 1. Prioriza Cloudinary mediante firma SHA-1 en `/api/admin/cloudinary/sign`
 *    (exige Firebase ID Token + autorización en `admin_users`, sin presets públicos).
 * 2. Incluye renovación automática de token expirado (401), tiempos de espera seguros
 *    y reintentos automáticos ante fallos transitorios de red móvil (429 / 5xx / timeout).
 * 3. Como respaldo explícito (`NEXT_PUBLIC_STORAGE_MODE=firebase_storage`), usa Firebase Storage.
 * No almacena imágenes base64 (`firestore_inline`) en documentos nuevos de producción.
 */
export async function uploadImageToFirebase(
  file: File,
  folder: "products" | "gallery" | "categories" | "banners"
): Promise<string> {
  const validationError = validateImageFile(file);
  if (validationError) {
    throw new Error(validationError);
  }

  const storageMode = (process.env.NEXT_PUBLIC_STORAGE_MODE || "cloudinary").toLowerCase();

  if (storageMode !== "firebase_storage") {
    const signData = await requestCloudinarySignature(folder);
    const maxUploadAttempts = 3;

    for (let attempt = 1; attempt <= maxUploadAttempts; attempt++) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("api_key", signData.apiKey);
      formData.append("timestamp", String(signData.timestamp));
      formData.append("folder", signData.folder);
      formData.append("signature", signData.signature);

      try {
        const uploadRes = await fetchWithClientTimeout(
          `https://api.cloudinary.com/v1_1/${encodeURIComponent(
            signData.cloudName
          )}/image/upload`,
          {
            method: "POST",
            body: formData,
          },
          45_000
        );

        if (!uploadRes.ok) {
          const errJson = await uploadRes.json().catch(() => ({}));
          const cloudMsg =
            typeof errJson?.error?.message === "string"
              ? errJson.error.message
              : undefined;

          if (isRetryableHttpStatus(uploadRes.status) && attempt < maxUploadAttempts) {
            await waitMs(900 * attempt);
            continue;
          }

          if (
            uploadRes.status === 400 &&
            cloudMsg &&
            cloudMsg.toLowerCase().includes("file size too large")
          ) {
            throw new Error(
              "La fotografía supera el tamaño máximo permitido por Cloudinary (10 MB). Toma una foto más ligera."
            );
          }

          throw new Error(mapUploadHttpError(uploadRes.status, cloudMsg));
        }

        const uploaded = await uploadRes.json().catch(() => ({}));
        const secureUrl = String(uploaded.secure_url || "");
        if (!secureUrl || !secureUrl.startsWith("https://")) {
          throw new Error("Cloudinary no devolvió una URL válida para la fotografía.");
        }

        // Optimización automática de entrega (formato y calidad adaptativos + orientación EXIF)
        return secureUrl.replace("/image/upload/", "/image/upload/f_auto,q_auto/");
      } catch (err) {
        if (isTransientNetworkError(err) && attempt < maxUploadAttempts) {
          await waitMs(1000 * attempt);
          continue;
        }
        if (isAbortError(err)) {
          throw new Error(
            "La subida de la fotografía tardó demasiado por conexión lenta. Verifica tu señal e intenta nuevamente."
          );
        }
        if (isTransientNetworkError(err)) {
          throw new Error(
            "Se perdió la conexión al subir la fotografía a Cloudinary. Verifica tu internet e intenta nuevamente."
          );
        }
        throw err;
      }
    }

    throw new Error("No se pudo subir la fotografía a Cloudinary después de varios intentos.");
  }

  // Respaldo explícito: Firebase Cloud Storage (`store-media/{folder}/...`)
  if (!firebaseStorage) {
    throw new Error(
      "Firebase Cloud Storage no está habilitado. Configura Cloudinary en las variables de entorno del servidor."
    );
  }

  const ext = file.name.split(".").pop()?.toLowerCase() || "webp";
  const safeBase = file.name
    .replace(/\.[^/.]+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .slice(0, 40);
  const filePath = `${STORAGE_BUCKET}/${folder}/${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 7)}-${safeBase}.${ext}`;

  const storageRef = ref(firebaseStorage, filePath);
  await uploadBytes(storageRef, file, {
    contentType: file.type || "image/webp",
    cacheControl: "public,max-age=31536000",
  });
  return await getDownloadURL(storageRef);
}

/**
 * Elimina de Cloudinary una fotografía perteneciente a la carpeta de la tienda,
 * verificando en servidor el Firebase ID Token y el rol de administradora.
 */
export async function deleteImageFromCloudinary(imageUrl: string): Promise<void> {
  if (!imageUrl || !imageUrl.includes("res.cloudinary.com")) {
    return;
  }
  const user = firebaseAuth?.currentUser;
  if (!user) return;

  let idToken = await user.getIdToken().catch(() => "");
  if (!idToken) return;

  const doDelete = (token: string) =>
    fetchWithClientTimeout(
      "/api/admin/cloudinary/delete",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ imageUrl }),
      },
      15_000
    );

  const res = await doDelete(idToken);
  if (res.status === 401) {
    idToken = await user.getIdToken(true).catch(() => "");
    if (idToken) {
      await doDelete(idToken);
    }
  }
}

/**
 * Inicializa las 6 categorías oficiales, banners y galería en Cloud Firestore si las colecciones están vacías.
 */
export async function ensureInitialFirebaseCatalogSeeded(): Promise<void> {
  if (!firestoreDb) return;
  const db = firestoreDb;

  try {
    const [catSnap, galSnap, banSnap] = await Promise.all([
      getDocs(collection(db, "categories")),
      getDocs(collection(db, "store_gallery")),
      getDocs(collection(db, "store_banners")),
    ]);

    const batch = writeBatch(db);
    let hasWrites = false;

    if (catSnap.empty) {
      for (const c of INITIAL_CATEGORIES) {
        batch.set(doc(db, "categories", c.slug), mapCategoryToRow(c));
        hasWrites = true;
      }
    }

    if (galSnap.empty) {
      INITIAL_STORE_GALLERY.forEach((g, idx) => {
        batch.set(doc(db, "store_gallery", g.id), {
          id: g.id,
          title: g.title,
          caption: g.caption,
          image_url: g.image,
          display_order: idx + 1,
          updated_at: new Date().toISOString(),
        });
        hasWrites = true;
      });
    }

    if (banSnap.empty) {
      for (const b of INITIAL_BANNERS) {
        batch.set(doc(db, "store_banners", b.id), mapBannerToRow(b));
        hasWrites = true;
      }
    }

    if (hasWrites) {
      await batch.commit();
    }
  } catch {
    // Ignorar silenciosamente si el usuario aún no tiene permisos de escritura
  }
}

/**
 * Consulta categorías, productos, galería, banners y (opcionalmente) pedidos desde Cloud Firestore.
 */
export async function fetchStoreDataFromFirestore(includeAdminData = false): Promise<{
  categories: Category[];
  products: Product[];
  storeGallery: StoreGalleryPhoto[];
  banners: StoreBanner[];
  orders: CustomerOrder[];
}> {
  if (!firestoreDb) {
    throw new Error("Firestore no está configurado.");
  }

  const categoriesQuery = includeAdminData
    ? query(collection(firestoreDb, "categories"), orderBy("display_order", "asc"))
    : query(collection(firestoreDb, "categories"), where("active", "==", true));

  const productsQuery = includeAdminData
    ? collection(firestoreDb, "products")
    : query(collection(firestoreDb, "products"), where("active", "==", true));

  const bannersQuery = includeAdminData
    ? query(collection(firestoreDb, "store_banners"), orderBy("display_order", "asc"))
    : query(collection(firestoreDb, "store_banners"), where("active", "==", true));

  const [catRes, prodRes, galRes, banRes] = await Promise.allSettled([
    getDocs(categoriesQuery),
    getDocs(productsQuery),
    getDocs(query(collection(firestoreDb, "store_gallery"), orderBy("display_order", "asc"))),
    getDocs(bannersQuery),
  ]);

  if (prodRes.status === "rejected") {
    console.error("[Firestore] Error leyendo products:", prodRes.reason);
    throw prodRes.reason;
  }
  if (catRes.status === "rejected") {
    console.error("[Firestore] Error leyendo categories (colección auxiliar):", catRes.reason);
  }
  if (galRes.status === "rejected") {
    console.error("[Firestore] Error leyendo store_gallery (colección auxiliar):", galRes.reason);
  }
  if (banRes.status === "rejected") {
    console.error("[Firestore] Error leyendo store_banners (colección auxiliar):", banRes.reason);
  }

  const categories =
    catRes.status === "fulfilled"
      ? catRes.value.docs
          .map((d) => mapRowToCategory({ id: d.id, ...d.data() } as Record<string, unknown>))
          .sort((a, b) => a.order - b.order)
      : [];

  const productsRaw = prodRes.value.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  })) as Record<string, unknown>[];

  productsRaw.sort((a, b) =>
    String(b.created_at || b.updated_at || "").localeCompare(
      String(a.created_at || a.updated_at || "")
    )
  );

  const products = productsRaw.map(mapRowToProduct);

  const storeGallery =
    galRes.status === "fulfilled"
      ? galRes.value.docs.map((d) =>
          mapRowToGalleryPhoto({ id: d.id, ...d.data() } as Record<string, unknown>)
        )
      : [];

  const banners =
    banRes.status === "fulfilled"
      ? banRes.value.docs
          .map((d) => mapRowToBanner({ id: d.id, ...d.data() } as Record<string, unknown>))
          .sort((a, b) => a.order - b.order)
      : [];

  let orders: CustomerOrder[] = [];
  if (includeAdminData) {
    try {
      const ordSnap = await getDocs(collection(firestoreDb, "orders"));
      const ordersRaw = ordSnap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as Record<string, unknown>[];
      ordersRaw.sort((a, b) =>
        String(b.created_at || "").localeCompare(String(a.created_at || ""))
      );
      orders = ordersRaw.map(mapRowToOrder);
    } catch (err) {
      console.error("[Firestore] Error leyendo orders:", err);
    }
  }

  return { categories, products, storeGallery, banners, orders };
}

export async function upsertProductInFirestore(product: Product): Promise<void> {
  if (!firestoreDb) throw new Error("Cloud Firestore no está configurado.");
  const row = mapProductToRow({ ...product, isDemo: false });
  const refDoc = doc(firestoreDb, "products", product.id);
  const existing = await getDoc(refDoc).catch(() => null);
  const createdAt =
    existing && existing.exists() && typeof existing.data()?.created_at === "string"
      ? String(existing.data()?.created_at)
      : new Date().toISOString();

  await setDoc(
    refDoc,
    {
      ...row,
      is_demo: false,
      created_at: createdAt,
    },
    { merge: true }
  );
}

export async function updateProductFieldsInFirestore(
  productId: string,
  fields: Partial<{
    price: number | null;
    stock: number | null;
    active: boolean;
    is_featured: boolean;
  }>
): Promise<void> {
  if (!firestoreDb) throw new Error("Cloud Firestore no está configurado.");
  await updateDoc(doc(firestoreDb, "products", productId), {
    ...fields,
    is_demo: false,
    updated_at: new Date().toISOString(),
  });
}

export async function deleteProductFromFirestore(productId: string): Promise<void> {
  if (!firestoreDb) throw new Error("Cloud Firestore no está configurado.");
  await deleteDoc(doc(firestoreDb, "products", productId));
}

export async function upsertCategoryInFirestore(category: Category): Promise<void> {
  if (!firestoreDb) throw new Error("Cloud Firestore no está configurado.");
  await setDoc(doc(firestoreDb, "categories", category.slug), mapCategoryToRow(category), {
    merge: true,
  });
}

export async function updateGalleryPhotoInFirestore(
  photo: StoreGalleryPhoto,
  displayOrder = 1
): Promise<void> {
  if (!firestoreDb) throw new Error("Cloud Firestore no está configurado.");
  await setDoc(
    doc(firestoreDb, "store_gallery", photo.id),
    {
      id: photo.id,
      title: photo.title,
      caption: photo.caption,
      image_url: photo.image,
      display_order: displayOrder,
      updated_at: new Date().toISOString(),
    },
    { merge: true }
  );
}

export async function upsertBannerInFirestore(banner: StoreBanner): Promise<void> {
  if (!firestoreDb) throw new Error("Cloud Firestore no está configurado.");
  await setDoc(doc(firestoreDb, "store_banners", banner.id), mapBannerToRow(banner), {
    merge: true,
  });
}

export async function createOrderInFirestore(order: CustomerOrder): Promise<void> {
  if (!firestoreDb) throw new Error("Cloud Firestore no está configurado.");
  await setDoc(doc(firestoreDb, "orders", order.id), {
    ...mapOrderToRow(order),
    created_at: order.createdAt,
    updated_at: order.createdAt,
  });
}

export async function updateOrderStatusInFirestore(
  orderId: string,
  status: CustomerOrder["status"]
): Promise<void> {
  if (!firestoreDb) throw new Error("Cloud Firestore no está configurado.");
  await updateDoc(doc(firestoreDb, "orders", orderId), {
    status,
    updated_at: new Date().toISOString(),
  });
}

export { ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE_BYTES, STORAGE_BUCKET };
