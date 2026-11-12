"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Heart, ShoppingCart, Eye, Check, PhoneCall } from "lucide-react";
import { Product } from "@/types/store";
import { useStore } from "@/context/StoreContext";
import { formatMXN, getDirectWhatsAppUrl } from "@/lib/whatsapp";

const BADGE_STYLES: Record<
  NonNullable<Product["badge"]>["variant"],
  { bg: string; icon: string }
> = {
  bestseller: {
    bg: "bg-gradient-to-r from-[#D81B60] to-[#EC407A] text-white",
    icon: "★",
  },
  new: {
    bg: "bg-gradient-to-r from-[#C2185B] to-[#E91E63] text-white",
    icon: "♥",
  },
  toy: {
    bg: "bg-gradient-to-r from-[#FDE68A] to-[#FCD34D] text-[#78350F] border border-amber-300",
    icon: "🧸",
  },
  costume: {
    bg: "bg-gradient-to-r from-[#8E24AA] to-[#BA68C8] text-white",
    icon: "🎭",
  },
  special: {
    bg: "bg-gradient-to-r from-[#D81B60] to-[#F06292] text-white",
    icon: "🎁",
  },
  promo: {
    bg: "bg-gradient-to-r from-[#E11D48] to-[#FB7185] text-white",
    icon: "✨",
  },
};

