"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ShoppingCart,
  Heart,
  PhoneCall,
  Share2,
  Copy,
  Check,
  Ban,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";
import FavoritesDrawer from "@/components/FavoritesDrawer";
import FloatingWhatsApp from "@/components/FloatingWhatsApp";
import { useStore } from "@/context/StoreContext";
import { Product } from "@/types/store";
import {
  buildProductFacebookShareUrl,
  buildProductWhatsAppShareUrl,
  formatMXN,
  getDirectWhatsAppUrl,
  getProductShareUrl,
} from "@/lib/whatsapp";

export default function ProductDetailClient({
  initialProduct,
  slugOrId,
}: {
  initialProduct: Product | null;
  slugOrId: string;
}) {
  const {
    products,
    cart,
    addToCart,
    toggleFavorite,
    isFavorite,
    showToast,
    toastMessage,
    toastVariant,
  } = useStore();

  const liveMatch =
    products.find(
      (p) => p.active && (p.slug === slugOrId || p.id === slugOrId)
    ) || initialProduct;

  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const [quantity, setQuantity] = useState(1);

  if (!liveMatch) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 max-w-3xl mx-auto px-4 py-14 text-center space-y-4">
          <h1 className="text-xl font-extrabold text-[#6A1B4D]">
            Producto no disponible actualmente
          </h1>
          <p className="text-sm text-gray-600">
            Es posible que este artículo haya sido retirado o agotado. Explora
            nuestro catálogo actualizado para ver más opciones.
          </p>
          <Link
            href="/catalogo"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#D81B60] text-white text-sm font-bold shadow"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Ver catálogo completo</span>
          </Link>
        </main>
        <Footer />
        <CartDrawer />
        <FavoritesDrawer />
        <FloatingWhatsApp />
      </div>
    );
  }

  const product = liveMatch;
  const fav = isFavorite(product.id);
  const effectivePrice = product.promoPrice ?? product.price;
  const isOutOfStock = product.stock !== null && product.stock <= 0;
  const maxStock = product.stock !== null ? product.stock : 0;
  const alreadyInCart = cart
    .filter((i) => i.product.id === product.id)
    .reduce((sum, i) => sum + i.quantity, 0);
  const remainingStock = Math.max(0, maxStock - alreadyInCart);

  const handleCopyLink = async () => {
    const url = getProductShareUrl(product);
    try {
      await navigator.clipboard.writeText(url);
      showToast("¡Enlace copiado para compartir!", "success");
    } catch {
      showToast(url, "info");
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            key={toastMessage}
            role="status"
            aria-live="polite"
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className={`fixed top-20 right-4 z-50 text-white text-xs sm:text-sm font-semibold px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-2 ${
              toastVariant === "error"
                ? "bg-rose-700 border-rose-400"
                : toastVariant === "info"
                ? "bg-[#5A2244] border-pink-300"
                : "bg-[#6A1B4D] border-amber-300"
            }`}
          >
            {toastVariant === "error" ? (
              <AlertCircle className="w-4 h-4 text-rose-200 shrink-0" />
            ) : toastVariant === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
            ) : (
              <Sparkles className="w-4 h-4 text-[#FDE68A] shrink-0" />
            )}
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <Header />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        <div className="flex items-center justify-between gap-2">
          <Link
            href="/catalogo"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white border border-pink-200 text-[#D81B60] text-xs font-bold shadow-sm hover:bg-pink-50 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Volver al catálogo</span>
          </Link>
        </div>

        <div className="bg-white rounded-3xl border border-pink-200 shadow-boutique p-4 sm:p-7 grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 items-start">
          {/* Galería de fotos sin recorte (object-contain) */}
          <div className="space-y-3">
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-gradient-to-b from-[#FFF9FB] to-[#FDF2F7] border border-pink-100 flex items-center justify-center p-3">
              <img
                src={product.images[activePhotoIdx] || product.images[0]}
                alt={product.name}
                className={`w-full h-full object-contain ${
                  isOutOfStock ? "opacity-70 grayscale-[35%]" : ""
                }`}
              />

              {isOutOfStock && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/15 pointer-events-none">
                  <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-rose-700/95 text-white text-sm font-extrabold uppercase tracking-wider shadow-lg ring-2 ring-white">
                    <Ban className="w-4 h-4" />
                    <span>Agotado</span>
                  </span>
                </div>
              )}

              {product.images.length > 1 && (
                <>
                  <button
                    type="button"
                    aria-label="Foto anterior"
                    onClick={() =>
                      setActivePhotoIdx((i) =>
                        i === 0 ? product.images.length - 1 : i - 1
                      )
                    }
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/95 text-[#6A1B4D] shadow flex items-center justify-center"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    aria-label="Foto siguiente"
                    onClick={() =>
                      setActivePhotoIdx((i) =>
                        i === product.images.length - 1 ? 0 : i + 1
                      )
                    }
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/95 text-[#6A1B4D] shadow flex items-center justify-center"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>

            {product.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {product.images.map((url, idx) => (
                  <button
                    key={`${url}-${idx}`}
                    type="button"
                    onClick={() => setActivePhotoIdx(idx)}
                    className={`w-16 h-16 rounded-xl overflow-hidden border-2 bg-[#FFF9FB] p-1 shrink-0 ${
                      activePhotoIdx === idx
                        ? "border-[#D81B60]"
                        : "border-pink-100 opacity-75"
                    }`}
                  >
                    <img
                      src={url}
                      alt={`${product.name} vista ${idx + 1}`}
                      className="w-full h-full object-contain"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Información comercial, inventario y compartir */}
          <div className="space-y-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#D81B60]">
                Regalos, Disfraces y Más — Los Ángeles
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-1 leading-tight">
                {product.name}
              </h1>
              {product.subtitle && (
                <p className="text-sm font-semibold text-gray-500 mt-0.5">
                  {product.subtitle}
                </p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <span className="text-2xl sm:text-3xl font-extrabold text-[#C2185B]">
                {formatMXN(effectivePrice)}
              </span>
              {isOutOfStock ? (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-extrabold">
                  <Ban className="w-3.5 h-3.5" />
                  <span>AGOTADO</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
                  <Check className="w-3.5 h-3.5" />
                  <span>
                    {maxStock === 1
                      ? "Última pieza disponible"
                      : `${maxStock} en existencia`}
                  </span>
                </span>
              )}
            </div>

            <p className="text-sm text-gray-600 leading-relaxed">
              {product.description}
            </p>

            {isOutOfStock ? (
              <div className="space-y-2.5 pt-2">
                <button
                  type="button"
                  disabled
                  className="w-full py-3.5 rounded-full bg-gray-200 text-gray-600 text-sm font-extrabold cursor-not-allowed"
                >
                  Producto Agotado
                </button>
                <a
                  href={getDirectWhatsAppUrl(
                    `¡Hola! Vi "${product.name}" en la tienda y aparece agotado. ¿Tienen fecha de reposición?`
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-shimmer w-full py-3 px-5 rounded-full bg-gradient-to-r from-[#25D366] to-[#1DA851] text-white text-sm font-bold flex items-center justify-center gap-2 shadow"
                >
                  <PhoneCall className="w-4 h-4" />
                  <span>Consultar disponibilidad por WhatsApp</span>
                </a>
              </div>
            ) : (
              <div className="space-y-3 pt-2">
                {remainingStock > 0 ? (
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center border border-pink-200 rounded-full bg-pink-50/50 px-2 py-1">
                      <button
                        type="button"
                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                        className="w-8 h-8 rounded-full text-[#880E4F] font-bold hover:bg-pink-200/60"
                      >
                        -
                      </button>
                      <span className="w-8 text-center text-sm font-bold text-gray-800">
                        {Math.min(quantity, remainingStock)}
                      </span>
                      <button
                        type="button"
                        disabled={quantity >= remainingStock}
                        onClick={() =>
                          setQuantity((q) => Math.min(remainingStock, q + 1))
                        }
                        className="w-8 h-8 rounded-full text-[#880E4F] font-bold hover:bg-pink-200/60 disabled:opacity-40"
                      >
                        +
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        addToCart(product, Math.min(quantity, remainingStock))
                      }
                      className="btn-shimmer flex-1 py-3.5 px-5 rounded-full bg-gradient-to-r from-[#E91E63] to-[#C2185B] text-white text-sm font-bold flex items-center justify-center gap-2 shadow-lg"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      <span>Agregar al carrito</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => toggleFavorite(product.id)}
                      aria-label="Guardar en favoritos"
                      className={`p-3.5 rounded-full border transition ${
                        fav
                          ? "bg-[#E91E63] text-white border-[#E91E63]"
                          : "bg-white text-[#D81B60] border-pink-200 hover:bg-pink-50"
                      }`}
                    >
                      <Heart
                        className={`w-5 h-5 ${fav ? "fill-current" : ""}`}
                      />
                    </button>
                  </div>
                ) : (
                  <p className="text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 rounded-xl p-3">
                    Ya agregaste la cantidad máxima disponible ({maxStock} ud.)
                    a tu carrito.
                  </p>
                )}

                <a
                  href={getDirectWhatsAppUrl(
                    `¡Hola! Quiero pedir o consultar sobre "${product.name}" (${formatMXN(effectivePrice)}).`
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 px-4 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition"
                >
                  <PhoneCall className="w-4 h-4 text-[#25D366]" />
                  <span>Preguntar por WhatsApp (5635478874)</span>
                </a>
              </div>
            )}

            {/* Compartir producto por WhatsApp, Facebook o Enlace directo */}
            <div className="pt-4 border-t border-pink-100 space-y-2.5">
              <p className="text-xs font-extrabold text-[#6A1B4D] inline-flex items-center gap-1.5">
                <Share2 className="w-4 h-4 text-[#D81B60]" />
                <span>Compartir este producto</span>
              </p>
              <div className="grid grid-cols-3 gap-2">
                <a
                  href={buildProductWhatsAppShareUrl(product)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2.5 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-bold text-center transition"
                >
                  WhatsApp
                </a>
                <a
                  href={buildProductFacebookShareUrl(product)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2.5 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-800 text-xs font-bold text-center transition"
                >
                  Facebook
                </a>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="py-2.5 px-3 rounded-xl bg-pink-50 hover:bg-pink-100 border border-pink-200 text-[#6A1B4D] text-xs font-bold inline-flex items-center justify-center gap-1.5 transition"
                >
                  <Copy className="w-3.5 h-3.5 text-[#D81B60]" />
                  <span>Copiar link</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
      <CartDrawer />
      <FavoritesDrawer />
      <FloatingWhatsApp />
    </div>
  );
}
