import { BUSINESS_INFO } from "@/data/mockCatalog";
import { CartItem, CustomerOrder } from "@/types/store";

export function formatMXN(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) {
    return "Precio por confirmar";
  }
  return `$${amount.toFixed(2)} MXN`;
}

export function getDirectWhatsAppUrl(customMessage?: string): string {
  const defaultMsg =
    "¡Hola! Vi la página de Regalos, Disfraces y Más — Los Ángeles y me gustaría consultar disponibilidad de productos.";
  const text = encodeURIComponent(customMessage || defaultMsg);
  return `https://wa.me/${BUSINESS_INFO.whatsappRaw}?text=${text}`;
}

export function buildOrderWhatsAppUrl(order: CustomerOrder): string {
  const lines: string[] = [
    `🎁 *SOLICITUD DE PEDIDO — ${BUSINESS_INFO.name}*`,
    `📋 *Folio:* ${order.id}`,
    `👤 *Cliente:* ${order.customerName}`,
    `📱 *Teléfono:* ${order.customerPhone}`,
    `🚚 *Modalidad de entrega:* ${
      order.deliveryMethod === "pickup"
        ? "Recolección en tienda"
        : `Entrega local (${order.address || "Por confirmar"})`
    }`,
  ];

  if (order.occasion) {
    lines.push(`🎉 *Ocasión:* ${order.occasion}`);
  }
  if (order.orderNotes) {
    lines.push(`📝 *Comentarios del pedido:* ${order.orderNotes}`);
  }

  lines.push("", "*Artículos seleccionados:*");

  order.items.forEach((item, idx) => {
    const unitPrice = item.product.promoPrice ?? item.product.price;
    const priceLabel =
      unitPrice !== null && unitPrice !== undefined
        ? formatMXN(unitPrice * item.quantity)
        : "Precio y existencia por confirmar";
    let itemLine = `${idx + 1}. *${item.product.name} ${item.product.subtitle}* x${item.quantity} — ${priceLabel}`;
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

  if (order.total > 0) {
    lines.push("", `💰 *Total calculado:* ${formatMXN(order.total)}`);
  } else {
    lines.push("", "💬 *Solicito confirmación de precios y existencias actuales en tienda.*");
  }

  lines.push("", "Quedo atento(a) a su respuesta. ¡Muchas gracias!");

  return `https://wa.me/${BUSINESS_INFO.whatsappRaw}?text=${encodeURIComponent(lines.join("\n"))}`;
}

export function buildQuickCartWhatsAppUrl(cart: CartItem[], total: number): string {
  const lines: string[] = [
    `¡Hola! Me gustaría consultar los siguientes productos de *${BUSINESS_INFO.name}*:`,
    "",
  ];
  cart.forEach((item, idx) => {
    const unitPrice = item.product.promoPrice ?? item.product.price;
    const sub =
      unitPrice !== null && unitPrice !== undefined
        ? formatMXN(unitPrice * item.quantity)
        : "Precio por confirmar";
    lines.push(`${idx + 1}. ${item.product.name} ${item.product.subtitle} (x${item.quantity}) - ${sub}`);
  });
  if (total > 0) {
    lines.push("", `*Total:* ${formatMXN(total)}`);
  }
  return `https://wa.me/${BUSINESS_INFO.whatsappRaw}?text=${encodeURIComponent(lines.join("\n"))}`;
}
