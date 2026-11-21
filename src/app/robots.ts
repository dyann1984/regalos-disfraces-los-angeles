import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/whatsapp";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/catalogo", "/producto/"],
        disallow: ["/admin", "/api/"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
