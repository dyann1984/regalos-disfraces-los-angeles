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
import { compressImageToSparkWebPDataUrl } from "@/lib/imageUtils";

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

/**
 * Sube una fotografía tomada desde el celular o galería:
 * 1. Si Cloud Storage (`NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`) está activo y el modo no es `firestore_inline`,
 *    sube al bucket bajo `store-media/{folder}/{filename}` y devuelve la URL pública.
 * 2. Si se configuró Cloudinary gratuito (`NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` + `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`),
 *    sube a Cloudinary sin requerir tarjeta en Firebase.
 * 3. Si el proyecto está en Plan Spark sin bucket de Storage (`NEXT_PUBLIC_STORAGE_MODE=firestore_inline` o sin bucket),
 *    comprime la imagen a WebP ultra-ligero (~45–65 KB) para guardarla directamente en Cloud Firestore sin costo.
 */
export async function uploadImageToFirebase(
  file: File,
  folder: "products" | "gallery" | "categories" | "banners"
): Promise<string> {
  const validationError = validateImageFile(file);
  if (validationError) {
    throw new Error(validationError);
  }

  const storageMode = (process.env.NEXT_PUBLIC_STORAGE_MODE || "auto").toLowerCase();
  const cloudinaryCloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "";
  const cloudinaryPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "";

  // Opción A: Cloudinary gratuito (25 GB sin tarjeta) si está configurado
  if (
    (storageMode === "cloudinary" || (!firebaseStorage && cloudinaryCloud && cloudinaryPreset)) &&
    cloudinaryCloud &&
    cloudinaryPreset
  ) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", cloudinaryPreset);
    formData.append("folder", `${STORAGE_BUCKET}/${folder}`);

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudinaryCloud)}/image/upload`,
      {
        method: "POST",
        body: formData,
      }
    );
    if (!res.ok) {
      throw new Error("No se pudo subir la imagen a Cloudinary.");
    }
    const data = await res.json();
    return String(data.secure_url);
  }

  // Opción B: Modo WebP optimizado en Firestore (Plan Spark 100% gratuito sin tarjeta)
  if (storageMode === "firestore_inline" || !firebaseStorage) {
    return await compressImageToSparkWebPDataUrl(file);
  }

  // Opción C: Firebase Cloud Storage (`store-media/{folder}/...`)
  const ext = file.name.split(".").pop()?.toLowerCase() || "webp";
  const safeBase = file.name
    .replace(/\.[^/.]+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .slice(0, 40);
  const filePath = `${STORAGE_BUCKET}/${folder}/${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 7)}-${safeBase}.${ext}`;

  try {
    const storageRef = ref(firebaseStorage, filePath);
    await uploadBytes(storageRef, file, {
      contentType: file.type || "image/webp",
      cacheControl: "public,max-age=31536000",
    });
    return await getDownloadURL(storageRef);
  } catch (err) {
    // Si el bucket de Storage aún no está aprovisionado en el plan gratuito Spark, usar respaldo WebP compacto
    if (storageMode === "auto") {
      return await compressImageToSparkWebPDataUrl(file);
    }
    throw new Error(
      err instanceof Error
        ? `Error al subir imagen a Firebase Storage: ${err.message}`
        : "Error al subir imagen a Firebase Storage."
    );
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

  const [catSnap, prodSnap, galSnap, banSnap] = await Promise.all([
    getDocs(query(collection(firestoreDb, "categories"), orderBy("display_order", "asc"))),
    getDocs(collection(firestoreDb, "products")),
    getDocs(query(collection(firestoreDb, "store_gallery"), orderBy("display_order", "asc"))),
    getDocs(query(collection(firestoreDb, "store_banners"), orderBy("display_order", "asc"))),
  ]);

  const categories = catSnap.docs.map((d) =>
    mapRowToCategory({ id: d.id, ...d.data() } as Record<string, unknown>)
  );

  const productsRaw = prodSnap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  })) as Record<string, unknown>[];

  productsRaw.sort((a, b) =>
    String(b.created_at || b.updated_at || "").localeCompare(
      String(a.created_at || a.updated_at || "")
    )
  );

  const products = productsRaw.map(mapRowToProduct);

  const storeGallery = galSnap.docs.map((d) =>
    mapRowToGalleryPhoto({ id: d.id, ...d.data() } as Record<string, unknown>)
  );

  const banners = banSnap.docs.map((d) =>
    mapRowToBanner({ id: d.id, ...d.data() } as Record<string, unknown>)
  );

  let orders: CustomerOrder[] = [];
  if (includeAdminData) {
    const ordSnap = await getDocs(collection(firestoreDb, "orders"));
    const ordersRaw = ordSnap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as Record<string, unknown>[];
    ordersRaw.sort((a, b) =>
      String(b.created_at || "").localeCompare(String(a.created_at || ""))
    );
    orders = ordersRaw.map(mapRowToOrder);
  }

  return { categories, products, storeGallery, banners, orders };
}

export async function upsertProductInFirestore(product: Product): Promise<void> {
  if (!firestoreDb) throw new Error("Cloud Firestore no está configurado.");
  const row = mapProductToRow(product);
  await setDoc(
    doc(firestoreDb, "products", product.id),
    {
      ...row,
      created_at: new Date().toISOString(),
    },
    { merge: true }
  );
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
