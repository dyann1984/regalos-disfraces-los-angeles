"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Heart, ShoppingCart, PhoneCall, Sparkles } from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { formatMXN, getDirectWhatsAppUrl } from "@/lib/whatsapp";

export default function FavoritesDrawer() {
  const {
    products,
    favorites,
    isFavoritesOpen,
    setIsFavoritesOpen,
    toggleFavorite,
    addToCart,
  } = useStore();

  const favProducts = products.filter((p) => favorites.includes(p.id));

  return (
    <AnimatePresence>
      {isFavoritesOpen && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="Lista de deseos y favoritos"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.24, ease: "easeOut" }}
          onClick={() => setIsFavoritesOpen(false)}
          className="fixed inset-0 z-50 flex justify-end bg-black/45 backdrop-blur-sm"
        >
          <motion.div
            initial={{ x: "100%", opacity: 0.7 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0.7 }}
            transition={{ type: "spring", stiffness: 310, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white w-full max-w-md h-full flex flex-col shadow-2xl border-l border-pink-200"
          >
            <div className="px-5 py-4 bg-gradient-to-r from-[#FDF2F7] via-[#FCEBF3] to-[#FCE4EC] border-b border-pink-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <motion.span
                  animate={{ scale: [1, 1.18, 1] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Heart className="w-5 h-5 text-[#E91E63] fill-current" />
                </motion.span>
                <h2 className="text-base font-bold text-[#6A1B4D]">
                  Mis Favoritos ({favProducts.length})
                </h2>
                <Sparkles className="w-4 h-4 text-[#F59E0B] animate-twinkle" />
              </div>
              <motion.button
                type="button"
                whileHover={{ scale: 1.08, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsFavoritesOpen(false)}
                aria-label="Cerrar favoritos"
                className="w-8 h-8 rounded-full bg-white text-[#6A1B4D] hover:bg-pink-100 flex items-center justify-center shadow-sm transition"
              >
                <X className="w-4 h-4" />
              </motion.button>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              {favProducts.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35 }}
                  className="h-full flex flex-col items-center justify-center text-center py-12"
                >
                  <div className="w-16 h-16 rounded-full bg-pink-50 border border-pink-200/80 flex items-center justify-center mb-3 shadow-inner animate-float-slow">
                    <Heart className="w-8 h-8 text-[#E91E63]" />
                  </div>
                  <p className="text-sm font-bold text-gray-800">
                    Aún no tienes productos favoritos
                  </p>
                  <p className="text-xs text-gray-500 mt-1 max-w-xs">
                    Toca el corazón ♡ en cualquier producto para guardarlo en tu lista de deseos.
                  </p>
                </motion.div>
              ) : (
                <div className="space-y-3">
                  <AnimatePresence initial={false}>
                    {favProducts.map((product, idx) => {
                      const effectivePrice = product.promoPrice ?? product.price;
                      const isRef = Boolean(
                        product.isDemo ||
                          effectivePrice === null ||
                          effectivePrice === undefined ||
                          effectivePrice <= 0 ||
                          product.stock === null ||
                          product.stock === undefined
                      );

                      return (
                        <motion.div
                          key={product.id}
                          layout
                          initial={{ opacity: 0, x: 24, scale: 0.96 }}
                          animate={{ opacity: 1, x: 0, scale: 1 }}
                          exit={{ opacity: 0, x: 48, scale: 0.92 }}
                          transition={{
                            type: "spring",
                            stiffness: 320,
                            damping: 24,
                            delay: idx * 0.04,
                          }}
                          className="group flex items-center gap-3 p-3 rounded-2xl bg-[#FDF2F7]/75 hover:bg-[#FDF2F7] border border-pink-200/80 shadow-sm transition"
                        >
                          <div className="w-16 h-16 rounded-xl overflow-hidden bg-white border border-pink-100 shrink-0">
                            <img
                              src={product.images[0]}
                              alt={product.name}
                              className="img-zoom-smooth w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-xs font-bold text-gray-800 truncate">
                              {product.name} {product.subtitle}
                            </h3>
                            <p className="text-[11px] font-extrabold text-[#C2185B] mt-0.5">
                              {!isRef && effectivePrice
                                ? formatMXN(effectivePrice)
                                : "Producto de referencia — Consulta disponibilidad"}
                            </p>
                            <div className="mt-2 flex items-center gap-2">
                              {isRef ? (
                                <a
                                  href={getDirectWhatsAppUrl(
                                    `¡Hola! Guardé en mis favoritos el artículo "${product.name} ${product.subtitle}" y me gustaría consultar su disponibilidad.`
                                  )}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="btn-shimmer px-3 py-1 rounded-full bg-[#25D366] text-white text-[11px] font-bold inline-flex items-center gap-1 shadow-sm"
                                >
                                  <PhoneCall className="w-3 h-3" />
                                  <span>Consultar</span>
                                </a>
                              ) : (
                                <motion.button
                                  type="button"
                                  whileTap={{ scale: 0.94 }}
                                  onClick={() => {
                                    addToCart(product, 1);
                                    setIsFavoritesOpen(false);
                                  }}
                                  className="btn-shimmer px-3 py-1 rounded-full bg-[#D81B60] text-white text-[11px] font-bold flex items-center gap-1 shadow-sm"
                                >
                                  <ShoppingCart className="w-3 h-3" />
                                  <span>Agregar</span>
                                </motion.button>
                              )}
                              <button
                                type="button"
                                onClick={() => toggleFavorite(product.id)}
                                className="text-[11px] text-gray-500 hover:text-rose-600 font-semibold transition"
                              >
                                Quitar
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