export default function ProductCard({
  product,
  index = 0,
}: {
  product: Product;
  index?: number;
}) {
  const { addToCart, toggleFavorite, isFavorite, setActiveProductModal } = useStore();
  const shouldReduceMotion = useReducedMotion();

  const [canHover3D, setCanHover3D] = useState(false);
  const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0 });
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [justAdded, setJustAdded] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia) {
      const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
      setCanHover3D(mq.matches);
    }
  }, []);

  const fav = isFavorite(product.id);
  const effectivePrice = product.promoPrice ?? product.price;
  const isReferenceProduct = Boolean(
    product.isDemo ||
      effectivePrice === null ||
      effectivePrice === undefined ||
      effectivePrice <= 0 ||
      product.stock === null ||
      product.stock === undefined
  );
  const isOutOfStock = !isReferenceProduct && product.stock !== null && product.stock <= 0;

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    if (!canHover3D || shouldReduceMotion) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({
      rotateX: Number((-y * 8.5).toFixed(2)),
      rotateY: Number((x * 8.5).toFixed(2)),
    });
  };

  const handleMouseLeave = () => {
    if (tilt.rotateX !== 0 || tilt.rotateY !== 0) {
      setTilt({ rotateX: 0, rotateY: 0 });
    }
    if (product.images.length > 1) {
      setActiveImageIndex(0);
    }
  };

  const handleMouseEnter = () => {
    if (product.images.length > 1) {
      setActiveImageIndex(1);
    }
  };

  const handleAddToCart = () => {
    if (isReferenceProduct) return;
    addToCart(product, 1);
    setJustAdded(true);
    setTimeout(() => {
      setJustAdded(false);
    }, 1150);
  };

  const staggerDelay = shouldReduceMotion ? 0 : (index % 6) * 0.065;

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 26, scale: 0.94 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-25px" }}
      whileHover={!shouldReduceMotion && canHover3D ? { y: -9, scale: 1.02 } : undefined}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={
        canHover3D && !shouldReduceMotion
          ? {
              transformPerspective: 950,
              rotateX: tilt.rotateX,
              rotateY: tilt.rotateY,
            }
          : undefined
      }
      transition={{
        type: "spring",
        stiffness: 260,
        damping: 22,
        delay: staggerDelay,
      }}
      className="card-boutique-3d group relative bg-white rounded-2xl border border-pink-200/80 shadow-card flex flex-col justify-between overflow-hidden p-2.5"
    >
      <div className="card-sheen-overlay z-10" />

      {/* Área de fotografía con zoom suave controlado y etiquetas superpuestas */}
      <div>
        <div className="relative w-full aspect-[4/3.4] rounded-xl overflow-hidden bg-[#FDF2F7]">
          <AnimatePresence mode="wait">
            <motion.img
              key={product.images[activeImageIndex] || product.images[0]}
              src={product.images[activeImageIndex] || product.images[0]}
              alt={`${product.name} ${product.subtitle}`}
              initial={{ opacity: 0.85 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0.85 }}
              transition={{ duration: 0.25 }}
              onClick={() => setActiveProductModal(product)}
              className="img-zoom-smooth w-full h-full object-cover cursor-pointer"
            />
          </AnimatePresence>

          {/* Etiqueta superior izquierda */}
          {product.badge && (
            <span
              className={`absolute top-1.5 left-1.5 z-20 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold shadow-md ${
                BADGE_STYLES[product.badge.variant].bg
              }`}
            >
              <span>{BADGE_STYLES[product.badge.variant].icon}</span>
              <span>{product.badge.text}</span>
            </span>
          )}

          {/* Botón de Favorito superior derecho con animación fluida */}
          <motion.button
            type="button"
            whileHover={{ scale: 1.14 }}
            whileTap={{ scale: 0.82 }}
            onClick={() => toggleFavorite(product.id)}
            aria-label={fav ? "Quitar de favoritos" : "Agregar a favoritos"}
            className={`absolute top-1.5 right-1.5 z-20 w-8 h-8 rounded-full flex items-center justify-center shadow-md transition-colors ${
              fav
                ? "bg-gradient-to-br from-[#E91E63] to-[#C2185B] text-white ring-2 ring-white"
                : "bg-white/95 text-[#D81B60] hover:bg-pink-50"
            }`}
          >
            <motion.span
              key={fav ? "fav-on" : "fav-off"}
              initial={{ scale: 0.6 }}
              animate={{ scale: [1, 1.32, 1] }}
              transition={{ duration: 0.3 }}
            >
              <Heart className={`w-4 h-4 ${fav ? "fill-current" : ""}`} />
            </motion.span>
          </motion.button>

          {/* Indicador de producto de referencia + Vista rápida */}
          <div className="absolute bottom-1.5 left-1.5 right-1.5 z-20 flex items-center justify-between pointer-events-none">
            {isReferenceProduct && (
              <span
                title="Producto de referencia — Consulta disponibilidad"
                className="bg-[#6A1B4D]/85 backdrop-blur-sm text-white text-[9px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md"
              >
                Referencia
              </span>
            )}
            <button
              type="button"
              onClick={() => setActiveProductModal(product)}
              className="pointer-events-auto ml-auto opacity-95 sm:opacity-0 group-hover:opacity-100 bg-white/95 text-[#6A1B4D] hover:text-[#D81B60] text-[10px] font-bold px-2.5 py-1 rounded-full shadow flex items-center gap-1 transition-all duration-200 group-hover:translate-y-0 translate-y-1"
            >
              <Eye className="w-3 h-3" />
              <span>Detalles</span>
            </button>
          </div>
        </div>

        {/* Información del producto en tipografía Poppins */}
        <div className="mt-2.5 px-1">
          <h3
            onClick={() => setActiveProductModal(product)}
            className="text-xs sm:text-[13.5px] font-bold text-gray-800 group-hover:text-[#D81B60] leading-snug cursor-pointer transition line-clamp-1"
          >
            {product.name}
          </h3>
          <p className="text-[11.5px] font-medium text-gray-600 leading-tight mt-0.5 line-clamp-1">
            {product.subtitle}
          </p>
        </div>
      </div>

      {/* Estado de precio / referencia y Acción Principal */}
      <div className="mt-2.5 pt-1 px-1 relative z-20">
        <div className="flex items-baseline justify-center gap-1.5 mb-2 text-center">
          {!isReferenceProduct && effectivePrice !== null && effectivePrice !== undefined ? (
            <>
              <span className="text-sm sm:text-[16px] font-extrabold text-[#C2185B]">
                {formatMXN(effectivePrice)}
              </span>
              {product.promoPrice && product.price !== null && (
                <span className="text-[10px] text-gray-400 line-through font-medium">
                  ${product.price.toFixed(0)}
                </span>
              )}
            </>
          ) : (
            <span className="text-[10.5px] leading-tight font-bold text-[#880E4F] bg-pink-50 px-2.5 py-1 rounded-xl border border-pink-200/80 block w-full">
              Producto de referencia — Consulta disponibilidad
            </span>
          )}
        </div>

        {isReferenceProduct ? (
          <motion.a
            href={getDirectWhatsAppUrl(
              `¡Hola! Vi en el catálogo de Regalos, Disfraces y Más — Los Ángeles el producto "${product.name} ${product.subtitle}" y me gustaría consultar su disponibilidad y precio.`
            )}
            target="_blank"
            rel="noopener noreferrer"
            whileTap={{ scale: 0.96 }}
            className="btn-shimmer w-full py-2 px-3 rounded-full bg-gradient-to-r from-[#25D366] to-[#1DA851] hover:from-[#1DA851] hover:to-[#128C7E] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm hover:shadow-md transition-all duration-200"
          >
            <PhoneCall className="w-3.5 h-3.5 shrink-0" />
            <span>Consultar por WhatsApp</span>
          </motion.a>
        ) : (
          <motion.button
            type="button"
            whileTap={{ scale: 0.95 }}
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className={`btn-shimmer w-full py-2 px-3 rounded-full text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm hover:shadow-md transition-all duration-200 ${
              justAdded
                ? "bg-gradient-to-r from-emerald-500 to-emerald-600"
                : "bg-gradient-to-r from-[#EC407A] via-[#D81B60] to-[#C2185B] hover:from-[#D81B60] hover:to-[#AD1457]"
            } disabled:opacity-50`}
          >
            <AnimatePresence mode="wait" initial={false}>
              {justAdded ? (
                <motion.span
                  key="added"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="inline-flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>¡Agregado!</span>
                </motion.span>
              ) : (
                <motion.span
                  key="default"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="inline-flex items-center gap-1.5"
                >
                  <ShoppingCart className="w-3.5 h-3.5" />
                  <span>{!isOutOfStock ? "Agregar al carrito" : "Agotado"}</span>
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        )}
      </div>
    </motion.article>
  );
}
