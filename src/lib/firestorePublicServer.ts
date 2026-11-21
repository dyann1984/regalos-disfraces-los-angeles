import { CategorySlug, Product } from "@/types/store";

type FirestoreValue = {
  stringValue?: string;
  integerValue?: string;
  doubleValue?: number;
  booleanValue?: boolean;
  nullValue?: null;
  arrayValue?: { values?: FirestoreValue[] };
};

function unwrapValue(val?: FirestoreValue): unknown {
  if (!val) return undefined;
  if ("stringValue" in val) return val.stringValue;
  if ("integerValue" in val) return Number(val.integerValue);
  if ("doubleValue" in val) return Number(val.doubleValue);
  if ("booleanValue" in val) return Boolean(val.booleanValue);
  if ("nullValue" in val) return null;
  if ("arrayValue" in val) {
    return (val.arrayValue?.values || []).map(unwrapValue);
  }
  return undefined;
}

function mapFirestoreDocToProduct(doc: {
  name?: string;
  fields?: Record<string, FirestoreValue>;
}): Product | null {
  const fields = doc?.fields;
  if (!fields) return null;
  const docId = (doc.name || "").split("/").pop() || String(unwrapValue(fields.id) || "");
  const active = unwrapValue(fields.active) !== false;
  const isDemo = Boolean(unwrapValue(fields.is_demo));
  if (!active || isDemo) return null;

  const imagesRaw = unwrapValue(fields.images);
  const images = Array.isArray(imagesRaw)
    ? imagesRaw.map(String).filter(Boolean).slice(0, 5)
    : [];

  const priceVal = unwrapValue(fields.price);
  const promoVal = unwrapValue(fields.promo_price);
  const stockVal = unwrapValue(fields.stock);
  const badgeText = unwrapValue(fields.badge_text);
  const badgeVariant = unwrapValue(fields.badge_variant);

  return {
    id: docId,
    slug: String(unwrapValue(fields.slug) || docId),
    name: String(unwrapValue(fields.name) || "Producto"),
    subtitle: String(unwrapValue(fields.subtitle) || ""),
    description: String(unwrapValue(fields.description) || ""),
    price: priceVal !== null && priceVal !== undefined ? Number(priceVal) : null,
    promoPrice:
      promoVal !== null && promoVal !== undefined ? Number(promoVal) : undefined,
    categorySlug: String(unwrapValue(fields.category_slug) || "regalos") as CategorySlug,
    images: images.length > 0 ? images : ["/images/products/prod-box.jpg"],
    badge:
      badgeText && badgeVariant
        ? {
            text: String(badgeText),
            variant: String(badgeVariant) as NonNullable<Product["badge"]>["variant"],
          }
        : undefined,
    stock: stockVal !== null && stockVal !== undefined ? Number(stockVal) : null,
    isFeatured: Boolean(unwrapValue(fields.is_featured)),
    isSpecialOffer: Boolean(unwrapValue(fields.is_special_offer)),
    active: true,
    isDemo: false,
    occasionTags: Array.isArray(unwrapValue(fields.occasion_tags))
      ? (unwrapValue(fields.occasion_tags) as unknown[]).map(String)
      : [],
  };
}

export async function fetchActiveProductsPublicServer(): Promise<Product[]> {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "";
  if (!projectId || projectId.includes("tu-proyecto")) return [];

  try {
    const res = await fetch(
      `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(
        projectId
      )}/databases/(default)/documents:runQuery`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          structuredQuery: {
            from: [{ collectionId: "products" }],
            where: {
              fieldFilter: {
                field: { fieldPath: "active" },
                op: "EQUAL",
                value: { booleanValue: true },
              },
            },
            limit: 200,
          },
        }),
        next: { revalidate: 60 },
      }
    );

    if (!res.ok) return [];
    const rows = (await res.json()) as Array<{
      document?: { name?: string; fields?: Record<string, FirestoreValue> };
    }>;

    return rows
      .map((r) => (r.document ? mapFirestoreDocToProduct(r.document) : null))
      .filter((p): p is Product => Boolean(p));
  } catch {
    return [];
  }
}

export async function fetchPublicProductBySlugOrId(
  slugOrId: string
): Promise<Product | null> {
  const clean = decodeURIComponent(slugOrId).trim();
  if (!clean) return null;
  const all = await fetchActiveProductsPublicServer();
  return all.find((p) => p.slug === clean || p.id === clean) || null;
}
