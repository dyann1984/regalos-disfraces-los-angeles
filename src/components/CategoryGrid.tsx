"use client";

import React from "react";
import Link from "next/link";
import { motion, Variants, useReducedMotion } from "framer-motion";
import { Check, ChevronRight, Sparkles } from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { BoutiqueSectionHeading } from "@/components/BrandDetails";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.085,
      delayChildren: 0.05,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 26, scale: 0.92 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 260, damping: 20 },
  },
};

export default function CategoryGrid() {
  const { categories, selectedCategory, setSelectedCategory } = useStore();
  const shouldReduceMotion = useReducedMotion();

  return (
    <section
      id="categorias"
      aria-labelledby="titulo-categorias"
      className="max-w-[1320px] mx-auto px-4 sm:px-6 pt-8 pb-4"
    >
      {/* Encabezado con estrellas doradas animadas y tipografía Poppins */}
      <div className="mb-6">
        <BoutiqueSectionHeading
          id="titulo-categorias"
          title="Nuestras Categorías"
          badgeText="Explora por departamento"
        />
      </div>

      {/* Grid de 6 Categorías Prioritarias con aparición progresiva y elevación 3D */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-35px" }}
        className="relative grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 sm:gap-4"
      >
        {categories
          .filter((c) => c.active)
          .sort((a, b) => a.order - b.order)
          .map((cat) => {
            const isSelected = selectedCategory === cat.slug;
            return (
              <motion.div
                key={cat.id}
                variants={itemVariants}
                whileHover={
                  !shouldReduceMotion
                    ? { y: -9, rotateZ: -0.8, scale: 1.03 }
                    : undefined
                }
                whileTap={{ scale: 0.96 }}
                transition={{ type: "spring", stiffness: 320, damping: 20 }}
              >
                <Link
                  href={`/catalogo?categoria=${encodeURIComponent(cat.slug)}`}
                  onClick={() => setSelectedCategory(cat.slug)}
                  className={`card-boutique-3d group relative h-full flex flex-col items-center justify-between rounded-2xl p-3 sm:p-3.5 border text-center overflow-hidden ${
                    isSelected
                      ? "bg-gradient-to-b from-[#F8BBD0] to-[#F48FB1] border-[#D81B60] shadow-boutiqueHover"
                      : "bg-gradient-to-b from-[#FDE8F1] to-[#FADCE9] hover:from-[#FADCE9] hover:to-[#F7C6DB] border-pink-200/90 shadow-card"
                  }`}
                >
                  <div className="card-sheen-overlay" />

                  <span
                    aria-hidden="true"
                    className="absolute top-2 right-2 opacity-65 group-hover:opacity-100 transition-opacity z-10"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#F59E0B] animate-twinkle" />
                  </span>

                  {isSelected && (
                    <span className="absolute -top-2 -right-2 z-20 w-6 h-6 rounded-full bg-[#D81B60] text-white flex items-center justify-center shadow-md border-2 border-white">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </span>
                  )}

                  <div className="w-full aspect-[4/3] rounded-xl overflow-hidden bg-white/90 flex items-center justify-center p-1.5 shadow-inner border border-white/70">
                    <img
                      src={cat.image}
                      alt={cat.name}
                      className="img-zoom-smooth w-full h-full object-contain"
                    />
                  </div>
                  <span
                    className={`mt-2.5 text-xs sm:text-sm font-bold leading-tight transition-colors ${
                      isSelected ? "text-[#6A1B4D]" : "text-[#4A1936] group-hover:text-[#D81B60]"
                    }`}
                  >
                    {cat.shortName}
                  </span>
                  <span className="mt-1 inline-flex items-center gap-0.5 text-[10px] font-bold text-[#D81B60] group-hover:translate-x-0.5 transition-transform">
                    <span>Ver artículos</span>
                    <ChevronRight className="w-3 h-3" />
                  </span>
                </Link>
              </motion.div>
            );
          })}
      </motion.div>
    </section>
  );
}
