import type { MetadataRoute } from "next";
import { fetchActiveProductsPublicServer } from "@/lib/firestorePublicServer";
import { SITE_URL } from "@/lib/whatsapp";

const CATEGORY_SLUGS = [
  "peluches",
  "juguetes",
  "regalos",
  "disfraces",
  "fiestas-celebraciones",
  "accesorios-otros",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const baseEntries: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${SITE_URL}/catalogo`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    ...CATEGORY_SLUGS.map((slug) => ({
      url: `${SITE_URL}/catalogo?categoria=${slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];

  const products = await fetchActiveProductsPublicServer();
  const productEntries: MetadataRoute.Sitemap = products.map((p) => ({
    url: `${SITE_URL}/producto/${encodeURIComponent(p.slug || p.id)}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.85,
  }));

  return [...baseEntries, ...productEntries];
}
