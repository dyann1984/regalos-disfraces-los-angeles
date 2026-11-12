"use client";

import React, { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight,
  Sparkles,
  SlidersHorizontal,
  Flame,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import Header from "@/components/Header";
import HeroBanner from "@/components/HeroBanner";
import CategoryGrid from "@/components/CategoryGrid";
import ProductCard from "@/components/ProductCard";
import ProductModal from "@/components/ProductModal";
import CartDrawer from "@/components/CartDrawer";
import FavoritesDrawer from "@/components/FavoritesDrawer";
import StoreGallerySection from "@/components/StoreGallerySection";
import ContactSection from "@/components/ContactSection";
import Footer from "@/components/Footer";
import FloatingWhatsApp from "@/components/FloatingWhatsApp";
import { BoutiqueSectionHeading, CelebrationConfetti } from "@/components/BrandDetails";
import { useStore } from "@/context/StoreContext";

export default function HomePage() {
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

  // Filtrado y ordenamiento del catálogo
  const filteredProducts = useMemo(() => {
    const activeList = products.filter((p) => p.active);

    const byCategory =
      selectedCategory === "all"
        ? activeList
        : activeList.filter((p) => p.categorySlug === selectedCategory);

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
  }, [products, selectedCategory, searchQuery, sortBy]);

  // Los 6 productos destacados principales
  const featuredSix = useMemo(
    () => products.filter((p) => p.active && p.isFeatured).slice(0, 6),
    [products]
  );

  // Novedades y paquetes destacados
  const specialOffers = useMemo(
    () => products.filter((p) => p.active && p.isSpecialOffer),
    [products]
  );

  const selectedCategoryName =
    selectedCategory === "all"
      ? "Catálogo de Productos"
      : categories.find((c) => c.slug === selectedCategory)?.name || "Catálogo";

  return (
    <div className="min-h-screen flex flex-col">
      {/* Confeti discreto únicamente al completar una acción importante */}
      <CelebrationConfetti active={celebrationActive} />

      {/* Notificación flotante (Toast) con mensaje claro de éxito, información o error */}
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

      {/* 1. Encabezado con Logotipo Oficial, Buscador, WhatsApp, Favoritos, Carrito y Menú */}
      <Header />

      {/* 2. Banner Principal Premium y Barra de Ventajas Comerciales */}
      <main className="flex-1">
        <HeroBanner />

        {/* 3. Categorías Prioritarias Animadas (Peluches, Juguetes, Regalos, Disfraces, Fiestas, Accesorios) */}
        <CategoryGrid />

        {/* 4. Sección Productos Destacados y Catálogo Filtrable */}
        <motion.section
          id="catalogo-principal"
          aria-labelledby="titulo-destacados"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="max-w-[1320px] mx-auto px-4 sm:px-6 pt-6 pb-8"
        >
          {/* Título en Poppins con detalles dorados y enlace Ver todo el catálogo */}
          <div className="relative flex flex-col sm:flex-row items-center justify-between gap-3 mb-5">
            <div className="hidden lg:block w-44" />

            <BoutiqueSectionHeading
              id="titulo-destacados"
              title={
                selectedCategory === "all" && !searchQuery
                  ? "Productos Destacados"
                  : selectedCategoryName
              }
            />

            <motion.button
              type="button"
              whileHover={{ x: 3 }}
              onClick={() => {
                setSelectedCategory("all");
                setSearchQuery("");
              }}
              className="inline-flex items-center gap-1 text-xs sm:text-sm font-bold text-[#6A1B4D] hover:text-[#D81B60] transition"
            >
              <span>Ver todo el catálogo</span>
              <ChevronRight className="w-4 h-4 text-[#D81B60]" />
            </motion.button>
          </div>

          {/* Barra de Filtros, Ordenamiento y Aviso de Catálogo de Demostración */}
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 bg-white/85 backdrop-blur-sm px-4 py-2.5 rounded-2xl border border-pink-200/80 shadow-sm">
            <div className="flex items-center gap-2 text-xs text-[#6A1B4D]">
              <AlertCircle className="w-4 h-4 text-[#D81B60] shrink-0" />
              <span>
                <strong>Catálogo en preparación:</strong> Las fotografías individuales con su precio
                oficial y existencia se agregarán directamente desde el panel administrativo.
              </span>
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#D81B60]" />
              <label htmlFor="sort-select" className="text-xs font-semibold text-gray-700">
                Ordenar:
              </label>
              <select
                id="sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="text-xs font-semibold text-[#6A1B4D] bg-pink-50/70 border border-pink-200 rounded-xl px-2.5 py-1 focus:outline-none"
              >
                <option value="featured">Destacados</option>
                <option value="name-asc">Nombre (A-Z)</option>
                <option value="price-asc">Precio: Menor a Mayor</option>
                <option value="price-desc">Precio: Mayor a Menor</option>
              </select>
            </div>
          </div>

          {/* Grid de 6 columnas en escritorio con transiciones fluidas al filtrar */}
          <AnimatePresence mode="wait">
            {selectedCategory === "all" && !searchQuery && sortBy === "featured" ? (
              <motion.div
                key="featured-six"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
                className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 sm:gap-4"
              >
                {featuredSix.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </motion.div>
            ) : filteredProducts.length === 0 ? (
              <motion.div
                key="empty-results"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="bg-white rounded-3xl p-10 text-center border border-pink-200 shadow-card"
              >
                <p className="text-base font-bold text-[#6A1B4D]">
                  No encontramos productos que coincidan con tu búsqueda
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Intenta con otro término o restablece los filtros para ver todo el catálogo.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory("all");
                    setSearchQuery("");
                  }}
                  className="mt-4 px-5 py-2 rounded-full bg-[#D81B60] text-white text-xs font-bold"
                >
                  Ver todos los productos
                </button>
              </motion.div>
            ) : (
              <motion.div
                key={`filtered-${selectedCategory}-${sortBy}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
                className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3.5 sm:gap-4"
              >
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.section>

        {/* 5. Sección de Sorpresas y Artículos de Temporada */}
        <motion.section
          id="ofertas-especiales"
          aria-labelledby="titulo-ofertas"
          initial={{ opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="max-w-[1320px] mx-auto px-4 sm:px-6 py-6"
        >
          <div className="rounded-3xl bg-gradient-to-r from-[#FFF0F6] via-white to-[#FFF0F6] border border-pink-200/90 p-5 sm:p-7 shadow-card">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
              <div className="flex items-center gap-2.5">
                <span className="w-9 h-9 rounded-2xl bg-gradient-to-br from-[#E91E63] to-[#AD1457] text-white flex items-center justify-center shadow">
                  <Flame className="w-5 h-5" />
                </span>
                <div>
                  <h2
                    id="titulo-ofertas"
                    className="text-xl sm:text-2xl font-extrabold text-[#6A1B4D]"
                  >
                    Sorpresas y Novedades para Toda la Familia
                  </h2>
                  <p className="text-xs text-gray-600">
                    Sets de regalo, juguetes, peluches y artículos seleccionados para tus
                    celebraciones
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold text-[#D81B60] bg-pink-100/80 px-3.5 py-1.5 rounded-full self-start sm:self-center border border-pink-200">
                🎁 Consulta existencias por WhatsApp
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {specialOffers.map((product) => (
                <ProductCard key={`offer-${product.id}`} product={product} />
              ))}
            </div>
          </div>
        </motion.section>

        {/* 6. Galería Conoce nuestra tienda (en sustitución del apartado de personalización) */}
        <StoreGallerySection />

        {/* 7. Información de Contacto y Entrega */}
        <ContactSection />
      </main>

      {/* 8. Pie de Página */}
      <Footer />

      {/* Modales, Drawers y Botón Flotante de WhatsApp */}
      <ProductModal />
      <CartDrawer />
      <FavoritesDrawer />
      <FloatingWhatsApp />
    </div>
  );
}
