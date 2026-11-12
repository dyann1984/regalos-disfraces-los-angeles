import { Category, Product, StoreBanner, StoreGalleryPhoto } from "@/types/store";

export const BUSINESS_INFO = {
  name: "Regalos, Disfraces y Más — Los Ángeles",
  shortName: "Los Ángeles",
  slogan: "Regalos increíbles para cada ocasión",
  subSlogan:
    "Encuentra peluches, juguetes, disfraces, regalos, artículos para fiestas y muchas sorpresas más",
  bannerSubtitle:
    "Descubre peluches, juguetes, disfraces y muchas sorpresas para toda la familia.",
  whatsappRaw: "525635478874",
  whatsappDisplay: "5635478874",
  whatsappFormatted: "+52 56 3547 8874",
  country: "México",
  currency: "MXN",
  schedule: "Lunes a Sábado: 10:00 am – 8:00 pm | Domingos: 11:00 am – 5:00 pm",
  deliveryNotice:
    "Visítanos en tienda para elegir tus regalos o consulta disponibilidad y entrega local directamente por WhatsApp.",
};

export const INITIAL_CATEGORIES: Category[] = [
  {
    id: "cat-peluches",
    slug: "peluches",
    name: "Peluches",
    shortName: "Peluches",
    description: "Osos de peluche, personajes tiernos y peluches de distintos tamaños.",
    image: "/images/categories/cat-peluches.jpg",
    active: true,
    order: 1,
  },
  {
    id: "cat-juguetes",
    slug: "juguetes",
    name: "Juguetes",
    shortName: "Juguetes",
    description: "Juguetes, figuras, muñecos y diversión para niñas, niños y toda la familia.",
    image: "/images/products/prod-box.jpg",
    active: true,
    order: 2,
  },
  {
    id: "cat-regalos",
    slug: "regalos",
    name: "Regalos",
    shortName: "Regalos",
    description: "Cajas de regalo, sets de obsequio, arreglos y sorpresas listas para entregar.",
    image: "/images/categories/cat-regalos.jpg",
    active: true,
    order: 3,
  },
  {
    id: "cat-disfraces",
    slug: "disfraces",
    name: "Disfraces",
    shortName: "Disfraces",
    description: "Disfraces infantiles y familiares, máscaras, antifaces y accesorios para eventos.",
    image: "/images/categories/cat-disfraces.jpg",
    active: true,
    order: 4,
  },
  {
    id: "cat-fiestas",
    slug: "fiestas-celebraciones",
    name: "Artículos para fiestas",
    shortName: "Artículos para fiestas",
    description: "Globos, artículos de celebración, gorros festivos, velas y decoración.",
    image: "/images/categories/cat-fiesta.jpg",
    active: true,
    order: 5,
  },
  {
    id: "cat-accesorios",
    slug: "accesorios-otros",
    name: "Accesorios",
    shortName: "Accesorios",
    description: "Bolsas de regalo, moños, detalles florales, complementos y novedades.",
    image: "/images/categories/cat-mas.jpg",
    active: true,
    order: 6,
  },
];

export const INITIAL_STORE_GALLERY: StoreGalleryPhoto[] = [
  {
    id: "galeria-1",
    title: "Variedad de Peluches y Regalos",
    caption: "Amplio surtido de peluches y obsequios listos para sorprender en cualquier fecha.",
    image: "/images/products/prod-oso.jpg",
  },
  {
    id: "galeria-2",
    title: "Juguetes y Sets de Regalo",
    caption: "Opciones encantadoras de juguetes, cajas temáticas y sorpresas para niñas y niños.",
    image: "/images/products/prod-box.jpg",
  },
  {
    id: "galeria-3",
    title: "Disfraces para Toda Ocasión",
    caption: "Disfraces infantiles y familiares para festivales escolares, fiestas y temporadas.",
    image: "/images/products/prod-disfraz.jpg",
  },
  {
    id: "galeria-4",
    title: "Globos y Artículos para Fiestas",
    caption: "Globos metálicos, burbujas festivas, gorros y todo para ambientar tu celebración.",
    image: "/images/products/prod-globos.jpg",
  },
  {
    id: "galeria-5",
    title: "Detalles y Arreglos Especiales",
    caption: "Hermosos bouquets, arreglos y presentaciones elegantes listas en tienda.",
    image: "/images/products/prod-bouquet.jpg",
  },
  {
    id: "galeria-6",
    title: "Bolsas Boutique y Accesorios",
    caption: "Bolsas de regalo, moños, cajas decoradas y complementos para tus obsequios.",
    image: "/images/categories/cat-regalos.jpg",
  },
];

export const INITIAL_BANNERS: StoreBanner[] = [
  {
    id: "banner-1",
    badge: "Regalos, Disfraces y Más — Los Ángeles",
    titleLine1: "Regalos increíbles",
    titleLine2: "para cada ocasión 🎁",
    subtitle:
      "Descubre peluches, juguetes, disfraces y muchas sorpresas para toda la familia.",
    ctaText: "Explora nuestro catálogo",
    ctaTarget: "#catalogo-principal",
    imageUrl: "/images/hero-gifts.jpg",
    active: true,
    order: 1,
  },
  {
    id: "banner-2",
    badge: "Variedad Lista para Obsequiar",
    titleLine1: "Peluches, juguetes",
    titleLine2: "y regalos en tienda",
    subtitle:
      "Encuentra peluches, juguetes, disfraces, regalos, artículos para fiestas y muchas sorpresas más.",
    ctaText: "Conoce nuestra tienda",
    ctaTarget: "#nuestra-tienda",
    imageUrl: "/images/hero-gifts.jpg",
    active: true,
    order: 2,
  },
  {
    id: "banner-3",
    badge: "Alegría para Fiestas y Eventos",
    titleLine1: "Disfraces y artículos",
    titleLine2: "para tus celebraciones",
    subtitle:
      "Encuentra disfraces infantiles y familiares, globos y artículos para festejar a lo grande.",
    ctaText: "Explora nuestro catálogo",
    ctaTarget: "#catalogo-principal",
    imageUrl: "/images/hero-gifts.jpg",
    active: true,
    order: 3,
  },
];

