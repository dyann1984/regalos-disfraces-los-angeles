import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { StoreProvider } from "@/context/StoreContext";
import { BUSINESS_INFO } from "@/data/mockCatalog";
import { SITE_URL } from "@/lib/whatsapp";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  style: ["normal"],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default:
      "Regalos, Disfraces y Más — Los Ángeles | Peluches, Juguetes y Regalos en México",
    template: "%s | Regalos, Disfraces y Más — Los Ángeles",
  },
  description:
    "Regalos increíbles para cada ocasión. Encuentra peluches, juguetes, disfraces, regalos, artículos para fiestas y accesorios listos para obsequiar. Pedidos por WhatsApp +52 56 3547 8874.",
  keywords: [
    "tienda de regalos",
    "peluches",
    "juguetes",
    "disfraces",
    "artículos para fiestas",
    "accesorios",
    "Regalos Disfraces y Más Los Ángeles",
  ],
  openGraph: {
    type: "website",
    locale: "es_MX",
    url: SITE_URL,
    siteName: BUSINESS_INFO.name,
    title: "Regalos, Disfraces y Más — Los Ángeles",
    description:
      "Encuentra peluches, juguetes, disfraces, regalos, artículos para fiestas y muchas sorpresas más.",
    images: [
      {
        url: "/images/hero-gifts.jpg",
        width: 1200,
        height: 630,
        alt: "Regalos, Disfraces y Más — Los Ángeles",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Regalos, Disfraces y Más — Los Ángeles",
    description:
      "Peluches, juguetes, disfraces, regalos, artículos para fiestas y accesorios. Pedidos por WhatsApp.",
    images: ["/images/hero-gifts.jpg"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

const storeJsonLd = {
  "@context": "https://schema.org",
  "@type": "Store",
  name: BUSINESS_INFO.name,
  url: SITE_URL,
  telephone: BUSINESS_INFO.whatsappFormatted,
  image: `${SITE_URL}/images/logo-header.jpg`,
  priceRange: "$$",
  hasMap: BUSINESS_INFO.mapsUrl,
  description: BUSINESS_INFO.subSlogan,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es-MX" className={poppins.variable}>
      <body className="font-sans antialiased selection:bg-[#F48FB1] selection:text-[#6A1B4D]">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(storeJsonLd) }}
        />
        <StoreProvider>{children}</StoreProvider>
      </body>
    </html>
  );
}
