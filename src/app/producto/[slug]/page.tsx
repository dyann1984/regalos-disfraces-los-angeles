import React from "react";
import type { Metadata } from "next";
import { fetchPublicProductBySlugOrId } from "@/lib/firestorePublicServer";
import { formatMXN, SITE_URL } from "@/lib/whatsapp";
import ProductDetailClient from "@/components/ProductDetailClient";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const product = await fetchPublicProductBySlugOrId(params.slug);
  if (!product) {
    return {
      title: "Producto | Regalos, Disfraces y Más — Los Ángeles",
      description:
        "Explora peluches, juguetes, disfraces, regalos y accesorios en Regalos, Disfraces y Más — Los Ángeles.",
    };
  }

  const effectivePrice = product.promoPrice ?? product.price;
  const priceLabel =
    effectivePrice !== null && effectivePrice > 0
      ? ` — ${formatMXN(effectivePrice)}`
      : "";
  const title = `${product.name}${priceLabel} | Regalos, Disfraces y Más — Los Ángeles`;
  const description =
    product.description ||
    `${product.name} disponible en Regalos, Disfraces y Más — Los Ángeles.`;
  const canonicalUrl = `${SITE_URL}/producto/${encodeURIComponent(
    product.slug || product.id
  )}`;

  return {
    title,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: "Regalos, Disfraces y Más — Los Ángeles",
      locale: "es_MX",
      type: "website",
      images: product.images[0]
        ? [
            {
              url: product.images[0],
              alt: product.name,
            },
          ]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: product.images[0] ? [product.images[0]] : undefined,
    },
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const product = await fetchPublicProductBySlugOrId(params.slug);
  const effectivePrice = product ? product.promoPrice ?? product.price : null;

  const productJsonLd =
    product && effectivePrice !== null && effectivePrice > 0
      ? {
          "@context": "https://schema.org",
          "@type": "Product",
          name: product.name,
          description: product.description,
          image: product.images,
          sku: product.id,
          offers: {
            "@type": "Offer",
            url: `${SITE_URL}/producto/${encodeURIComponent(
              product.slug || product.id
            )}`,
            priceCurrency: "MXN",
            price: effectivePrice.toFixed(2),
            availability:
              product.stock !== null && product.stock > 0
                ? "https://schema.org/InStock"
                : "https://schema.org/OutOfStock",
            seller: {
              "@type": "Organization",
              name: "Regalos, Disfraces y Más — Los Ángeles",
            },
          },
        }
      : null;

  return (
    <>
      {productJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
        />
      )}
      <ProductDetailClient initialProduct={product} slugOrId={params.slug} />
    </>
  );
}
