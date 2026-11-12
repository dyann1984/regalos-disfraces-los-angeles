"use client";

import React, { useEffect, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  SlidersHorizontal,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  X,
  PhoneCall,
} from "lucide-react";
import Header from "@/components/Header";
import ProductCard from "@/components/ProductCard";
import ProductModal from "@/components/ProductModal";
import CartDrawer from "@/components/CartDrawer";
import FavoritesDrawer from "@/components/FavoritesDrawer";
import Footer from "@/components/Footer";
import FloatingWhatsApp from "@/components/FloatingWhatsApp";
import { BoutiqueSectionHeading, CelebrationConfetti } from "@/components/BrandDetails";
import { useStore } from "@/context/StoreContext";
import { CategorySlug } from "@/types/store";
import { getDirectWhatsAppUrl } from "@/lib/whatsapp";

const VALID_CATEGORY_SLUGS: CategorySlug[] = [
  "peluches",
  "juguetes",
  "regalos",
  "disfraces",
  "fiestas-celebraciones",
  "accesorios-otros",
];

export default function CatalogoPage() {
  const {
    products,
    categories,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    sortBy,
    setSortBy,
    toastMessage,
    toastVariant,
    celebrationActive,
  } = useStore();

  // Sincronizar parámetros de URL (?categoria=... y ?q=...) al cargar o navegar en /catalogo
  useEffect(() => {
    const syncFromUrl = () => {
      if (typeof window === "undefined") return;
      const params = new URLSearchParams(window.location.search);
      const catParam = params.get("categoria");
      const qParam = params.get("q");

      if (catParam && VALID_CATEGORY_SLUGS.includes(catParam as CategorySlug)) {
        setSelectedCategory(catParam as CategorySlug);
      } else if (catParam === "all") {
        setSelectedCategory("all");
      }

      if (qParam !== null) {
        setSearchQuery(qParam);
      }
    };

    syncFromUrl();
    window.addEventListener("popstate", syncFromUrl);
    return () => window.removeEventListener("popstate", syncFromUrl);
  }, [setSelectedCategory, setSearchQuery]);

  const activeProducts = useMemo(() => products.filter((p) => p.active), [products]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: activeProducts.length };
    categories.forEach((cat) => {
      counts[cat.slug] = activeProducts.filter((p) => p.categorySlug === cat.slug).length;
    });
    return counts;
  }, [activeProducts, categories]);

  const filteredProducts = useMemo(() => {
    const byCategory =
      selectedCategory === "all"
        ? activeProducts
        : activeProducts.filter((p) => p.categorySlug === selectedCategory);

    const q = searchQuery.trim().toLowerCase();
    const bySearch = !q
      ? byCategory
      : byCategory.filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            p.subtitle.toLowerCase().includes(q) ||
            p.description.toLowerCase().includes(q) ||
            p.categorySlug.toLowerCase().includes(q)
        );

    return [...bySearch].sort((a, b) => {
      const priceA = a.promoPrice ?? a.price ?? 0;
      const priceB = b.promoPrice ?? b.price ?? 0;
      if (sortBy === "price-asc") return priceA - priceB;
      if (sortBy === "price-desc") return priceB - priceA;
      if (sortBy === "name-asc") return a.name.localeCompare(b.name, "es");
      return Number(b.isFeatured) - Number(a.isFeatured);
    });
  }, [activeProducts, selectedCategory, searchQuery, sortBy]);

  const activeCategoryObj =
    selectedCategory === "all"
      ? null
      : categories.find((c) => c.slug === selectedCategory) || null;

  const handleSelectCategory = (slug: CategorySlug | "all") => {
    setSelectedCategory(slug);
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (slug === "all") {
        params.delete("categoria");
      } else {
        params.set("categoria", slug);
      }
      const qs = params.toString();
      window.history.replaceState(null, "", qs ? `/catalogo?${qs}` : "/catalogo");
    }
  };

  const handleClearFilters = () => {
    setSelectedCategory("all");
    setSearchQuery("");
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", "/catalogo");
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <CelebrationConfetti active={celebrationActive} />

      <AnimatePresence>
        {toastMessage && (
          <motion.div
            key={toastMessage}
            role="status"
            aria-live="polite"
            initial={{ opacity: 0, y: -16, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.94 }}
            transition={{ type: "spring", stiffness: 380, damping: 24 }}
            className={`fixed top-20 right-4 z-50 text-white text-xs sm:text-sm font-semibold px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-2 ${
              toastVariant === "error"
                ? "bg-rose-700 border-rose-400"
                : toastVariant === "info"
                ? "bg-[#5A2244] border-pink-300"
                : "bg-[#6A1B4D] border-amber-300"
            }`}
          >
            {toastVariant === "error" ? (
              <AlertCircle className="w-4 h-4 text-rose-200 shrink-0" />
            ) : toastVariant === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
            ) : (
              <Sparkles className="w-4 h-4 text-[#FDE68A] shrink-0" />
            )}
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <Header />

      <main className="flex-1 max-w-[1320px] w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Navegación de migas de pan y retorno a inicio */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#6A1B4D]">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white border border-pink-200 hover:bg-pink-50 text-[#D81B60] font-bold shadow-sm transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Volver al inicio</span>
            </Link>
            <span className="text-pink-300">/</span>
            <span className="font-bold text-[#6A1B4D]">Catálogo de Productos</span>
            {activeCategoryObj && (
              <>
                <span className="text-pink-300">/</span>
                <span className="text-[#D81B60] font-extrabold">{activeCategoryObj.name}</span>
              </>
            )}
          </div>

          <a
            href={getDirectWhatsAppUrl(
              "¡Hola! Estoy viendo el catálogo en línea de Regalos, Disfraces y Más — Los Ángeles y me gustaría consultar disponibilidad de productos."
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-[#25D366] hover:bg-[#1DA851] px-4 py-1.5 rounded-full shadow-sm transition"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>Atención por WhatsApp (5635478874)</span>
          </a>
        </div>

        {/* Encabezado del Catálogo */}
        <div className="rounded-3xl bg-gradient-to-r from-[#FCE4EC] via-[#FDF2F7] to-[#FCE4EC] border border-pink-200 p-5 sm:p-7 shadow-boutique text-center space-y-2">
          <BoutiqueSectionHeading
            id="titulo-pagina-catalogo"
            title={activeCategoryObj ? activeCategoryObj.name : "Catálogo Completo de la Tienda"}
            badgeText="Regalos, Disfraces y Más — Los Ángeles"
          />
          <p className="text-xs sm:text-sm text-[#4A1936] max-w-2xl mx-auto">
            {activeCategoryObj
              ? activeCategoryObj.description
              : "Explora nuestras 6 categorías: Peluches, Juguetes, Regalos, Disfraces, Artículos para fiestas y Accesorios."}
          </p>
        </div>

        {/* Controles de Búsqueda, Filtro por Categoría y Ordenamiento */}
        <div className="bg-white rounded-3xl border border-pink-200/90 p-4 sm:p-5 shadow-card space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
            {/* Buscador instantáneo dentro del catálogo */}
            <div className="md:col-span-7 relative flex items-center">
              <Search className="w-4 h-4 text-[#D81B60] absolute left-4 pointer-events-none" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por nombre, categoría o descripción (ej. oso, unicornio, disfraz, globos)..."
                aria-label="Filtrar artículos en el catálogo"
                className="w-full pl-10 pr-9 py-2.5 text-xs sm:text-sm rounded-full border border-pink-200 bg-pink-50/40 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#D81B60]/40"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  aria-label="Limpiar búsqueda"
                  className="absolute right-3 w-6 h-6 rounded-full bg-pink-100 text-[#6A1B4D] hover:bg-pink-200 flex items-center justify-center"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Selector de Ordenamiento */}
            <div className="md:col-span-5 flex items-center justify-between md:justify-end gap-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-700">
                <SlidersHorizontal className="w-3.5 h-3.5 text-[#D81B60]" />
                <label htmlFor="catalog-sort-select">Ordenar por:</label>
              </div>
              <select
                id="catalog-sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="text-xs font-bold text-[#6A1B4D] bg-pink-50 border border-pink-200 rounded-full px-3.5 py-2 focus:outline-none focus:ring-2 focus:ring-[#D81B60]/40"
              >
                <option value="featured">Destacados</option>
                <option value="name-asc">Nombre (A-Z)</option>
                <option value="price-asc">Precio: Menor a Mayor</option>
                <option value="price-desc">Precio: Mayor a Menor</option>
              </select>
            </div>
          </div>

          {/* Botones de filtro por las 6 categorías oficiales */}
          <div
            role="tablist"
            aria-label="Filtrar por categoría"
            className="flex flex-wrap items-center gap-2 pt-2 border-t border-pink-100"
          >
            <button
              type="button"
              onClick={() => handleSelectCategory("all")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 ${
                selectedCategory === "all"
                  ? "bg-[#D81B60] text-white shadow-sm"
                  : "bg-pink-50/80 text-[#6A1B4D] hover:bg-pink-100 border border-pink-200/70"
              }`}
            >
              <span>Todas las categorías</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  selectedCategory === "all"
                    ? "bg-white/25 text-white"
                    : "bg-white text-[#D81B60]"
                }`}
              >
                {categoryCounts.all ?? 0}
              </span>
            </button>

            {categories
              .filter((c) => c.active)
              .sort((a, b) => a.order - b.order)
              .map((cat) => {
                const isSelected = selectedCategory === cat.slug;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleSelectCategory(cat.slug)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 ${
                      isSelected
                        ? "bg-[#D81B60] text-white shadow-sm"
                        : "bg-pink-50/80 text-[#6A1B4D] hover:bg-pink-100 border border-pink-200/70"
                    }`}
                  >
                    <span>{cat.name}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                        isSelected ? "bg-white/25 text-white" : "bg-white text-[#D81B60]"
                      }`}
                    >
                      {categoryCounts[cat.slug] ?? 0}
                    </span>
                  </button>
                );
              })}
          </div>

          {/* Barra informativa sobre productos de referencia vs. compra directa */}
          <div className="flex flex-wrap items-center justify-between gap-2 bg-[#FDF2F7] px-3.5 py-2 rounded-2xl border border-pink-200/80 text-xs text-[#6A1B4D]">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-[#D81B60] shrink-0" />
              <span>
                Los artículos sin precio confirmado muestran{" "}
                <strong>“Producto de referencia — Consulta disponibilidad”</strong> para atención
                directa por WhatsApp.
              </span>
            </div>
            <span className="font-bold text-[#D81B60]">
              Mostrando {filteredProducts.length} artículo(s)
            </span>
          </div>
        </div>

        {/* Cuadrícula responsive de productos */}
        {filteredProducts.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 text-center border border-pink-200 shadow-card space-y-3">
            <p className="text-base font-bold text-[#6A1B4D]">
              No encontramos artículos que coincidan con tu filtro actual
            </p>
            <p className="text-xs text-gray-500 max-w-md mx-auto">
              Prueba con otra palabra clave o restablece los filtros para ver todas las categorías
              de la tienda.
            </p>
            <button
              type="button"
              onClick={handleClearFilters}
              className="px-5 py-2.5 rounded-full bg-[#D81B60] hover:bg-[#AD1457] text-white text-xs font-bold shadow transition"
            >
              Ver todos los artículos del catálogo
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3.5 sm:gap-4">
            {filteredProducts.map((product, idx) => (
              <ProductCard key={product.id} product={product} index={idx} />
            ))}
          </div>
        )}
      </main>

      <Footer />
      <ProductModal />
      <CartDrawer />
      <FavoritesDrawer />
      <FloatingWhatsApp />
    </div>
  );
}
