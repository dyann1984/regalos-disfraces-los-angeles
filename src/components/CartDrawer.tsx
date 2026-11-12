"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Trash2,
  ShoppingBag,
  PhoneCall,
  CreditCard,
  CheckCircle2,
  Gift,
  Tag,
  MapPin,
  Store,
  AlertCircle,
} from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { buildOrderWhatsAppUrl, formatMXN } from "@/lib/whatsapp";
import { CustomerOrder } from "@/types/store";

export default function CartDrawer() {
  const {
    cart,
    isCartOpen,
    setIsCartOpen,
    removeFromCart,
    updateCartQuantity,
    clearCart,
    cartSubtotal,
    hasUnpricedItemsInCart,
    createOrder,
    orders,
    triggerCelebration,
  } = useStore();

  const [step, setStep] = useState<"cart" | "checkout" | "confirmed" | "history">("cart");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState<"pickup" | "local_delivery">("pickup");
  const [address, setAddress] = useState("");
  const [occasion, setOccasion] = useState("Cumpleaños");
  const [orderNotes, setOrderNotes] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [appliedDiscountRate, setAppliedDiscountRate] = useState(0);
  const [couponFeedback, setCouponFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [lastOrder, setLastOrder] = useState<CustomerOrder | null>(null);

  const discountAmount = cartSubtotal * appliedDiscountRate;
  const finalTotal = Math.max(0, cartSubtotal - discountAmount);

  const handleApplyCoupon = () => {
    const clean = couponCode.trim().toUpperCase();
    if (!clean) {
      setCouponFeedback({ type: "error", text: "Ingresa un código antes de aplicar." });
      return;
    }
    if (clean === "ANGELES10" || clean === "REGALO10") {
      setAppliedDiscountRate(0.1);
      setCouponFeedback({
        type: "success",
        text: "¡Cupón de 10% de descuento aplicado correctamente!",
      });
      triggerCelebration();
    } else {
      setAppliedDiscountRate(0);
      setCouponFeedback({
        type: "error",
        text: "El código ingresado no es válido. Prueba con ANGELES10.",
      });
    }
  };

  const handleConfirmOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !customerPhone.trim()) return;

    const order = await createOrder({
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      deliveryMethod,
      address: deliveryMethod === "local_delivery" ? address.trim() : "Recolección en tienda",
      occasion,
      orderNotes: orderNotes.trim(),
      items: cart,
      subtotal: cartSubtotal,
      discount: discountAmount,
      total: finalTotal,
      paymentMethod: "whatsapp_accord",
    });

    setLastOrder(order);
    clearCart();
    setStep("confirmed");
  };

  return (
    <AnimatePresence>
      {isCartOpen && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="Carrito de compras"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={() => {
            setStep("cart");
            setIsCartOpen(false);
          }}
          className="fixed inset-0 z-50 flex justify-end bg-black/45 backdrop-blur-sm"
        >
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white w-full max-w-md h-full flex flex-col shadow-2xl border-l border-pink-200"
          >
            {/* Encabezado */}
            <div className="px-5 py-4 bg-gradient-to-r from-[#FDF2F7] to-[#FCE4EC] border-b border-pink-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-[#D81B60]" />
                <h2 className="text-base font-bold text-[#6A1B4D]">
                  {step === "cart" && "Tu Carrito de Compras"}
                  {step === "checkout" && "Datos de Contacto y Entrega"}
                  {step === "confirmed" && "¡Pedido Registrado!"}
                  {step === "history" && "Mis Pedidos Recientes"}
                </h2>
              </div>

              <div className="flex items-center gap-2">
                {orders.length > 0 && step !== "history" && (
                  <button
                    type="button"
                    onClick={() => setStep("history")}
                    className="text-[11px] font-semibold text-[#D81B60] hover:underline px-2 py-1 rounded-lg bg-white/80"
                  >
                    Mis pedidos ({orders.length})
                  </button>
                )}
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    setStep("cart");
                    setIsCartOpen(false);
                  }}
                  aria-label="Cerrar carrito"
                  className="w-8 h-8 rounded-full bg-white text-[#6A1B4D] hover:bg-pink-100 flex items-center justify-center transition"
                >
                  <X className="w-4 h-4" />
                </motion.button>
              </div>
            </div>

            {/* Contenido según paso */}
            <div className="flex-1 overflow-y-auto p-5">
              {step === "cart" && (
                <>
                  {cart.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="h-full flex flex-col items-center justify-center text-center py-12"
                    >
                      <div className="w-16 h-16 rounded-full bg-pink-50 flex items-center justify-center text-[#D81B60] mb-3 shadow-inner">
                        <Gift className="w-8 h-8" />
                      </div>
                      <p className="text-base font-bold text-gray-800">
                        Tu carrito está vacío por ahora
                      </p>
                      <p className="text-xs text-gray-500 mt-1 max-w-xs">
                        Descubre peluches, juguetes, disfraces, regalos, artículos para fiestas y
                        accesorios.
                      </p>
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.96 }}
                        onClick={() => setIsCartOpen(false)}
                        className="btn-shimmer mt-5 px-6 py-2.5 rounded-full bg-[#D81B60] text-white text-xs font-bold shadow hover:bg-[#AD1457] transition"
                      >
                        Explorar catálogo
                      </motion.button>
                    </motion.div>
                  ) : (
                    <div className="space-y-4">
                      <AnimatePresence initial={false}>
                        {cart.map((item, idx) => {
                          const unitPrice = item.product.promoPrice ?? item.product.price;
                          return (
                            <motion.div
                              key={`${item.product.id}-${idx}`}
                              layout
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, x: 40 }}
                              className="flex gap-3 p-3 rounded-2xl bg-[#FDF2F7]/60 border border-pink-100"
                            >
                              <img
                                src={item.product.images[0]}
                                alt={item.product.name}
                                className="w-16 h-16 rounded-xl object-cover bg-white border border-pink-100 shrink-0"
                              />
                              <div className="flex-1 min-w-0">
                                <h3 className="text-xs font-bold text-gray-800 truncate">
                                  {item.product.name} {item.product.subtitle}
                                </h3>
                                <p className="text-xs font-extrabold text-[#C2185B] mt-0.5">
                                  {formatMXN(unitPrice)}
                                </p>
                                {item.selectedVariants &&
                                  Object.keys(item.selectedVariants).length > 0 && (
                                    <p className="text-[10px] text-gray-600 mt-0.5">
                                      {Object.entries(item.selectedVariants)
                                        .map(([k, v]) => `${k}: ${v}`)
                                        .join(" | ")}
                                    </p>
                                  )}

                                <div className="mt-2 flex items-center justify-between">
                                  <div className="inline-flex items-center border border-pink-200 rounded-full bg-white px-1.5 py-0.5">
                                    <motion.button
                                      type="button"
                                      whileTap={{ scale: 0.85 }}
                                      onClick={() => updateCartQuantity(idx, item.quantity - 1)}
                                      className="w-5 h-5 text-xs font-bold text-[#880E4F]"
                                    >
                                      -
                                    </motion.button>
                                    <motion.span
                                      key={item.quantity}
                                      initial={{ scale: 0.65, opacity: 0.5 }}
                                      animate={{ scale: 1, opacity: 1 }}
                                      className="px-2 text-xs font-bold"
                                    >
                                      {item.quantity}
                                    </motion.span>
                                    <motion.button
                                      type="button"
                                      whileTap={{ scale: 0.85 }}
                                      onClick={() => updateCartQuantity(idx, item.quantity + 1)}
                                      className="w-5 h-5 text-xs font-bold text-[#880E4F]"
                                    >
                                      +
                                    </motion.button>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => removeFromCart(idx)}
                                    aria-label="Eliminar artículo"
                                    className="text-gray-400 hover:text-rose-600 p-1 transition"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>

                      {/* Cupón de descuento */}
                      <div className="pt-2 border-t border-pink-100">
                        <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                          ¿Tienes un cupón promocional?
                        </label>
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <Tag className="w-3.5 h-3.5 text-pink-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                              type="text"
                              value={couponCode}
                              onChange={(e) => setCouponCode(e.target.value)}
                              placeholder="Código de cupón"
                              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-pink-200 focus:outline-none focus:border-[#D81B60]"
                            />
                          </div>
                          <motion.button
                            type="button"
                            whileTap={{ scale: 0.95 }}
                            onClick={handleApplyCoupon}
                            className="px-3.5 py-1.5 rounded-xl bg-pink-100 hover:bg-pink-200 text-[#880E4F] text-xs font-bold transition"
                          >
                            Aplicar
                          </motion.button>
                        </div>

                        <AnimatePresence mode="wait">
                          {couponFeedback && (
                            <motion.div
                              key={couponFeedback.text}
                              initial={{ opacity: 0, y: -4 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0 }}
                              className={`mt-2 flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1.5 rounded-xl border ${
                                couponFeedback.type === "success"
                                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                  : "bg-rose-50 text-rose-700 border-rose-200"
                              }`}
                            >
                              {couponFeedback.type === "success" ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              ) : (
                                <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                              )}
                              <span>{couponFeedback.text}</span>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  )}
                </>
              )}

              {step === "checkout" && (
                <form id="checkout-form" onSubmit={handleConfirmOrder} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Nombre completo de quien compra *
                    </label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Ej. María Fernanda López"
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-pink-200 focus:outline-none focus:ring-2 focus:ring-[#D81B60]/40"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Teléfono / WhatsApp de contacto *
                    </label>
                    <input
                      type="tel"
                      required
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="Ej. 55 1234 5678"
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-pink-200 focus:outline-none focus:ring-2 focus:ring-[#D81B60]/40"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                      Modalidad de entrega *
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setDeliveryMethod("pickup")}
                        className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition ${
                          deliveryMethod === "pickup"
                            ? "bg-pink-50 border-[#D81B60] text-[#880E4F]"
                            : "border-pink-200 text-gray-600"
                        }`}
                      >
                        <Store className="w-4 h-4 text-[#D81B60] shrink-0" />
                        <div>
                          <span className="block text-xs font-bold">Recoger en tienda</span>
                          <span className="block text-[10px]">Sin costo de envío</span>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeliveryMethod("local_delivery")}
                        className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition ${
                          deliveryMethod === "local_delivery"
                            ? "bg-pink-50 border-[#D81B60] text-[#880E4F]"
                            : "border-pink-200 text-gray-600"
                        }`}
                      >
                        <MapPin className="w-4 h-4 text-[#D81B60] shrink-0" />
                        <div>
                          <span className="block text-xs font-bold">Entrega local</span>
                          <span className="block text-[10px]">Acordar por WhatsApp</span>
                        </div>
                      </button>
                    </div>
                  </div>

                  {deliveryMethod === "local_delivery" && (
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Dirección o colonia de entrega (para consultar cobertura) *
                      </label>
                      <textarea
                        required
                        rows={2}
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Calle, número, colonia y referencias..."
                        className="w-full px-3.5 py-2 text-xs rounded-xl border border-pink-200 focus:outline-none focus:ring-2 focus:ring-[#D81B60]/40"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Ocasión
                    </label>
                    <select
                      value={occasion}
                      onChange={(e) => setOccasion(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-pink-200 bg-white focus:outline-none"
                    >
                      <option value="Cumpleaños">🎂 Cumpleaños</option>
                      <option value="Aniversario">💖 Aniversario / Obsequio</option>
                      <option value="Fiesta o Disfraz">🎭 Fiesta Temática / Disfraz</option>
                      <option value="Juguete / Sorpresa">🧸 Juguete / Sorpresa</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Comentarios adicionales sobre tu pedido (opcional)
                    </label>
                    <textarea
                      rows={2}
                      value={orderNotes}
                      onChange={(e) => setOrderNotes(e.target.value)}
                      placeholder="Ej. Horario en que pasaré a recoger o dudas sobre tallas..."
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-pink-200 focus:outline-none focus:ring-2 focus:ring-[#D81B60]/40"
                    />
                  </div>

                  <div className="p-3 rounded-2xl bg-sky-50 border border-sky-200 text-[11px] text-sky-900 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold">
                      <CreditCard className="w-4 h-4 text-sky-600" />
                      <span>Pasarela Mercado Pago (Modo Prueba / Desactivado)</span>
                    </div>
                    <p>
                      Los cobros en línea están desactivados por seguridad hasta finalizar la carga
                      de inventario oficial. Tu pedido se enviará por WhatsApp para confirmar
                      existencias y pago directo.
                    </p>
                  </div>
                </form>
              )}

              {step === "confirmed" && lastOrder && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-6 space-y-4"
                >
                  <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-sm">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-extrabold text-gray-900">
                    ¡Solicitud {lastOrder.id} lista!
                  </h3>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Haz clic en el botón inferior para enviar el resumen de tus artículos al
                    WhatsApp oficial de <strong>Regalos, Disfraces y Más — Los Ángeles</strong>.
                  </p>

                  <div className="bg-[#FDF2F7] p-3.5 rounded-2xl border border-pink-200 text-left text-xs space-y-1">
                    <p>
                      <strong>Cliente:</strong> {lastOrder.customerName}
                    </p>
                    <p>
                      <strong>Entrega:</strong>{" "}
                      {lastOrder.deliveryMethod === "pickup"
                        ? "Recolección en tienda"
                        : lastOrder.address}
                    </p>
                    <p>
                      <strong>Estado de precios:</strong>{" "}
                      <span className="text-[#C2185B] font-extrabold">
                        {lastOrder.total > 0
                          ? formatMXN(lastOrder.total)
                          : "Por confirmar en tienda vía WhatsApp"}
                      </span>
                    </p>
                  </div>

                  <motion.a
                    href={buildOrderWhatsAppUrl(lastOrder)}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    className="btn-shimmer w-full py-3.5 px-5 rounded-full bg-[#25D366] hover:bg-[#1DA851] text-white text-sm font-bold flex items-center justify-center gap-2 shadow-lg transition"
                  >
                    <PhoneCall className="w-4 h-4" />
                    <span>Enviar Pedido por WhatsApp (5635478874)</span>
                  </motion.a>

                  <button
                    type="button"
                    onClick={() => {
                      setStep("cart");
                      setIsCartOpen(false);
                    }}
                    className="text-xs font-bold text-[#D81B60] hover:underline block mx-auto pt-2"
                  >
                    Volver a la tienda
                  </button>
                </motion.div>
              )}

              {step === "history" && (
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => setStep("cart")}
                    className="text-xs font-bold text-[#D81B60] hover:underline mb-2"
                  >
                    ← Volver al carrito
                  </button>
                  {orders.map((ord) => (
                    <div
                      key={ord.id}
                      className="p-3.5 rounded-2xl border border-pink-200 bg-pink-50/40 space-y-1.5 text-xs"
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-[#6A1B4D]">{ord.id}</span>
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold uppercase">
                          {ord.status.replace("_", " ")}
                        </span>
                      </div>
                      <p className="text-gray-600">
                        {new Date(ord.createdAt).toLocaleDateString("es-MX")} • {ord.items.length}{" "}
                        artículo(s)
                      </p>
                      <div className="flex items-center justify-between pt-1">
                        <span className="font-extrabold text-[#C2185B]">
                          {ord.total > 0 ? formatMXN(ord.total) : "Precio por confirmar"}
                        </span>
                        <a
                          href={buildOrderWhatsAppUrl(ord)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] font-bold text-[#1DA851] hover:underline"
                        >
                          Reenviar a WhatsApp →
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Pie del Carrito */}
            {cart.length > 0 && (step === "cart" || step === "checkout") && (
              <div className="p-4 bg-[#FDF2F7] border-t border-pink-200 space-y-3">
                <div className="space-y-1 text-xs">
                  {cartSubtotal > 0 ? (
                    <>
                      <div className="flex justify-between text-gray-600">
                        <span>Subtotal:</span>
                        <span className="font-bold">{formatMXN(cartSubtotal)}</span>
                      </div>
                      {discountAmount > 0 && (
                        <div className="flex justify-between text-emerald-700">
                          <span>Descuento cupón:</span>
                          <span className="font-bold">-{formatMXN(discountAmount)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm font-extrabold text-[#6A1B4D] pt-1 border-t border-pink-200">
                        <span>Total estimado:</span>
                        <motion.span
                          key={finalTotal}
                          initial={{ scale: 0.92 }}
                          animate={{ scale: 1 }}
                          className="text-[#C2185B]"
                        >
                          {formatMXN(finalTotal)}
                        </motion.span>
                      </div>
                    </>
                  ) : null}

                  {hasUnpricedItemsInCart && (
                    <p className="text-[11px] text-[#6A1B4D] font-medium bg-white/80 p-2 rounded-xl border border-pink-200">
                      ℹ️ Los precios y existencias de los artículos de muestra se confirmarán
                      directamente por WhatsApp.
                    </p>
                  )}
                </div>

                {step === "cart" ? (
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setStep("checkout")}
                    className="btn-shimmer w-full py-3 rounded-full bg-gradient-to-r from-[#E91E63] to-[#C2185B] hover:from-[#D81B60] hover:to-[#AD1457] text-white text-xs sm:text-sm font-bold shadow-md transition"
                  >
                    Continuar con datos de entrega →
                  </motion.button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setStep("cart")}
                      className="px-4 py-2.5 rounded-full border border-pink-300 text-[#6A1B4D] text-xs font-bold bg-white"
                    >
                      Atrás
                    </button>
                    <motion.button
                      type="submit"
                      form="checkout-form"
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      className="btn-shimmer flex-1 py-2.5 rounded-full bg-[#25D366] hover:bg-[#1DA851] text-white text-xs sm:text-sm font-bold shadow-md transition flex items-center justify-center gap-1.5"
                    >
                      <PhoneCall className="w-4 h-4" />
                      <span>Confirmar y enviar por WhatsApp</span>
                    </motion.button>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
