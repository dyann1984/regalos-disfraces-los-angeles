"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Heart, ShoppingCart } from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { formatMXN } from "@/lib/whatsapp";

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
          transition={{ duration: 0.2 }}
          onClick={() => setIsFavoritesOpen(false)}
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
            <div className="px-5 py-4 bg-gradient-to-r from-[#FDF2F7] to-[#FCE4EC] border-b border-pink-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-[#E91E63] fill-current" />
                <h2 className="text-base font-bold text-[#6A1B4D]">
                  Mis Favoritos ({favProducts.length})
                </h2>
              </div>
              <motion.button
                type="button"
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsFavoritesOpen(false)}
                aria-label="Cerrar favoritos"
                className="w-8 h-8 rounded-full bg-white text-[#6A1B4D] hover:bg-pink-100 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </motion.button>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              {favProducts.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-12">
                  <Heart className="w-12 h-12 text-pink-300 mb-3" />
                  <p className="text-sm font-bold text-gray-800">
                    Aún no tienes productos favoritos
                  </p>
                  <p className="text-xs text-gray-500 mt-1 max-w-xs">
                    Toca el corazón ♡ en cualquier producto para guardarlo en tu lista de deseos.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <AnimatePresence initial={false}>
                    {favProducts.map((product) => (
                      <motion.div
                        key={product.id}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: 40 }}
                        className="flex items-center gap-3 p-3 rounded-2xl bg-[#FDF2F7]/60 border border-pink-100"
                      >
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="w-16 h-16 rounded-xl object-cover bg-white border border-pink-100 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="text-xs font-bold text-gray-800 truncate">
                            {product.name} {product.subtitle}
                          </h3>
                          <p className="text-xs font-extrabold text-[#C2185B] mt-0.5">
                            {formatMXN(product.promoPrice ?? product.price)}
                          </p>
                          <div className="mt-2 flex items-center gap-2">
                            <motion.button
                              type="button"
                              whileTap={{ scale: 0.94 }}
                              onClick={() => {
                                addToCart(product, 1);
                                setIsFavoritesOpen(false);
                              }}
                              className="px-3 py-1 rounded-full bg-[#D81B60] text-white text-[11px] font-bold flex items-center gap-1"
                            >
                              <ShoppingCart className="w-3 h-3" />
                              <span>Agregar</span>
                            </motion.button>
                            <button
                              type="button"
                              onClick={() => toggleFavorite(product.id)}
                              className="text-[11px] text-gray-500 hover:text-rose-600 font-semibold"
                            >
                              Quitar
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
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
