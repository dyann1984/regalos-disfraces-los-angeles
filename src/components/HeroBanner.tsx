"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  ShoppingCart,
  Truck,
  CreditCard,
  CheckCircle2,
  Gift,
  PhoneCall,
  Star,
  Sparkles,
} from "lucide-react";
import { BUSINESS_INFO, INITIAL_BANNERS } from "@/data/mockCatalog";
import { getDirectWhatsAppUrl } from "@/lib/whatsapp";
import { useStore } from "@/context/StoreContext";
import { GoldenSparklesField } from "@/components/BrandDetails";

export default function HeroBanner() {
  const { banners } = useStore();
  const shouldReduceMotion = useReducedMotion();
  const activeBanners = banners.filter((b) => b.active);
  const slides = activeBanners.length > 0 ? activeBanners : INITIAL_BANNERS;
  const [activeSlide, setActiveSlide] = useState(0);
  const [parallax, setParallax] = useState({ x: 0, y: 0 });

  const prevSlide = () => {
    setActiveSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  const nextSlide = () => {
    setActiveSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
  };

  const handleBannerMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (shouldReduceMotion) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const normX = (e.clientX - rect.left) / rect.width - 0.5;
    const normY = (e.clientY - rect.top) / rect.height - 0.5;
    setParallax({
      x: Number((normX * 16).toFixed(2)),
      y: Number((normY * 12).toFixed(2)),
    });
  };

  const handleBannerMouseLeave = () => {
    if (parallax.x !== 0 || parallax.y !== 0) {
      setParallax({ x: 0, y: 0 });
    }
  };

  const slide = slides[activeSlide] || slides[0];
  const resolvedCtaHref =
    !slide.ctaTarget || slide.ctaTarget === "#catalogo-principal"
      ? "/catalogo"
      : slide.ctaTarget;

  return (
    <section aria-label="Promociones principales" className="w-full">
      {/* Contenedor del Banner Principal Premium con movimiento suave, parallax y destellos dorados */}
      <div
        onMouseMove={handleBannerMouseMove}
        onMouseLeave={handleBannerMouseLeave}
        className="relative w-full bg-gradient-to-r from-[#FCE4EC] via-[#F8BBD0]/75 to-[#FCE4EC] overflow-hidden border-b border-pink-200/80"
      >
        {/* Orbes luminosos animados que aportan profundidad visual */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-16 left-[10%] w-72 h-72 rounded-full bg-white/75 blur-3xl animate-aura-drift"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-20 right-[12%] w-80 h-80 rounded-full bg-[#F48FB1]/35 blur-3xl animate-aura-drift"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-1/4 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full bg-[#FDE68A]/35 blur-3xl animate-gold-orb"
        />

        {/* Cinta superior decorativa de marca con destello dorado */}
        <div
          aria-hidden="true"
          className="h-1.5 w-full bg-gradient-to-r from-pink-200 via-[#F59E0B]/70 to-pink-200"
        />

        {/* Campo de destellos dorados animados */}
        <GoldenSparklesField />

        <div className="relative max-w-[1320px] mx-auto px-4 sm:px-10 py-6 md:py-9">
          <div className="grid grid-cols-1 lg:grid-cols-12 items-center gap-6">
            {/* Columna Izquierda: Logotipo Oficial con flotación suave y profundidad */}
            <motion.div
              initial={{ opacity: 0, x: -28, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              style={
                !shouldReduceMotion
                  ? {
                      transform: `translate3d(${parallax.x * -0.45}px, ${parallax.y * -0.45}px, 0)`,
                      transition: "transform 0.25s ease-out",
                    }
                  : undefined
              }
              className="lg:col-span-3 flex justify-center"
            >
              <div className="animate-float-slow w-full flex justify-center">
                <div className="card-boutique-3d group relative bg-white/95 backdrop-blur-sm p-3.5 rounded-3xl shadow-boutique border-2 border-white max-w-[290px] w-full flex items-center justify-center">
                  <div className="card-sheen-overlay rounded-3xl" />
                  <span
                    aria-hidden="true"
                    className="absolute -top-2.5 -right-2.5 w-8 h-8 rounded-full bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-300 flex items-center justify-center shadow-goldGlow animate-twinkle z-10"
                  >
                    <Star className="w-4 h-4 text-[#F59E0B] fill-[#FBBF24]" />
                  </span>
                  <span
                    aria-hidden="true"
                    className="absolute -bottom-2 -left-2 w-7 h-7 rounded-full bg-gradient-to-br from-pink-50 to-amber-50 border border-amber-200 flex items-center justify-center shadow-sm animate-twinkle-delayed z-10"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#F59E0B]" />
                  </span>
                  <div className="overflow-hidden rounded-2xl w-full">
                    <img
                      src="/images/logo-banner.jpg"
                      alt="Regalos, Disfraces y Más — Los Ángeles"
                      className="img-zoom-smooth w-full h-auto object-contain rounded-2xl"
                    />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Columna Central: Mensaje Principal en Poppins con transición suave entre promociones */}
            <div className="lg:col-span-4 text-center lg:text-left flex flex-col items-center lg:items-start justify-center px-2 lg:border-l lg:border-pink-300/60 lg:pl-6 min-h-[225px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={slide.id}
                  initial={{ opacity: 0, y: 18, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -14, scale: 0.98 }}
                  transition={{ duration: 0.38, ease: "easeOut" }}
                  className="flex flex-col items-center lg:items-start"
                >
                  <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/95 border border-amber-300/80 text-[#AD1457] text-xs font-bold mb-3 shadow-goldGlow">
                    <Sparkles className="w-3.5 h-3.5 text-[#F59E0B] animate-twinkle" />
                    <span>{slide.badge}</span>
                    <Star className="w-3 h-3 text-[#F59E0B] fill-[#FBBF24] animate-twinkle-delayed" />
                  </div>

                  <h1 className="text-2xl sm:text-3xl xl:text-[32px] font-extrabold tracking-tight leading-[1.18] text-[#6A1B4D]">
                    <span className="block">{slide.titleLine1}</span>
                    <span className="block text-[#D81B60] mt-0.5">{slide.titleLine2}</span>
                  </h1>

                  <p className="mt-3 text-xs sm:text-sm text-[#4A1936] font-normal max-w-md leading-relaxed">
                    {slide.subtitle}
                  </p>

                  <div className="mt-5 flex flex-wrap items-center justify-center lg:justify-start gap-3">
                    <Link
                      href={resolvedCtaHref}
                      className="btn-shimmer inline-flex items-center gap-2.5 bg-gradient-to-r from-[#E91E63] via-[#D81B60] to-[#AD1457] text-white font-bold text-sm sm:text-base px-6 py-3.5 rounded-full shadow-boutique"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      <span>{slide.ctaText}</span>
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Columna Derecha: Fotografía Oficial con movimiento flotante, parallax y zoom suave */}
            <motion.div
              initial={{ opacity: 0, x: 28, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={{ duration: 0.65, ease: "easeOut", delay: 0.08 }}
              style={
                !shouldReduceMotion
                  ? {
                      transform: `translate3d(${parallax.x * 0.65}px, ${parallax.y * 0.65}px, 0)`,
                      transition: "transform 0.25s ease-out",
                    }
                  : undefined
              }
              className="lg:col-span-5 flex justify-center"
            >
              <div className="animate-float-reverse w-full flex justify-center">
                <div className="card-boutique-3d group relative rounded-3xl overflow-hidden shadow-boutiqueHover border-2 border-white bg-white/90 max-w-[490px] w-full">
                  <div className="card-sheen-overlay z-10" />
                  <span
                    aria-hidden="true"
                    className="absolute top-3 right-3 z-20 inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/95 backdrop-blur-sm border border-amber-300 text-[11px] font-extrabold text-[#880E4F] shadow-goldGlow"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#F59E0B] animate-twinkle" />
                    <span>Detalles mágicos</span>
                  </span>
                  <img
                    src={slide.imageUrl || "/images/hero-gifts.jpg"}
                    alt="Oso de peluche, arreglo de rosas, globos de feliz cumpleaños y cajas de regalo"
                    className="img-zoom-smooth w-full h-auto object-cover"
                  />
                </div>
              </div>
            </motion.div>
          </div>

          {/* Flechas laterales de carrusel */}
          <motion.button
            type="button"
            whileHover={{ scale: 1.12 }}
            whileTap={{ scale: 0.92 }}
            onClick={prevSlide}
            aria-label="Promoción anterior"
            className="hidden sm:flex absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/95 hover:bg-white text-[#880E4F] shadow-md border border-pink-100 items-center justify-center transition"
          >
            <ChevronLeft className="w-5 h-5" />
          </motion.button>
          <motion.button
            type="button"
            whileHover={{ scale: 1.12 }}
            whileTap={{ scale: 0.92 }}
            onClick={nextSlide}
            aria-label="Siguiente promoción"
            className="hidden sm:flex absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/95 hover:bg-white text-[#880E4F] shadow-md border border-pink-100 items-center justify-center transition"
          >
            <ChevronRight className="w-5 h-5" />
          </motion.button>

          {/* Indicadores de carrusel */}
          <div className="mt-5 flex items-center justify-center gap-2">
            {slides.map((s, idx) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setActiveSlide(idx)}
                aria-label={`Ir a diapositiva ${idx + 1}`}
                className={`h-2.5 rounded-full transition-all duration-300 ${
                  activeSlide === idx
                    ? "w-8 bg-gradient-to-r from-[#E91E63] to-[#F59E0B] shadow-sm"
                    : "w-2.5 bg-pink-300 hover:bg-pink-400"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Barra de Beneficios y Ventajas Comerciales */}
      <div className="bg-gradient-to-r from-[#FDF2F7] via-white to-[#FDF2F7] border-b border-pink-100 shadow-sm">
        <div className="max-w-[1320px] mx-auto px-4 sm:px-6 py-3">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 items-center text-xs sm:text-sm font-semibold text-[#5A2244]">
            <div className="flex items-center justify-center gap-2.5 py-1 md:border-r md:border-pink-200/80 px-2">
              <Truck className="w-5 h-5 text-[#D81B60] shrink-0" />
              <span>Tienda y entrega local</span>
            </div>

            <div className="flex items-center justify-center gap-2.5 py-1 md:border-r md:border-pink-200/80 px-2">
              <CreditCard className="w-5 h-5 text-[#D81B60] shrink-0" />
              <span className="leading-tight">
                Compras seguras
                <span className="block text-[11px] font-normal text-gray-600">y confiables</span>
              </span>
            </div>

            <div className="flex items-center justify-center gap-2.5 py-1 md:border-r md:border-pink-200/80 px-2">
              <CheckCircle2 className="w-5 h-5 text-[#D81B60] shrink-0" />
              <span>Productos de calidad</span>
            </div>

            <div className="flex items-center justify-center gap-2.5 py-1 md:border-r md:border-pink-200/80 px-2">
              <Gift className="w-5 h-5 text-[#D81B60] shrink-0" />
              <span>Sorpresas para la familia</span>
            </div>

            <a
              href={getDirectWhatsAppUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="col-span-2 md:col-span-1 flex items-center justify-center gap-2.5 py-1 px-2 hover:text-[#1DA851] transition"
            >
              <span className="w-7 h-7 rounded-full bg-[#25D366] text-white flex items-center justify-center shrink-0 shadow-sm">
                <PhoneCall className="w-4 h-4" />
              </span>
              <div className="leading-tight">
                <span className="block text-[11px] font-normal text-gray-600">
                  Atención por WhatsApp
                </span>
                <span className="text-sm font-bold text-[#4A1936]">
                  {BUSINESS_INFO.whatsappDisplay}
                </span>
              </div>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
