import { createClient } from "@supabase/supabase-js";
import {
  Category,
  CategorySlug,
  CustomerOrder,
  Product,
  ProductVariant,
  StoreBanner,
  StoreGalleryPhoto,
} from "@/types/store";
import {
  INITIAL_BANNERS,
  INITIAL_CATEGORIES,
  INITIAL_STORE_GALLERY,
} from "@/data/mockCatalog";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

/**
 * Estado real de configuración de Supabase.
 * No utiliza valores simulados ni contraseñas fijas.
 */
export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl.startsWith("https://") &&
    !supabaseUrl.includes("tu-proyecto")
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

export const STORAGE_BUCKET = "store-media";

export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export function validateImageFile(file: File): string | null {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return "Formato no permitido. Usa fotografías JPG, PNG o WEBP.";
  }
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return "La imagen supera el límite de 5 MB. Por favor elige una imagen más ligera.";
  }
  return null;
}

/**
 * Sube una imagen a Supabase Storage en el bucket 'store-media' y devuelve su URL pública.
 */
export async function uploadImageToSupabaseStorage(
  file: File,
  folder: "products" | "gallery" | "categories" | "banners"
): Promise<string> {
  const validationError = validateImageFile(file);
  if (validationError) {
    throw new Error(validationError);
  }

  if (!supabase) {
    throw new Error(
      "Supabase Storage no está configurado. Configura NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
  }

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const safeBase = file.name
    .replace(/\.[^/.]+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .slice(0, 40);
  const filePath = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 7)}-${safeBase}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type,
    });

  if (uploadError) {
    throw new Error(`Error al subir imagen a Supabase Storage: ${uploadError.message}`);
  }

  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(filePath);
  return data.publicUrl;
}

/**
 * Verifica estrictamente que el usuario autenticado figure como administrador autorizado en public.admin_users.
 * No permite auto-registro público desde el navegador para evitar que visitantes se apropien del panel /admin.
 */
export async function verifyOrBootstrapAdmin(): Promise<boolean> {
  if (!supabase) return false;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data: existingAdmin, error } = await supabase
    .from("admin_users")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    return false;
  }

  return Boolean(existingAdmin?.user_id);
}

/**
 * Inicializa las 6 categorías oficiales, banners y galería en Supabase si aún no existen registros.
 */
export async function ensureInitialCatalogSeeded(): Promise<void> {
  if (!supabase) return;

  const { count: catCount } = await supabase
    .from("categories")
    .select("*", { count: "exact", head: true });

  if (catCount === 0) {
    await supabase.from("categories").upsert(
      INITIAL_CATEGORIES.map((c) => ({
        id: c.id,
        slug: c.slug,
        name: c.name,
        short_name: c.shortName,
        description: c.description,
        image_url: c.image,
        active: c.active,
        display_order: c.order,
      })),
      { onConflict: "slug" }
    );
  }

  const { count: galleryCount } = await supabase
    .from("store_gallery")
    .select("*", { count: "exact", head: true });

  if (galleryCount === 0) {
    await supabase.from("store_gallery").upsert(
      INITIAL_STORE_GALLERY.map((g, idx) => ({
        id: g.id,
        title: g.title,
        caption: g.caption,
        image_url: g.image,
        display_order: idx + 1,
      })),
      { onConflict: "id" }
    );
  }

  const { count: bannerCount } = await supabase
    .from("store_banners")
    .select("*", { count: "exact", head: true });

  if (bannerCount === 0) {
    await supabase.from("store_banners").upsert(
      INITIAL_BANNERS.map((b) => ({
        id: b.id,
        badge: b.badge,
        title_line1: b.titleLine1,
        title_line2: b.titleLine2,
        subtitle: b.subtitle,
        cta_text: b.ctaText,
        cta_target: b.ctaTarget,
        image_url: b.imageUrl || "/images/hero-gifts.jpg",
        active: b.active,
        display_order: b.order,
      })),
      { onConflict: "id" }
    );
  }
}

// ============================================================================
// MAPEADORES ENTRE POSTGRESQL Y MODELOS DE LA TIENDA
// ============================================================================

export function mapRowToCategory(row: Record<string, unknown>): Category {
  return {
    id: String(row.id),
    slug: String(row.slug) as CategorySlug,
    name: String(row.name),
    shortName: String(row.short_name || row.name),
    description: String(row.description || ""),
    image: String(row.image_url || "/images/categories/cat-regalos.jpg"),
    active: row.active !== false,
    order: Number(row.display_order ?? 0),
  };
}

export function mapCategoryToRow(cat: Category) {
  return {
    id: cat.id,
    slug: cat.slug,
    name: cat.name,
    short_name: cat.shortName,
    description: cat.description,
    image_url: cat.image,
    active: cat.active,
    display_order: cat.order,
    updated_at: new Date().toISOString(),
  };
}

