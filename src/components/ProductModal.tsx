"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ShoppingCart,
  Heart,
  Check,
  AlertCircle,
  PhoneCall,
  Share2,
  Copy,
  ChevronLeft,
  ChevronRight,
  Ban,
  ExternalLink,
} from "lucide-react";
import { useStore } from "@/context/StoreContext";
import {
  buildProductFacebookShareUrl,
  buildProductWhatsAppShareUrl,
  formatMXN,
  getDirectWhatsAppUrl,
  getProductShareUrl,
} from "@/lib/whatsapp";

export default function ProductModal() {
  const {
    cart,
    activeProductModal: product,
    setActiveProductModal,
    addToCart,
    toggleFavorite,
    isFavorite,
    showToast,
  } = useStore();

  const [quantity, setQuantity] = useState(1);
  const [selectedVariants, setSelectedVariants] = useState<
    Record<string, string>
  >({});
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);

  useEffect(() => {
    if (product) {
      setQuantity(1);
      setActivePhotoIdx(0);
      const initialVars: Record<string, string> = {};
      product.variants?.forEach((v) => {
        if (v.options.length > 0) {
          initialVars[v.label] = v.options[0].value;
        }
      });
      setSelectedVariants(initialVars);
    }
  }, [product]);

  const fav = product ? isFavorite(product.id) : false;
  const basePrice = product ? product.promoPrice ?? product.price : null;
  const isReferenceProduct = Boolean(
    !product ||
      product.isDemo ||
      basePrice === null ||
      basePrice === undefined ||
      basePrice <= 0 ||
      product.stock === null ||
      product.stock === undefined
  );
  const maxStock = product && product.stock !== null ? product.stock : 0;
  const isOutOfStock = !isReferenceProduct && maxStock <= 0;
  const alreadyInCart = product
    ? cart
        .filter((i) => i.product.id === product.id)
        .reduce((sum, i) => sum + i.quantity, 0)
    : 0;
  const remainingStock = Math.max(0, maxStock - alreadyInCart);

  const handleAdd = () => {
    if (!product || isReferenceProduct || isOutOfStock || remainingStock <= 0)
      return;
    addToCart(product, Math.min(quantity, remainingStock), selectedVariants);
    setActiveProductModal(null);
  };

  const handleCopyShareLink = async () => {
    if (!product) return;
    const url = getProductShareUrl(product);
    try {
      await navigator.clipboard.writeText(url);
      showToast("¡Enlace del producto copiado!", "success");
    } catch {
      showToast(url, "info");
    }
  };

  return (
    <AnimatePresence>
      {product && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-product-title"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={() => setActiveProductModal(null)}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/55 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ type: "spring", stiffness: 330, damping: 26 }}
            onClick={(e) => e.stopPropagation()}
            className="relative bg-white rounded-t-3xl sm:rounded-3xl max-w-3xl w-full max-h-[92dvh] overflow-y-auto shadow-2xl border border-pink-200 p-4 sm:p-7"
          >
            {/* Botón cerrar */}
            <motion.button
              type="button"
              whileTap={{ scale: 0.9 }}
              onClick={() => setActiveProductModal(null)}
              aria-label="Cerrar ventana de producto"
              className="absolute top-3.5 right-3.5 z-30 w-9 h-9 rounded-full bg-pink-50 hover:bg-pink-100 text-[#6A1B4D] flex items-center justify-center transition shadow-sm"
            >
              <X className="w-5 h-5" />
            </motion.button>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 items-start">
              {/* Imagen grande sin recorte (object-contain) y galería de miniaturas */}
              <div className="space-y-3">
                <div className="relative aspect-square rounded-2xl overflow-hidden bg-gradient-to-b from-[#FFF9FB] to-[#FDF2F7] border border-pink-100 shadow-inner flex items-center justify-center p-3">
                  <img
                    src={product.images[activePhotoIdx] || product.images[0]}
                    alt={`${product.name} ${product.subtitle}`}
                    className={`w-full h-full object-contain ${
                      isOutOfStock ? "opacity-70 grayscale-[30%]" : ""
                    }`}
                  />

                  {isOutOfStock && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/15 pointer-events-none">
                      <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-rose-700/95 text-white text-xs font-extrabold uppercase tracking-wider shadow-lg ring-2 ring-white">
                        <Ban className="w-4 h-4" />
                        <span>Agotado</span>
                      </span>
                    </div>
                  )}

                  {product.images.length > 1 && (
                    <>
                      <button
                        type="button"
                        aria-label="Fotografía anterior"
                        onClick={() =>
                          setActivePhotoIdx((i) =>
                            i === 0 ? product.images.length - 1 : i - 1
                          )
                        }
                        className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/95 text-[#6A1B4D] shadow flex items-center justify-center hover:bg-pink-50"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        aria-label="Siguiente fotografía"
                        onClick={() =>
                          setActivePhotoIdx((i) =>
                            i === product.images.length - 1 ? 0 : i + 1
                          )
                        }
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/95 text-[#6A1B4D] shadow flex items-center justify-center hover:bg-pink-50"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                      <span className="absolute bottom-2 right-2 bg-[#6A1B4D]/80 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {activePhotoIdx + 1} / {product.images.length}
                      </span>
                    </>
                  )}
                </div>

                {product.images.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {product.images.map((imgUrl, idx) => (
                      <button
                        key={`${imgUrl}-${idx}`}
                        type="button"
                        onClick={() => setActivePhotoIdx(idx)}
                        className={`w-16 h-16 rounded-xl overflow-hidden border-2 shrink-0 bg-[#FFF9FB] p-1 transition ${
                          activePhotoIdx === idx
                            ? "border-[#D81B60] scale-105"
                            : "border-pink-100 opacity-75 hover:opacity-100"
                        }`}
                      >
                        <img
                          src={imgUrl}
                          alt={`Miniatura ${idx + 1}`}
                          className="w-full h-full object-contain"
                        />
                      </button>
                    ))}
                  </div>
                )}

                {product.occasionTags && product.occasionTags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {product.occasionTags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[11px] font-semibold bg-pink-50 text-[#880E4F] px-2.5 py-1 rounded-full border border-pink-200"
                      >
                        ✨ {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Detalles del producto */}
              <div className="space-y-4">
                <div className="pr-8">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#D81B60]">
                    Regalos, Disfraces y Más — Los Ángeles
                  </span>
                  <h2
                    id="modal-product-title"
                    className="text-lg sm:text-2xl font-extrabold text-gray-900 mt-0.5 leading-snug"
                  >
                    {product.name}
                  </h2>
                  {product.subtitle && (
                    <p className="text-sm text-gray-500 font-semibold">
                      {product.subtitle}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  {!isReferenceProduct && basePrice !== null ? (
                    <>
                      <span className="text-2xl font-extrabold text-[#C2185B]">
                        {formatMXN(basePrice)}
                      </span>
                      {product.promoPrice && product.price !== null && (
                        <span className="text-sm text-gray-400 line-through font-medium">
                          {formatMXN(product.price)}
                        </span>
                      )}
                      {isOutOfStock ? (
                        <span className="ml-auto inline-flex items-center gap-1 text-xs font-extrabold text-rose-700 bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
                          <Ban className="w-3.5 h-3.5" />
                          <span>AGOTADO</span>
                        </span>
                      ) : (
                        <span className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                          <Check className="w-3.5 h-3.5" />
                          <span>
                            {maxStock === 1
                              ? "Última pieza disponible"
                              : `Disponible (${maxStock} en existencia)`}
                          </span>
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="text-xs font-extrabold text-[#880E4F] bg-pink-50 px-3 py-1.5 rounded-xl border border-pink-200">
                      Producto de referencia — Consulta disponibilidad
                    </span>
                  )}
                </div>

                <p className="text-sm text-gray-600 leading-relaxed">
                  {product.description}
                </p>

                {isReferenceProduct && (
                  <div className="flex items-start gap-2 bg-amber-50/90 border border-amber-200 rounded-xl p-3 text-xs text-amber-900">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>
                      <strong>Producto de referencia:</strong> Consulta modelos y
                      existencias actuales directamente por WhatsApp.
                    </span>
                  </div>
                )}

                {/* Variantes */}
                {product.variants && product.variants.length > 0 && (
                  <div className="space-y-3 pt-1">
                    {product.variants.map((variant) => (
                      <div key={variant.id}>
                        <label className="block text-xs font-bold text-gray-700 mb-1.5">
                          {variant.label}:
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {variant.options.map((opt) => {
                            const active =
                              selectedVariants[variant.label] === opt.value;
                            return (
                              <button
                                key={opt.value}
                                type="button"
                                onClick={() =>
                                  setSelectedVariants((prev) => ({
                                    ...prev,
                                    [variant.label]: opt.value,
                                  }))
                                }
                                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                                  active
                                    ? "bg-[#D81B60] text-white border-[#D81B60] shadow-sm"
                                    : "bg-white text-gray-700 border-pink-200 hover:bg-pink-50"
                                }`}
                              >
                                {opt.value}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Acciones de compra / consulta */}
                {isReferenceProduct || isOutOfStock ? (
                  <div className="pt-1 flex items-center gap-2.5">
                    <a
                      href={getDirectWhatsAppUrl(
                        isOutOfStock
                          ? `¡Hola! Vi que "${product.name}" aparece agotado en el catálogo. ¿Sabrán si volverá a estar disponible?`
                          : `¡Hola! Me interesa consultar disponibilidad y precio del producto "${product.name} ${product.subtitle}".`
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-shimmer flex-1 py-3 px-5 rounded-full bg-gradient-to-r from-[#25D366] to-[#1DA851] hover:from-[#1DA851] hover:to-[#128C7E] text-white text-sm font-bold flex items-center justify-center gap-2 shadow-lg transition"
                    >
                      <PhoneCall className="w-4 h-4" />
                      <span>
                        {isOutOfStock
                          ? "Consultar reposición por WhatsApp"
                          : "Consultar por WhatsApp"}
                      </span>
                    </a>

                    <motion.button
                      type="button"
                      whileTap={{ scale: 0.9 }}
                      onClick={() => toggleFavorite(product.id)}
                      aria-label="Guardar en favoritos"
                      className={`p-3 rounded-full border transition ${
                        fav
                          ? "bg-[#E91E63] text-white border-[#E91E63]"
                          : "bg-white text-[#D81B60] border-pink-200 hover:bg-pink-50"
                      }`}
                    >
                      <Heart
                        className={`w-5 h-5 ${fav ? "fill-current" : ""}`}
                      />
                    </motion.button>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {remainingStock <= 0 ? (
                      <p className="text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                        Ya tienes las {maxStock} unidad(es) disponibles de este
                        producto en tu carrito.
                      </p>
                    ) : (
                      <div className="pt-1 flex flex-wrap items-center gap-2.5">
                        <div className="flex items-center border border-pink-200 rounded-full bg-pink-50/50 px-2 py-1">
                          <button
                            type="button"
                            onClick={() =>
                              setQuantity((q) => Math.max(1, q - 1))
                            }
                            aria-label="Disminuir cantidad"
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
                              setQuantity((q) =>
                                Math.min(remainingStock, q + 1)
                              )
                            }
                            aria-label="Aumentar cantidad"
                            className="w-8 h-8 rounded-full text-[#880E4F] font-bold hover:bg-pink-200/60 disabled:opacity-40"
                          >
                            +
                          </button>
                        </div>

                        <motion.button
                          type="button"
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.96 }}
                          onClick={handleAdd}
                          className="btn-shimmer flex-1 py-3 px-5 rounded-full bg-gradient-to-r from-[#E91E63] to-[#C2185B] hover:from-[#D81B60] hover:to-[#AD1457] text-white text-sm font-bold flex items-center justify-center gap-2 shadow-lg transition"
                        >
                          <ShoppingCart className="w-4 h-4" />
                          <span>Agregar al carrito</span>
                        </motion.button>

                        <motion.button
                          type="button"
                          whileTap={{ scale: 0.9 }}
                          onClick={() => toggleFavorite(product.id)}
                          aria-label="Guardar en favoritos"
                          className={`p-3 rounded-full border transition ${
                            fav
                              ? "bg-[#E91E63] text-white border-[#E91E63]"
                              : "bg-white text-[#D81B60] border-pink-200 hover:bg-pink-50"
                          }`}
                        >
                          <Heart
                            className={`w-5 h-5 ${fav ? "fill-current" : ""}`}
                          />
                        </motion.button>
                      </div>
                    )}

                    <a
                      href={getDirectWhatsAppUrl(
                        `¡Hola! Me interesa consultar sobre el producto "${product.name}" (${formatMXN(basePrice)}).`
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2.5 px-4 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center justify-center gap-2 transition"
                    >
                      <PhoneCall className="w-4 h-4 text-[#25D366]" />
                      <span>Consultar dudas por WhatsApp</span>
                    </a>
                  </div>
                )}

                {/* Compartir enlace individual por WhatsApp, Facebook o Copiar enlace */}
                <div className="pt-3 border-t border-pink-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-[#6A1B4D] inline-flex items-center gap-1">
                      <Share2 className="w-3.5 h-3.5 text-[#D81B60]" />
                      <span>Compartir este producto:</span>
                    </span>
                    <Link
                      href={`/producto/${encodeURIComponent(
                        product.slug || product.id
                      )}`}
                      onClick={() => setActiveProductModal(null)}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-[#D81B60] hover:underline"
                    >
                      <span>Abrir ficha completa</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <a
                      href={buildProductWhatsAppShareUrl(product)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-2 px-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-[11px] font-bold text-center transition"
                    >
                      WhatsApp
                    </a>
                    <a
                      href={buildProductFacebookShareUrl(product)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-2 px-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-800 text-[11px] font-bold text-center transition"
                    >
                      Facebook
                    </a>
                    <button
                      type="button"
                      onClick={handleCopyShareLink}
                      className="py-2 px-2.5 rounded-xl bg-pink-50 hover:bg-pink-100 border border-pink-200 text-[#6A1B4D] text-[11px] font-bold inline-flex items-center justify-center gap-1 transition"
                    >
                      <Copy className="w-3 h-3 text-[#D81B60]" />
                      <span>Copiar link</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
