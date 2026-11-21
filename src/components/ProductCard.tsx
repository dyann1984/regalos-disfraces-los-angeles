"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Heart,
  ShoppingCart,
  Eye,
  Check,
  PhoneCall,
  Share2,
  Images,
  Ban,
} from "lucide-react";
import { Product } from "@/types/store";
import { useStore } from "@/context/StoreContext";
import {
  formatMXN,
  getDirectWhatsAppUrl,
  getProductShareUrl,
} from "@/lib/whatsapp";

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
  const {
    cart,
    addToCart,
    toggleFavorite,
    isFavorite,
    setActiveProductModal,
    showToast,
  } = useStore();
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
  const isOutOfStock =
    !isReferenceProduct && product.stock !== null && product.stock <= 0;
  const inCartQty = cart
    .filter((item) => item.product.id === product.id)
    .reduce((sum, item) => sum + item.quantity, 0);
  const isAtMaxStock =
    !isReferenceProduct &&
    !isOutOfStock &&
    product.stock !== null &&
    inCartQty >= product.stock;

  const productHref = `/producto/${encodeURIComponent(
    product.slug || product.id
  )}`;

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    if (!canHover3D || shouldReduceMotion) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({
      rotateX: Number((-y * 6.5).toFixed(2)),
      rotateY: Number((x * 6.5).toFixed(2)),
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
    if (isReferenceProduct || isOutOfStock || isAtMaxStock) return;
    addToCart(product, 1);
    setJustAdded(true);
    setTimeout(() => {
      setJustAdded(false);
    }, 1150);
  };

  const handleShareProduct = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = getProductShareUrl(product);
    const priceText =
      effectivePrice !== null && effectivePrice > 0
        ? ` — ${formatMXN(effectivePrice)}`
        : "";
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: `${product.name} | Regalos, Disfraces y Más — Los Ángeles`,
          text: `${product.name}${priceText}`,
          url,
        });
        return;
      } catch {
        // Usuario canceló o navegador no permitió share nativo; copiar enlace
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      showToast("¡Enlace del producto copiado para compartir!", "success");
    } catch {
      showToast(url, "info");
    }
  };

  const staggerDelay = shouldReduceMotion ? 0 : (index % 6) * 0.05;

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 14, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      whileHover={
        !shouldReduceMotion && canHover3D ? { y: -7, scale: 1.015 } : undefined
      }
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
      className={`card-boutique-3d group relative bg-white rounded-2xl border shadow-card flex flex-col justify-between overflow-hidden p-3 ${
        isOutOfStock ? "border-gray-200" : "border-pink-200/85"
      }`}
    >
      <div className="card-sheen-overlay z-10" />

      {/* Área de fotografía completa sin recorte ni deformación (object-contain) */}
      <div>
        <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-gradient-to-b from-[#FFF9FB] to-[#FDF2F7] border border-pink-100/80 flex items-center justify-center p-2">
          <AnimatePresence mode="wait">
            <motion.img
              key={product.images[activeImageIndex] || product.images[0]}
              src={product.images[activeImageIndex] || product.images[0]}
              alt={`${product.name} ${product.subtitle}`}
              loading="lazy"
              initial={{ opacity: 0.85 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0.85 }}
              transition={{ duration: 0.2 }}
              onClick={() => setActiveProductModal(product)}
              className={`img-zoom-smooth w-full h-full object-contain cursor-pointer transition-all ${
                isOutOfStock ? "opacity-65 grayscale-[35%]" : ""
              }`}
            />
          </AnimatePresence>

          {/* Sello visual prominente de AGOTADO */}
          {isOutOfStock && (
            <div
              aria-label="Producto agotado"
              className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none bg-black/15"
            >
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-rose-700/95 text-white text-xs font-extrabold uppercase tracking-wider shadow-lg ring-2 ring-white/90">
                <Ban className="w-3.5 h-3.5" />
                <span>Agotado</span>
              </span>
            </div>
          )}

          {/* Etiqueta superior izquierda */}
          {!isOutOfStock && product.badge && (
            <span
              className={`absolute top-2 left-2 z-20 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold shadow-md ${
                BADGE_STYLES[product.badge.variant].bg
              }`}
            >
              <span>{BADGE_STYLES[product.badge.variant].icon}</span>
              <span>{product.badge.text}</span>
            </span>
          )}

          {/* Botones superiores derechos: Favorito y Compartir */}
          <div className="absolute top-2 right-2 z-20 flex flex-col gap-1.5">
            <motion.button
              type="button"
              whileHover={{ scale: 1.12 }}
              whileTap={{ scale: 0.85 }}
              onClick={() => toggleFavorite(product.id)}
              aria-label={fav ? "Quitar de favoritos" : "Agregar a favoritos"}
              className={`w-8 h-8 rounded-full flex items-center justify-center shadow-md transition-colors ${
                fav
                  ? "bg-gradient-to-br from-[#E91E63] to-[#C2185B] text-white ring-2 ring-white"
                  : "bg-white/95 text-[#D81B60] hover:bg-pink-50"
              }`}
            >
              <Heart className={`w-4 h-4 ${fav ? "fill-current" : ""}`} />
            </motion.button>

            <motion.button
              type="button"
              whileHover={{ scale: 1.12 }}
              whileTap={{ scale: 0.85 }}
              onClick={handleShareProduct}
              aria-label={`Compartir ${product.name}`}
              title="Compartir producto"
              className="w-8 h-8 rounded-full bg-white/95 text-[#6A1B4D] hover:text-[#D81B60] hover:bg-pink-50 flex items-center justify-center shadow-md transition-colors"
            >
              <Share2 className="w-3.5 h-3.5" />
            </motion.button>
          </div>

          {/* Barra inferior sobre imagen: contador de fotos + vista rápida */}
          <div className="absolute bottom-2 left-2 right-2 z-20 flex items-center justify-between gap-1 pointer-events-none">
            {isReferenceProduct ? (
              <span className="bg-[#6A1B4D]/85 backdrop-blur-sm text-white text-[9.5px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md">
                Referencia
              </span>
            ) : product.images.length > 1 ? (
              <span className="inline-flex items-center gap-1 bg-white/95 text-[#6A1B4D] text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm border border-pink-100">
                <Images className="w-3 h-3 text-[#D81B60]" />
                <span>{product.images.length}</span>
              </span>
            ) : (
              <span />
            )}

            <button
              type="button"
              onClick={() => setActiveProductModal(product)}
              className="pointer-events-auto ml-auto bg-white/95 text-[#6A1B4D] hover:text-[#D81B60] text-[11px] font-bold px-2.5 py-1 rounded-full shadow border border-pink-100 flex items-center gap-1 transition"
            >
              <Eye className="w-3 h-3" />
              <span>Ver</span>
            </button>
          </div>
        </div>

        {/* Información del producto */}
        <div className="mt-3 px-0.5">
          <Link
            href={productHref}
            className="block text-sm sm:text-[14px] font-bold text-gray-800 group-hover:text-[#D81B60] leading-snug transition line-clamp-2"
          >
            {product.name}
          </Link>
          {product.subtitle && (
            <p className="text-xs font-medium text-gray-500 leading-tight mt-0.5 line-clamp-1">
              {product.subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Precio, disponibilidad y acción principal */}
      <div className="mt-3 pt-2 border-t border-pink-100/80 px-0.5 relative z-20 space-y-2">
        <div className="flex flex-wrap items-baseline justify-between gap-1">
          {!isReferenceProduct &&
          effectivePrice !== null &&
          effectivePrice !== undefined ? (
            <div className="flex items-baseline gap-1.5">
              <span
                className={`text-base sm:text-[17px] font-extrabold ${
                  isOutOfStock ? "text-gray-400" : "text-[#C2185B]"
                }`}
              >
                {formatMXN(effectivePrice)}
              </span>
              {product.promoPrice && product.price !== null && (
                <span className="text-[11px] text-gray-400 line-through font-medium">
                  ${product.price.toFixed(0)}
                </span>
              )}
            </div>
          ) : (
            <span className="text-[11px] leading-tight font-bold text-[#880E4F] bg-pink-50 px-2.5 py-1 rounded-xl border border-pink-200/80 block w-full text-center">
              Producto de referencia — Consulta disponibilidad
            </span>
          )}

          {!isReferenceProduct && !isOutOfStock && product.stock !== null && (
            <span
              className={`text-[10.5px] font-bold px-2 py-0.5 rounded-full ${
                product.stock <= 2
                  ? "bg-amber-50 text-amber-800 border border-amber-200"
                  : "bg-emerald-50 text-emerald-700 border border-emerald-200"
              }`}
            >
              {product.stock === 1
                ? "Última pieza"
                : `${product.stock} disponibles`}
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
            className="btn-shimmer w-full py-2.5 px-3 rounded-full bg-gradient-to-r from-[#25D366] to-[#1DA851] hover:from-[#1DA851] hover:to-[#128C7E] text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 shadow-sm hover:shadow-md transition-all"
          >
            <PhoneCall className="w-4 h-4 shrink-0" />
            <span>Consultar por WhatsApp</span>
          </motion.a>
        ) : isOutOfStock ? (
          <div className="space-y-1.5">
            <button
              type="button"
              disabled
              className="w-full py-2.5 px-3 rounded-full bg-gray-200 text-gray-600 text-xs sm:text-sm font-extrabold flex items-center justify-center gap-1.5 cursor-not-allowed"
            >
              <Ban className="w-4 h-4" />
              <span>Agotado</span>
            </button>
            <a
              href={getDirectWhatsAppUrl(
                `¡Hola! Vi que "${product.name}" aparece agotado en el catálogo. ¿Sabrán si volverá a llegar?`
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-1.5 px-3 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-[11px] font-bold flex items-center justify-center gap-1.5 transition"
            >
              <PhoneCall className="w-3.5 h-3.5 text-[#25D366]" />
              <span>Preguntar por WhatsApp</span>
            </a>
          </div>
        ) : (
          <motion.button
            type="button"
            whileTap={{ scale: 0.96 }}
            onClick={handleAddToCart}
            disabled={isAtMaxStock}
            className={`btn-shimmer w-full py-2.5 px-3 rounded-full text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 shadow-sm hover:shadow-md transition-all ${
              justAdded
                ? "bg-gradient-to-r from-emerald-500 to-emerald-600"
                : isAtMaxStock
                ? "bg-pink-400 cursor-not-allowed"
                : "bg-gradient-to-r from-[#EC407A] via-[#D81B60] to-[#C2185B] hover:from-[#D81B60] hover:to-[#AD1457]"
            }`}
          >
            <AnimatePresence mode="wait" initial={false}>
              {justAdded ? (
                <motion.span
                  key="added"
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.85 }}
                  className="inline-flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>¡Agregado!</span>
                </motion.span>
              ) : isAtMaxStock ? (
                <motion.span
                  key="max"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="inline-flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Máximo en carrito ({inCartQty})</span>
                </motion.span>
              ) : (
                <motion.span
                  key="default"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="inline-flex items-center gap-1.5"
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>Agregar al carrito</span>
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        )}
      </div>
    </motion.article>
  );
}
