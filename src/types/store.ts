export type CategorySlug =
  | "peluches"
  | "juguetes"
  | "regalos"
  | "disfraces"
  | "fiestas-celebraciones"
  | "accesorios-otros";

export interface Category {
  id: string;
  slug: CategorySlug;
  name: string;
  shortName: string;
  description: string;
  image: string;
  badgeColor?: string;
  active: boolean;
  order: number;
}

export interface ProductVariant {
  id: string;
  label: string; // ej. "Tamaño", "Color", "Talla", "Modelo"
  options: {
    value: string;
    priceModifier?: number;
    stock: number;
  }[];
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  subtitle: string;
  description: string;
  price: number | null; // MXN (null cuando está pendiente de asignar desde /admin)
  promoPrice?: number;
  categorySlug: CategorySlug;
  images: string[]; // Hasta 5 fotografías por producto
  badge?: {
    text: string;
    variant: "bestseller" | "new" | "costume" | "toy" | "special" | "promo";
  };
  variants?: ProductVariant[];
  stock: number | null; // null cuando la disponibilidad se confirma en tienda
  isFeatured: boolean;
  isSpecialOffer: boolean;
  active: boolean;
  isDemo: boolean;
  occasionTags?: string[];
}

export interface StoreGalleryPhoto {
  id: string;
  title: string;
  caption: string;
  image: string;
}

export interface StoreBanner {
  id: string;
  badge: string;
  titleLine1: string;
  titleLine2: string;
  subtitle: string;
  ctaText: string;
  ctaTarget: string;
  imageUrl?: string;
  active: boolean;
  order: number;
}

export interface AIDetectedProductItem {
  id: string;
  visualLabel: string;
  suggestedName: string;
  suggestedSubtitle: string;
  categorySlug: CategorySlug;
  description: string;
  visualFeaturesConfirmed: string[];
}

export interface AIProductAnalysisResponse {
  multipleItemsDetected: boolean;
  summaryNote: string;
  items: AIDetectedProductItem[];
  providerUsed: "gemini" | "openai";
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedVariants?: Record<string, string>;
  orderNotes?: string;
}

export interface CustomerOrder {
  id: string;
  createdAt: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  deliveryMethod: "pickup" | "local_delivery";
  address?: string;
  occasion?: string;
  orderNotes?: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  total: number;
  status:
    | "pendiente_whatsapp"
    | "confirmado"
    | "en_preparacion"
    | "listo_entrega"
    | "entregado"
    | "cancelado";
  paymentMethod: "whatsapp_accord" | "mercadopago_pendiente";
}
