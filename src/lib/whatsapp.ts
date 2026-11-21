import { BUSINESS_INFO } from "@/data/mockCatalog";
import { CartItem, CustomerOrder, Product } from "@/types/store";

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  "https://regalos-disfraces-los-angeles.vercel.app";

export function formatMXN(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) {
    return "Precio por confirmar";
  }
  return `$${amount.toFixed(2)} MXN`;
}

export function getProductShareUrl(product: Pick<Product, "slug" | "id">): string {
  const path = `/producto/${encodeURIComponent(product.slug || product.id)}`;
  if (typeof window !== "undefined" && window.location?.origin) {
    return `${window.location.origin}${path}`;
  }
  return `${SITE_URL}${path}`;
}

export function buildProductWhatsAppShareUrl(product: Product): string {
  const url = getProductShareUrl(product);
  const effectivePrice = product.promoPrice ?? product.price;
  const priceText =
    effectivePrice !== null && effectivePrice > 0
      ? ` — ${formatMXN(effectivePrice)}`
      : "";
  const message = `🎁 Mira este producto de *${BUSINESS_INFO.name}*:\n*${product.name}*${priceText}\n${url}`;
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}

export function buildProductFacebookShareUrl(product: Product): string {
  const url = getProductShareUrl(product);
  return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
}

export function getDirectWhatsAppUrl(customMessage?: string): string {
  const defaultMsg =
    "¡Hola! Vi la página de Regalos, Disfraces y Más — Los Ángeles y me gustaría consultar disponibilidad de productos.";
  const text = encodeURIComponent(customMessage || defaultMsg);
  return `https://wa.me/${BUSINESS_INFO.whatsappRaw}?text=${text}`;
}

/**
 * Genera el mensaje estructurado de pedido por WhatsApp con consentimiento explícito:
 * incluye nombre de cada producto, cantidad, precio unitario, subtotal, total y modalidad de entrega.
 * Solo incluye datos personales (nombre, teléfono, dirección) si el cliente los proporcionó con consentimiento.
 */
export function buildOrderWhatsAppUrl(
  order: CustomerOrder,
  includePersonalData = true
): string {
  const lines: string[] = [
    `🎁 *PEDIDO — ${BUSINESS_INFO.name}*`,
    `📋 *Folio:* ${order.id}`,
  ];

  if (includePersonalData && order.customerName) {
    lines.push(`👤 *Cliente:* ${order.customerName}`);
  }
  if (includePersonalData && order.customerPhone) {
    lines.push(`📱 *Teléfono:* ${order.customerPhone}`);
  }

  lines.push(
    `🚚 *Modalidad de entrega:* ${
      order.deliveryMethod === "pickup"
        ? "Recoger en tienda"
        : includePersonalData && order.address
        ? `Entrega local (${order.address})`
        : "Entrega local (a coordinar por WhatsApp)"
    }`
  );

  if (order.occasion) {
    lines.push(`🎉 *Ocasión:* ${order.occasion}`);
  }
  if (order.orderNotes) {
    lines.push(`📝 *Comentarios:* ${order.orderNotes}`);
  }

  lines.push("", "*Detalle de productos:*");

  order.items.forEach((item, idx) => {
    const unitPrice = item.product.promoPrice ?? item.product.price;
    const linePriceLabel =
      unitPrice !== null && unitPrice !== undefined
        ? `${formatMXN(unitPrice)} c/u • Subtotal: ${formatMXN(unitPrice * item.quantity)}`
        : "Precio por confirmar en tienda";

    let itemLine = `${idx + 1}. *${item.product.name}* — Cant: ${item.quantity} — ${linePriceLabel}`;
    if (item.selectedVariants && Object.keys(item.selectedVariants).length > 0) {
      const vars = Object.entries(item.selectedVariants)
        .map(([k, v]) => `${k}: ${v}`)
        .join(", ");
      itemLine += `\n   • Opción: ${vars}`;
    }
    if (item.orderNotes) {
      itemLine += `\n   • Nota: "${item.orderNotes}"`;
    }
    lines.push(itemLine);
  });

  if (order.discount > 0) {
    lines.push("", `🏷️ *Descuento aplicado:* -${formatMXN(order.discount)}`);
  }

  if (order.total > 0) {
    lines.push(`💰 *Total del pedido:* ${formatMXN(order.total)}`);
  } else {
    lines.push("", "💬 *Solicito confirmación de precios y existencias actuales en tienda.*");
  }

  lines.push("", "Quedo atento(a) para confirmar disponibilidad. ¡Muchas gracias!");

  return `https://wa.me/${BUSINESS_INFO.whatsappRaw}?text=${encodeURIComponent(lines.join("\n"))}`;
}

/**
 * Genera un pedido rápido por WhatsApp sin solicitar ni enviar datos personales.
 * Incluye únicamente productos, cantidades, precios, total y modalidad de entrega elegida.
 */
export function buildQuickCartWhatsAppUrl(
  cart: CartItem[],
  total: number,
  deliveryMethod: "pickup" | "local_delivery" = "pickup"
): string {
  const lines: string[] = [
    `🎁 *PEDIDO RÁPIDO — ${BUSINESS_INFO.name}*`,
    `🚚 *Modalidad de entrega:* ${
      deliveryMethod === "pickup" ? "Recoger en tienda" : "Entrega local (a coordinar)"
    }`,
    "",
    "*Artículos seleccionados:*",
  ];
  cart.forEach((item, idx) => {
    const unitPrice = item.product.promoPrice ?? item.product.price;
    const priceDetail =
      unitPrice !== null && unitPrice !== undefined
        ? `${formatMXN(unitPrice)} c/u • Subtotal: ${formatMXN(unitPrice * item.quantity)}`
        : "Precio por confirmar";
    lines.push(`${idx + 1}. *${item.product.name}* — Cant: ${item.quantity} — ${priceDetail}`);
  });
  if (total > 0) {
    lines.push("", `💰 *Total estimado:* ${formatMXN(total)}`);
  }
  lines.push("", "¿Me confirman disponibilidad por favor?");
  return `https://wa.me/${BUSINESS_INFO.whatsappRaw}?text=${encodeURIComponent(lines.join("\n"))}`;
}
