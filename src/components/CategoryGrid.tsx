"use client";

import React from "react";
import Link from "next/link";
import { motion, Variants } from "framer-motion";
import { Check, ChevronRight } from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { BoutiqueSectionHeading } from "@/components/BrandDetails";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.055,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 16, scale: 0.96 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.35, ease: "easeOut" },
  },
};

export default function CategoryGrid() {
  const { categories, selectedCategory, setSelectedCategory } = useStore();

  return (
    <section
      id="categorias"
      aria-labelledby="titulo-categorias"
      className="max-w-[1320px] mx-auto px-4 sm:px-6 pt-8 pb-4"
    >
      {/* Encabezado con estrellas doradas, corazones discretos y tipografía Poppins */}
      <div className="mb-6">
        <BoutiqueSectionHeading id="titulo-categorias" title="Nuestras Categorías" />
      </div>

      {/* Grid de 6 Categorías Prioritarias que abren directamente el catálogo filtrado */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-40px" }}
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
                whileHover={{ y: -5, scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
              >
                <Link
                  href={`/catalogo?categoria=${encodeURIComponent(cat.slug)}`}
                  onClick={() => setSelectedCategory(cat.slug)}
                  className={`group relative h-full flex flex-col items-center justify-between rounded-2xl p-3 sm:p-3.5 transition-colors duration-200 border text-center ${
                    isSelected
                      ? "bg-gradient-to-b from-[#F8BBD0] to-[#F48FB1] border-[#D81B60] shadow-boutiqueHover"
                      : "bg-gradient-to-b from-[#FDE8F1] to-[#FADCE9] hover:from-[#FADCE9] hover:to-[#F7C6DB] border-pink-200/80 shadow-card hover:shadow-boutique"
                  }`}
                >
                  {isSelected && (
                    <span className="absolute -top-2 -right-2 z-10 w-6 h-6 rounded-full bg-[#D81B60] text-white flex items-center justify-center shadow-md border-2 border-white">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </span>
                  )}

                  <div className="w-full aspect-[4/3] rounded-xl overflow-hidden bg-white/85 flex items-center justify-center p-1.5 shadow-inner border border-white/60">
                    <img
                      src={cat.image}
                      alt={cat.name}
                      className="w-full h-full object-contain group-hover:scale-105 group-hover:-translate-y-0.5 transition-transform duration-300 ease-out"
                    />
                  </div>
                  <span
                    className={`mt-2.5 text-xs sm:text-sm font-bold leading-tight transition-colors ${
                      isSelected ? "text-[#6A1B4D]" : "text-[#4A1936] group-hover:text-[#D81B60]"
                    }`}
                  >
                    {cat.shortName}
                  </span>
                  <span className="mt-1 inline-flex items-center gap-0.5 text-[10px] font-semibold text-[#D81B60]">
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