export function mapRowToProduct(row: Record<string, unknown>): Product {
  const images = Array.isArray(row.images)
    ? (row.images as string[]).slice(0, 5)
    : ["/images/products/prod-box.jpg"];

  return {
    id: String(row.id),
    slug: String(row.slug),
    name: String(row.name),
    subtitle: String(row.subtitle || ""),
    description: String(row.description || ""),
    price: row.price !== null && row.price !== undefined ? Number(row.price) : null,
    promoPrice:
      row.promo_price !== null && row.promo_price !== undefined
        ? Number(row.promo_price)
        : undefined,
    categorySlug: String(row.category_slug || "regalos") as CategorySlug,
    images: images.length > 0 ? images : ["/images/products/prod-box.jpg"],
    badge:
      row.badge_text && row.badge_variant
        ? {
            text: String(row.badge_text),
            variant: String(row.badge_variant) as NonNullable<Product["badge"]>["variant"],
          }
        : undefined,
    variants: Array.isArray(row.variants) ? (row.variants as ProductVariant[]) : [],
    stock: row.stock !== null && row.stock !== undefined ? Number(row.stock) : null,
    isFeatured: Boolean(row.is_featured),
    isSpecialOffer: Boolean(row.is_special_offer),
    active: row.active !== false,
    isDemo: Boolean(row.is_demo),
    occasionTags: Array.isArray(row.occasion_tags) ? (row.occasion_tags as string[]) : [],
  };
}

export function mapProductToRow(prod: Product) {
  return {
    id: prod.id,
    slug: prod.slug,
    name: prod.name,
    subtitle: prod.subtitle || "",
    description: prod.description || "",
    price: prod.price,
    promo_price: prod.promoPrice ?? null,
    category_slug: prod.categorySlug,
    images: (prod.images || []).slice(0, 5),
    badge_text: prod.badge?.text ?? null,
    badge_variant: prod.badge?.variant ?? null,
    variants: prod.variants ?? [],
    stock: prod.stock,
    is_featured: prod.isFeatured,
    is_special_offer: prod.isSpecialOffer,
    active: prod.active,
    is_demo: prod.isDemo,
    occasion_tags: prod.occasionTags ?? [],
    updated_at: new Date().toISOString(),
  };
}

export function mapRowToGalleryPhoto(row: Record<string, unknown>): StoreGalleryPhoto {
  return {
    id: String(row.id),
    title: String(row.title),
    caption: String(row.caption || ""),
    image: String(row.image_url),
  };
}

export function mapRowToBanner(row: Record<string, unknown>): StoreBanner {
  return {
    id: String(row.id),
    badge: String(row.badge),
    titleLine1: String(row.title_line1),
    titleLine2: String(row.title_line2),
    subtitle: String(row.subtitle),
    ctaText: String(row.cta_text || "Explora nuestro catálogo"),
    ctaTarget: String(row.cta_target || "/catalogo"),
    imageUrl: String(row.image_url || "/images/hero-gifts.jpg"),
    active: row.active !== false,
    order: Number(row.display_order ?? 1),
  };
}

export function mapBannerToRow(banner: StoreBanner) {
  return {
    id: banner.id,
    badge: banner.badge,
    title_line1: banner.titleLine1,
    title_line2: banner.titleLine2,
    subtitle: banner.subtitle,
    cta_text: banner.ctaText,
    cta_target: banner.ctaTarget,
    image_url: banner.imageUrl || "/images/hero-gifts.jpg",
    active: banner.active,
    display_order: banner.order,
    updated_at: new Date().toISOString(),
  };
}

export function mapRowToOrder(row: Record<string, unknown>): CustomerOrder {
  return {
    id: String(row.id),
    createdAt: String(row.created_at || new Date().toISOString()),
    customerName: String(row.customer_name),
    customerPhone: String(row.customer_phone),
    customerEmail: row.customer_email ? String(row.customer_email) : undefined,
    deliveryMethod:
      row.delivery_method === "local_delivery" ? "local_delivery" : "pickup",
    address: row.address ? String(row.address) : undefined,
    occasion: row.occasion ? String(row.occasion) : undefined,
    orderNotes: row.order_notes ? String(row.order_notes) : undefined,
    items: Array.isArray(row.items) ? (row.items as CustomerOrder["items"]) : [],
    subtotal: Number(row.subtotal ?? 0),
    discount: Number(row.discount ?? 0),
    total: Number(row.total ?? 0),
    status: String(row.status || "pendiente_whatsapp") as CustomerOrder["status"],
    paymentMethod:
      row.payment_method === "mercadopago_pendiente"
        ? "mercadopago_pendiente"
        : "whatsapp_accord",
  };
}

export function mapOrderToRow(order: CustomerOrder) {
  return {
    id: order.id,
    customer_name: order.customerName,
    customer_phone: order.customerPhone,
    customer_email: order.customerEmail ?? null,
    delivery_method: order.deliveryMethod,
    address: order.address ?? null,
    occasion: order.occasion ?? null,
    order_notes: order.orderNotes ?? null,
    items: order.items,
    subtotal: order.subtotal,
    discount: order.discount,
    total: order.total,
    status: order.status,
    payment_method: order.paymentMethod,
  };
}
