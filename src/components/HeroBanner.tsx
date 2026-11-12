"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
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
  Heart,
} from "lucide-react";
import { BUSINESS_INFO, INITIAL_BANNERS } from "@/data/mockCatalog";
import { getDirectWhatsAppUrl } from "@/lib/whatsapp";
import { useStore } from "@/context/StoreContext";

export default function HeroBanner() {
  const { banners } = useStore();
  const activeBanners = banners.filter((b) => b.active);
  const slides = activeBanners.length > 0 ? activeBanners : INITIAL_BANNERS;
  const [activeSlide, setActiveSlide] = useState(0);

  const prevSlide = () => {
    setActiveSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  const nextSlide = () => {
    setActiveSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
  };

  const slide = slides[activeSlide] || slides[0];
  const resolvedCtaHref =
    !slide.ctaTarget || slide.ctaTarget === "#catalogo-principal"
      ? "/catalogo"
      : slide.ctaTarget;

  return (
    <section aria-label="Promociones principales" className="w-full">
      {/* Contenedor del Banner Principal Premium con capas de profundidad */}
      <div className="relative w-full bg-gradient-to-r from-[#FCE4EC] via-[#F8BBD0]/65 to-[#FCE4EC] overflow-hidden border-b border-pink-200/80">
        {/* Capas de luz y profundidad */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_28%,rgba(255,255,255,0.92),transparent_42%),radial-gradient(circle_at_82%_48%,rgba(244,143,177,0.34),transparent_48%),radial-gradient(circle_at_50%_15%,rgba(253,230,138,0.25),transparent_38%)]"
        />

        {/* Cinta superior decorativa de marca */}
        <div
          aria-hidden="true"
          className="h-1 w-full bg-gradient-to-r from-pink-200 via-[#F59E0B]/45 to-pink-200"
        />

        {/* Estrellas doradas y corazones decorativos muy discretos */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
          <Star className="w-4 h-4 text-[#F59E0B] fill-[#F59E0B] absolute top-5 left-[31%] animate-twinkle" />
          <Sparkles className="w-4 h-4 text-[#F59E0B]/80 absolute bottom-7 left-[34%] animate-twinkle-delayed" />
          <Heart className="w-3.5 h-3.5 text-[#D81B60]/45 fill-[#F48FB1]/45 absolute top-8 left-[55%] animate-twinkle-delayed" />
          <Star className="w-3.5 h-3.5 text-[#F59E0B] fill-[#F59E0B] absolute top-6 right-[8%] animate-twinkle" />
        </div>

        <div className="relative max-w-[1320px] mx-auto px-4 sm:px-10 py-6 md:py-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 items-center gap-6">
            {/* Columna Izquierda: Logotipo Oficial con Caja de Regalo y Alas */}
            <motion.div
              initial={{ opacity: 0, x: -22 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="lg:col-span-3 flex justify-center"
            >
              <motion.div
                whileHover={{ y: -4, scale: 1.015 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
                className="relative bg-white/90 backdrop-blur-sm p-3 rounded-3xl shadow-boutique border border-white max-w-[290px] w-full flex items-center justify-center"
              >
                <span
                  aria-hidden="true"
                  className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center shadow-sm"
                >
                  <Star className="w-3.5 h-3.5 text-[#F59E0B] fill-[#F59E0B]" />
                </span>
                <img
                  src="/images/logo-banner.jpg"
                  alt="Regalos, Disfraces y Más — Los Ángeles"
                  className="w-full h-auto object-contain rounded-2xl"
                />
              </motion.div>
            </motion.div>

            {/* Columna Central: Mensaje Principal en Poppins con transición suave entre promociones */}
            <div className="lg:col-span-4 text-center lg:text-left flex flex-col items-center lg:items-start justify-center px-2 lg:border-l lg:border-pink-300/60 lg:pl-6 min-h-[215px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={slide.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="flex flex-col items-center lg:items-start"
                >
                  <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/90 border border-pink-200/90 text-[#AD1457] text-xs font-semibold mb-3 shadow-sm">
                    <Sparkles className="w-3.5 h-3.5 text-[#F59E0B]" />
                    <span>{slide.badge}</span>
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
                      className="btn-shimmer inline-flex items-center gap-2.5 bg-gradient-to-r from-[#E91E63] via-[#D81B60] to-[#AD1457] text-white font-bold text-sm sm:text-base px-6 py-3 rounded-full shadow-boutique hover:shadow-boutiqueHover hover:-translate-y-0.5 transition"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      <span>{slide.ctaText}</span>
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Columna Derecha: Fotografía Oficial con efecto de profundidad */}
            <motion.div
              initial={{ opacity: 0, x: 22 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.55, ease: "easeOut", delay: 0.08 }}
              className="lg:col-span-5 flex justify-center"
            >
              <motion.div
                whileHover={{ y: -4, scale: 1.01 }}
                transition={{ type: "spring", stiffness: 240, damping: 20 }}
                className="relative rounded-3xl overflow-hidden shadow-boutiqueHover border-2 border-white bg-white/85 max-w-[490px] w-full group"
              >
                <img
                  src={slide.imageUrl || "/images/hero-gifts.jpg"}
                  alt="Oso de peluche, arreglo de rosas, globos de feliz cumpleaños y cajas de regalo"
                  className="w-full h-auto object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                />
              </motion.div>
            </motion.div>
          </div>

          {/* Flechas laterales de carrusel */}
          <motion.button
            type="button"
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            onClick={prevSlide}
            aria-label="Promoción anterior"
            className="hidden sm:flex absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/95 hover:bg-white text-[#880E4F] shadow-md border border-pink-100 items-center justify-center transition"
          >
            <ChevronLeft className="w-5 h-5" />
          </motion.button>
          <motion.button
            type="button"
            whileHover={{ scale: 1.08 }}
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
                    ? "w-7 bg-[#D81B60] shadow-sm"
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