/**
 * Catálogo de demostración sin promesas de personalización y sin inventar precios ni existencias definitivas.
 * Los productos reales con su fotografía individual, precio en MXN y existencia se cargarán desde /admin.
 */
export const INITIAL_PRODUCTS: Product[] = [
  {
    id: "prod-1",
    slug: "oso-peluche-gigante-90cm",
    name: "Oso de Peluche Clásico",
    subtitle: "(Sección Peluches)",
    description:
      "Tierno oso de peluche en color miel suave con moño satinado rosa. Textura afelpada ideal para cumpleaños, aniversarios y sorpresas especiales. Muestra de catálogo.",
    price: null,
    categorySlug: "peluches",
    images: ["/images/products/prod-oso.jpg"],
    badge: {
      text: "Destacado",
      variant: "bestseller",
    },
    variants: [
      {
        id: "var-size-oso",
        label: "Presentación",
        options: [
          { value: "Tamaño Chico", stock: 0 },
          { value: "Tamaño Mediano", stock: 0 },
          { value: "Tamaño Grande", stock: 0 },
        ],
      },
    ],
    stock: null,
    isFeatured: true,
    isSpecialOffer: false,
    active: true,
    isDemo: true,
    occasionTags: ["Peluches", "Cumpleaños", "Regalo"],
  },
  {
    id: "prod-2",
    slug: "set-juguete-box-unicornio",
    name: "Set de Regalo y Juguete Unicornio",
    subtitle: "(Sección Juguetes y Regalos)",
    description:
      "Caja de regalo temática con peluche de unicornio y accesorios coleccionables listos para obsequiar. Muestra representativa del catálogo.",
    price: null,
    categorySlug: "juguetes",
    images: ["/images/products/prod-box.jpg"],
    badge: {
      text: "Juguetes",
      variant: "toy",
    },
    stock: null,
    isFeatured: true,
    isSpecialOffer: true,
    active: true,
    isDemo: true,
    occasionTags: ["Juguetes", "Niñas y Niños", "Sorpresa"],
  },
  {
    id: "prod-3",
    slug: "disfraz-tematico-super-mario",
    name: "Disfraz Clásico de Personaje",
    subtitle: "(Sección Disfraces)",
    description:
      "Conjunto de disfraz para fiestas temáticas, festivales escolares y celebraciones familiares. Consulta tallas disponibles en tienda por WhatsApp.",
    price: null,
    categorySlug: "disfraces",
    images: ["/images/products/prod-disfraz.jpg"],
    badge: {
      text: "Disfraces",
      variant: "costume",
    },
    variants: [
      {
        id: "var-talla-disfraz",
        label: "Talla a consultar",
        options: [
          { value: "Infantil", stock: 0 },
          { value: "Juvenil / Adulto", stock: 0 },
        ],
      },
    ],
    stock: null,
    isFeatured: true,
    isSpecialOffer: false,
    active: true,
    isDemo: true,
    occasionTags: ["Disfraces", "Eventos Escolares", "Fiestas"],
  },
  {
    id: "prod-4",
    slug: "bouquet-rosas-detalle-regalo",
    name: "Bouquet de Rosas y Detalle",
    subtitle: "(Sección Regalos)",
    description:
      "Arreglo estilo bouquet con envoltura elegante y listón satinado, listo para regalar en ocasiones especiales. Muestra de catálogo.",
    price: null,
    categorySlug: "regalos",
    images: ["/images/products/prod-bouquet.jpg"],
    badge: {
      text: "Nuevo",
      variant: "new",
    },
    stock: null,
    isFeatured: true,
    isSpecialOffer: true,
    active: true,
    isDemo: true,
    occasionTags: ["Regalos", "Aniversario", "Celebración"],
  },
  {
    id: "prod-5",
    slug: "arreglo-globos-fiesta-cumpleanos",
    name: "Set de Globos “Feliz Cumpleaños”",
    subtitle: "(Sección Artículos para Fiestas)",
    description:
      "Conjunto festivo de globos metálicos y de látex con motivo de Feliz Cumpleaños y moño decorativo para ambientar tus festejos.",
    price: null,
    categorySlug: "fiestas-celebraciones",
    images: ["/images/products/prod-globos.jpg"],
    badge: {
      text: "Fiestas",
      variant: "special",
    },
    stock: null,
    isFeatured: true,
    isSpecialOffer: false,
    active: true,
    isDemo: true,
    occasionTags: ["Artículos para Fiestas", "Cumpleaños"],
  },
  {
    id: "prod-6",
    slug: "bolsa-regalo-accesorios-boutique",
    name: "Bolsas de Regalo y Accesorios",
    subtitle: "(Sección Accesorios)",
    description:
      "Variedad de bolsas de obsequio, cajas con moño, envolturas y accesorios para complementar tus compras en tienda.",
    price: null,
    categorySlug: "accesorios-otros",
    images: ["/images/categories/cat-mas.jpg"],
    badge: {
      text: "Accesorios",
      variant: "promo",
    },
    stock: null,
    isFeatured: true,
    isSpecialOffer: true,
    active: true,
    isDemo: true,
    occasionTags: ["Accesorios", "Complementos"],
  },
];
