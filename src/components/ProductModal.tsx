"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ShoppingCart, Heart, Check, AlertCircle, PhoneCall } from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { formatMXN, getDirectWhatsAppUrl } from "@/lib/whatsapp";

export default function ProductModal() {
  const {
    activeProductModal: product,
    setActiveProductModal,
    addToCart,
    toggleFavorite,
    isFavorite,
  } = useStore();

  const [quantity, setQuantity] = useState(1);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
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

  const handleAdd = () => {
    if (!product || isReferenceProduct) return;
    addToCart(product, quantity, selectedVariants);
    setActiveProductModal(null);
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ type: "spring", stiffness: 330, damping: 26 }}
            onClick={(e) => e.stopPropagation()}
            className="relative bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-pink-200 p-5 sm:p-7"
          >
            {/* Botón cerrar */}
            <motion.button
              type="button"
              whileTap={{ scale: 0.9 }}
              onClick={() => setActiveProductModal(null)}
              aria-label="Cerrar ventana de producto"
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-pink-50 hover:bg-pink-100 text-[#6A1B4D] flex items-center justify-center transition"
            >
              <X className="w-5 h-5" />
            </motion.button>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              {/* Imagen grande y miniaturas */}
              <div className="space-y-3">
                <div className="relative aspect-square rounded-2xl overflow-hidden bg-[#FDF2F7] border border-pink-100 shadow-inner">
                  <img
                    src={product.images[activePhotoIdx] || product.images[0]}
                    alt={`${product.name} ${product.subtitle}`}
                    className="w-full h-full object-cover"
                  />
                  {isReferenceProduct && (
                    <span className="absolute bottom-3 left-3 bg-[#6A1B4D]/85 text-white text-[10px] font-semibold px-2.5 py-1 rounded-full">
                      Producto de referencia — Consulta disponibilidad
                    </span>
                  )}
                </div>

                {product.images.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {product.images.map((imgUrl, idx) => (
                      <button
                        key={`${imgUrl}-${idx}`}
                        type="button"
                        onClick={() => setActivePhotoIdx(idx)}
                        className={`w-14 h-14 rounded-xl overflow-hidden border-2 shrink-0 transition ${
                          activePhotoIdx === idx
                            ? "border-[#D81B60] scale-105"
                            : "border-pink-100 opacity-75 hover:opacity-100"
                        }`}
                      >
                        <img
                          src={imgUrl}
                          alt={`Miniatura ${idx + 1}`}
                          className="w-full h-full object-cover"
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
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-[#D81B60]">
                    Regalos, Disfraces y Más — Los Ángeles
                  </span>
                  <h2
                    id="modal-product-title"
                    className="text-xl sm:text-2xl font-extrabold text-gray-900 mt-0.5"
                  >
                    {product.name}{" "}
                    <span className="text-gray-600 font-semibold text-lg">{product.subtitle}</span>
                  </h2>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {!isReferenceProduct && basePrice !== null ? (
                    <>
                      <span className="text-xl font-extrabold text-[#C2185B]">
                        {formatMXN(basePrice)}
                      </span>
                      {product.promoPrice && product.price !== null && (
                        <span className="text-sm text-gray-400 line-through font-medium">
                          {formatMXN(product.price)}
                        </span>
                      )}
                      <span className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                        <Check className="w-3.5 h-3.5" />
                        {`Disponible (${product.stock} en existencia)`}
                      </span>
                    </>
                  ) : (
                    <span className="text-xs font-extrabold text-[#880E4F] bg-pink-50 px-3 py-1.5 rounded-xl border border-pink-200">
                      Producto de referencia — Consulta disponibilidad
                    </span>
                  )}
                </div>

                <p className="text-sm text-gray-600 leading-relaxed">{product.description}</p>

                {/* Aviso claro de producto de referencia */}
                {isReferenceProduct && (
                  <div className="flex items-start gap-2 bg-amber-50/90 border border-amber-200 rounded-xl p-3 text-xs text-amber-900">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>
                      <strong>Producto de referencia — Consulta disponibilidad:</strong> Los
                      artículos de referencia no se agregan al carrito hasta contar con precio y
                      existencia confirmados. Puedes consultar modelos y existencias actuales
                      directamente por WhatsApp.
                    </span>
                  </div>
                )}

                {/* Variantes (Tamaño, Talla, Modelo) */}
                {product.variants && product.variants.length > 0 && (
                  <div className="space-y-3 pt-1">
                    {product.variants.map((variant) => (
                      <div key={variant.id}>
                        <label className="block text-xs font-bold text-gray-700 mb-1.5">
                          {variant.label}:
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {variant.options.map((opt) => {
                            const active = selectedVariants[variant.label] === opt.value;
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

                {/* Acciones según si es producto de referencia o producto real con precio confirmado */}
                {isReferenceProduct ? (
                  <div className="pt-2 flex items-center gap-3">
                    <a
                      href={getDirectWhatsAppUrl(
                        `¡Hola! Me interesa consultar disponibilidad y precio del producto de referencia "${product.name} ${product.subtitle}".`
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-shimmer flex-1 py-3 px-5 rounded-full bg-gradient-to-r from-[#25D366] to-[#1DA851] hover:from-[#1DA851] hover:to-[#128C7E] text-white text-sm font-bold flex items-center justify-center gap-2 shadow-lg transition"
                    >
                      <PhoneCall className="w-4 h-4" />
                      <span>Consultar por WhatsApp</span>
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
                      <Heart className={`w-5 h-5 ${fav ? "fill-current" : ""}`} />
                    </motion.button>
                  </div>
                ) : (
                  <>
                    <div className="pt-2 flex flex-wrap items-center gap-3">
                      <div className="flex items-center border border-pink-200 rounded-full bg-pink-50/50 px-2 py-1">
                        <button
                          type="button"
                          onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                          className="w-7 h-7 rounded-full text-[#880E4F] font-bold hover:bg-pink-200/60"
                        >
                          -
                        </button>
                        <motion.span
                          key={quantity}
                          initial={{ scale: 0.7 }}
                          animate={{ scale: 1 }}
                          className="w-8 text-center text-sm font-bold text-gray-800"
                        >
                          {quantity}
                        </motion.span>
                        <button
                          type="button"
                          onClick={() => setQuantity((q) => Math.min(maxStock, q + 1))}
                          className="w-7 h-7 rounded-full text-[#880E4F] font-bold hover:bg-pink-200/60"
                        >
                          +
                        </button>
                      </div>

                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.96 }}
                        onClick={handleAdd}
                        disabled={maxStock <= 0}
                        className="btn-shimmer flex-1 py-3 px-5 rounded-full bg-gradient-to-r from-[#E91E63] to-[#C2185B] hover:from-[#D81B60] hover:to-[#AD1457] text-white text-sm font-bold flex items-center justify-center gap-2 shadow-lg transition disabled:opacity-50"
                      >
                        <ShoppingCart className="w-4 h-4" />
                        <span>{maxStock > 0 ? "Agregar al carrito" : "Agotado"}</span>
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
                        <Heart className={`w-5 h-5 ${fav ? "fill-current" : ""}`} />
                      </motion.button>
                    </div>

                    <a
                      href={getDirectWhatsAppUrl(
                        `¡Hola! Me interesa consultar sobre el producto "${product.name} ${product.subtitle}".`
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2.5 px-4 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center justify-center gap-2 transition"
                    >
                      <PhoneCall className="w-4 h-4 text-[#25D366]" />
                      <span>Consultar dudas por WhatsApp</span>
                    </a>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
