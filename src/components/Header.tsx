"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Heart,
  ShoppingCart,
  Home,
  Gift,
  ChevronDown,
  Sparkles,
  Store,
  Mail,
  Menu,
  X,
  PhoneCall,
  MapPin,
} from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { BUSINESS_INFO } from "@/data/mockCatalog";
import { getDirectWhatsAppUrl } from "@/lib/whatsapp";
import { CategorySlug } from "@/types/store";

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const {
    categories,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    cartCount,
    favorites,
    setIsCartOpen,
    setIsFavoritesOpen,
  } = useStore();

  const [catalogDropdownOpen, setCatalogDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleCategorySelect = (slug: CategorySlug | "all") => {
    setSelectedCategory(slug);
    setCatalogDropdownOpen(false);
    setMobileMenuOpen(false);
    if (slug === "all") {
      router.push("/catalogo");
    } else {
      router.push(`/catalogo?categoria=${encodeURIComponent(slug)}`);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    const trimmed = searchQuery.trim();
    if (trimmed) {
      router.push(`/catalogo?q=${encodeURIComponent(trimmed)}`);
    } else {
      router.push("/catalogo");
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-gradient-to-b from-[#FDF2F7]/95 via-[#FCEBF3]/95 to-[#F9E2EC]/95 backdrop-blur-md shadow-sm border-b border-pink-200/80">
      {/* Barra superior principal */}
      <div className="max-w-[1320px] mx-auto px-3 sm:px-6 pt-2.5 pb-2">
        <div className="flex items-center justify-between gap-3 lg:gap-6">
          {/* Botón menú móvil */}
          <motion.button
            type="button"
            whileTap={{ scale: 0.92 }}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl text-[#6A1B4D] hover:bg-pink-200/50 transition"
            aria-label="Abrir menú de navegación"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </motion.button>

          {/* Logotipo Oficial */}
          <Link
            href="/"
            onClick={() => setSelectedCategory("all")}
            className="flex items-center shrink-0 group focus:outline-none"
          >
            <motion.div
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 320, damping: 22 }}
              className="relative flex items-center bg-white/90 rounded-2xl px-2 py-1 shadow-sm border border-pink-100"
            >
              <img
                src="/images/logo-header.jpg"
                alt="Logotipo Oficial Regalos, Disfraces y Más — Los Ángeles"
                className="h-12 sm:h-16 md:h-[72px] w-auto object-contain rounded-xl"
              />
            </motion.div>
          </Link>

          {/* Buscador central (Desktop y Tablet) */}
          <form
            onSubmit={handleSearchSubmit}
            className="hidden md:flex flex-1 max-w-xl items-center bg-white rounded-full shadow-inner border border-pink-200/90 overflow-hidden focus-within:ring-2 focus-within:ring-[#D81B60]/40 focus-within:border-[#D81B60] transition"
          >
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar peluches, juguetes, disfraces, regalos, fiestas..."
              aria-label="Buscar productos en la tienda"
              className="w-full pl-5 pr-3 py-2.5 text-sm font-medium text-gray-700 placeholder-gray-400 bg-transparent focus:outline-none"
            />
            <motion.button
              type="submit"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              aria-label="Buscar"
              className="btn-shimmer bg-gradient-to-r from-[#E91E63] to-[#C2185B] hover:from-[#D81B60] hover:to-[#AD1457] text-white px-5 py-2.5 flex items-center justify-center transition"
            >
              <Search className="w-4 h-4" />
            </motion.button>
          </form>

          {/* Botón WhatsApp Oficial + Iconos de Favoritos y Carrito */}
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            <motion.a
              href={getDirectWhatsAppUrl()}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ y: -2, scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              className="btn-shimmer hidden sm:flex items-center gap-2 bg-gradient-to-r from-[#25D366] to-[#1DA851] text-white rounded-full px-3.5 py-1.5 shadow-md hover:shadow-lg transition"
              aria-label={`Contactar por WhatsApp al ${BUSINESS_INFO.whatsappFormatted}`}
            >
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-white/20">
                <PhoneCall className="w-4 h-4 fill-current" />
              </span>
              <div className="flex flex-col leading-tight pr-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider opacity-95">
                  WhatsApp
                </span>
                <span className="text-xs md:text-sm font-bold tracking-tight">
                  {BUSINESS_INFO.whatsappDisplay}
                </span>
              </div>
            </motion.a>

            {/* Favoritos con animación fluida de pulso y contador */}
            <motion.button
              type="button"
              whileHover={{ y: -2, scale: 1.05 }}
              whileTap={{ scale: 0.92 }}
              onClick={() => setIsFavoritesOpen(true)}
              className="relative flex flex-col items-center text-[#5A2244] hover:text-[#D81B60] transition px-2 py-1 rounded-xl hover:bg-white/80 hover:shadow-sm"
              aria-label={`Ver favoritos (${favorites.length})`}
            >
              <motion.div
                key={`fav-icon-${favorites.length}`}
                initial={{ scale: 0.85 }}
                animate={{ scale: [1, 1.24, 0.95, 1] }}
                transition={{ duration: 0.38, ease: "easeOut" }}
                className="relative"
              >
                <Heart
                  className={`w-5 h-5 sm:w-6 sm:h-6 stroke-[2] transition-colors ${
                    favorites.length > 0 ? "text-[#E91E63] fill-[#F48FB1]/40" : ""
                  }`}
                />
                <AnimatePresence mode="popLayout">
                  {favorites.length > 0 && (
                    <motion.span
                      key={favorites.length}
                      initial={{ scale: 0.3, opacity: 0, y: -4 }}
                      animate={{ scale: 1, opacity: 1, y: 0 }}
                      exit={{ scale: 0.3, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 520, damping: 15 }}
                      className="absolute -top-1.5 -right-2 bg-gradient-to-r from-[#E91E63] to-[#C2185B] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-md ring-2 ring-white"
                    >
                      {favorites.length}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.div>
              <span className="text-[11px] font-semibold mt-0.5">Favoritos</span>
            </motion.button>

            {/* Carrito con animación fluida de rebote y contador */}
            <motion.button
              type="button"
              whileHover={{ y: -2, scale: 1.05 }}
              whileTap={{ scale: 0.92 }}
              onClick={() => setIsCartOpen(true)}
              className="relative flex flex-col items-center text-[#5A2244] hover:text-[#D81B60] transition px-2 py-1 rounded-xl hover:bg-white/80 hover:shadow-sm"
              aria-label={`Abrir carrito de compras (${cartCount} artículos)`}
            >
              <motion.div
                key={`cart-icon-${cartCount}`}
                initial={{ scale: 0.85 }}
                animate={{ scale: [1, 1.22, 0.95, 1] }}
                transition={{ duration: 0.38, ease: "easeOut" }}
                className="relative"
              >
                <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2]" />
                <motion.span
                  key={cartCount}
                  initial={{ scale: 0.4, y: -4 }}
                  animate={{ scale: 1, y: 0 }}
                  transition={{ type: "spring", stiffness: 520, damping: 15 }}
                  className="absolute -top-1.5 -right-2.5 bg-gradient-to-r from-[#D81B60] to-[#AD1457] text-white text-[10px] font-bold min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center shadow-md ring-2 ring-white"
                >
                  {cartCount}
                </motion.span>
              </motion.div>
              <span className="text-[11px] font-semibold mt-0.5">Carrito</span>
            </motion.button>
          </div>
        </div>

        {/* Buscador móvil */}
        <form
          onSubmit={handleSearchSubmit}
          className="mt-2 flex md:hidden items-center bg-white rounded-full shadow-inner border border-pink-200 overflow-hidden"
        >
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar peluches, juguetes, disfraces, regalos..."
            aria-label="Buscar productos"
            className="w-full pl-4 pr-2 py-2 text-xs font-medium text-gray-700 placeholder-gray-400 bg-transparent focus:outline-none"
          />
          <button
            type="submit"
            aria-label="Buscar"
            className="bg-[#D81B60] text-white px-4 py-2 flex items-center justify-center"
          >
            <Search className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Menú de navegación por categorías (Desktop) */}
      <nav
        aria-label="Navegación principal"
        className="hidden lg:block border-t border-pink-200/60 bg-white/60 backdrop-blur-sm"
      >
        <div className="max-w-[1320px] mx-auto px-6 py-1.5 flex items-center justify-center gap-2 text-sm font-semibold text-[#5A2244]">
          <Link
            href="/"
            onClick={() => setSelectedCategory("all")}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full transition ${
              pathname === "/" && selectedCategory === "all"
                ? "bg-[#F5C2D7]/90 text-[#880E4F] shadow-sm font-bold"
                : "hover:bg-pink-100/80"
            }`}
          >
            <Home className="w-4 h-4 text-[#D81B60]" />
            <span>Inicio</span>
          </Link>

          <span className="text-pink-300 select-none">|</span>

          {/* Enlace Catálogo + Dropdown con AnimatePresence */}
          <div
            className="relative"
            onMouseEnter={() => setCatalogDropdownOpen(true)}
            onMouseLeave={() => setCatalogDropdownOpen(false)}
          >
            <div className="flex items-center">
              <Link
                href="/catalogo"
                onClick={() => {
                  setSelectedCategory("all");
                  setCatalogDropdownOpen(false);
                }}
                className={`flex items-center gap-1.5 pl-4 pr-2 py-1.5 rounded-l-full transition ${
                  pathname === "/catalogo"
                    ? "bg-[#F5C2D7]/90 text-[#880E4F] font-bold"
                    : "hover:bg-pink-100/80"
                }`}
              >
                <Gift className="w-4 h-4 text-[#D81B60]" />
                <span>Catálogo</span>
              </Link>
              <button
                type="button"
                onClick={() => setCatalogDropdownOpen(!catalogDropdownOpen)}
                aria-label="Desplegar categorías del catálogo"
                aria-expanded={catalogDropdownOpen}
                className={`pr-3 pl-1 py-1.5 rounded-r-full transition ${
                  pathname === "/catalogo"
                    ? "bg-[#F5C2D7]/90 text-[#880E4F]"
                    : "hover:bg-pink-100/80"
                }`}
              >
                <ChevronDown
                  className={`w-3.5 h-3.5 text-[#D81B60] transition-transform duration-200 ${
                    catalogDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
            </div>

            <AnimatePresence>
              {catalogDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.97 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                  className="absolute left-0 mt-1 w-64 bg-white rounded-2xl shadow-boutiqueHover border border-pink-100 py-2 z-50"
                >
                  <Link
                    href="/catalogo"
                    onClick={() => {
                      setSelectedCategory("all");
                      setCatalogDropdownOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-xs font-bold text-[#D81B60] hover:bg-pink-50 transition flex items-center justify-between"
                  >
                    <span>✨ Ver todo el catálogo</span>
                    <span>→</span>
                  </Link>
                  <div className="my-1 border-t border-pink-100" />
                  {categories.map((cat) => (
                    <Link
                      key={cat.id}
                      href={`/catalogo?categoria=${encodeURIComponent(cat.slug)}`}
                      onClick={() => {
                        setSelectedCategory(cat.slug);
                        setCatalogDropdownOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-xs font-medium text-gray-700 hover:bg-pink-50 hover:text-[#D81B60] transition flex items-center justify-between"
                    >
                      <span>{cat.name}</span>
                    </Link>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <span className="text-pink-300 select-none">|</span>

          <Link
            href="/catalogo?categoria=regalos"
            onClick={() => setSelectedCategory("regalos")}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full transition ${
              selectedCategory === "regalos" && pathname === "/catalogo"
                ? "bg-[#F5C2D7]/90 text-[#880E4F] font-bold"
                : "hover:bg-pink-100/80"
            }`}
          >
            <Gift className="w-4 h-4 text-[#D81B60]" />
            <span>Regalos</span>
          </Link>

          <span className="text-pink-300 select-none">|</span>

          <Link
            href="/catalogo?categoria=disfraces"
            onClick={() => setSelectedCategory("disfraces")}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full transition ${
              selectedCategory === "disfraces" && pathname === "/catalogo"
                ? "bg-[#F5C2D7]/90 text-[#880E4F] font-bold"
                : "hover:bg-pink-100/80"
            }`}
          >
            <Sparkles className="w-4 h-4 text-[#8E24AA]" />
            <span>Disfraces</span>
          </Link>

          <span className="text-pink-300 select-none">|</span>

          <Link
            href="/#nuestra-tienda"
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full hover:bg-pink-100/80 transition"
          >
            <Store className="w-4 h-4 text-[#D81B60]" />
            <span>Conoce nuestra tienda</span>
          </Link>

          <span className="text-pink-300 select-none">|</span>

          <Link
            href="/#visitanos"
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full hover:bg-pink-100/80 transition"
          >
            <MapPin className="w-4 h-4 text-[#D81B60]" />
            <span>Visítanos</span>
          </Link>

          <span className="text-pink-300 select-none">|</span>

          <Link
            href="/#contacto"
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full hover:bg-pink-100/80 transition"
          >
            <Mail className="w-4 h-4 text-[#D81B60]" />
            <span>Contacto</span>
          </Link>
        </div>
      </nav>

      {/* Menú desplegable Móvil con AnimatePresence */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="lg:hidden bg-white border-t border-pink-200 px-4 py-4 shadow-xl space-y-3 overflow-hidden"
          >
            <div className="flex items-center justify-between pb-2 border-b border-pink-100">
              <span className="text-xs font-bold uppercase tracking-wider text-[#D81B60]">
                Categorías y Catálogo
              </span>
              <a
                href={getDirectWhatsAppUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 bg-[#25D366] text-white text-xs font-bold px-3 py-1 rounded-full"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                {BUSINESS_INFO.whatsappDisplay}
              </a>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Link
                href="/catalogo"
                onClick={() => handleCategorySelect("all")}
                className="text-left px-3 py-2 rounded-xl bg-pink-50 text-xs font-bold text-[#880E4F]"
              >
                🛍️ Todo el Catálogo
              </Link>
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/catalogo?categoria=${encodeURIComponent(cat.slug)}`}
                  onClick={() => handleCategorySelect(cat.slug)}
                  className="text-left px-3 py-2 rounded-xl hover:bg-pink-50 text-xs font-medium text-gray-700 border border-pink-100"
                >
                  {cat.shortName}
                </Link>
              ))}
            </div>
            <div className="pt-2 border-t border-pink-100 flex flex-wrap justify-between gap-2 text-xs font-semibold text-[#5A2244]">
              <Link href="/#nuestra-tienda" onClick={() => setMobileMenuOpen(false)}>
                🏪 Nuestra tienda
              </Link>
              <Link href="/#visitanos" onClick={() => setMobileMenuOpen(false)}>
                📍 Visítanos
              </Link>
              <Link href="/#contacto" onClick={() => setMobileMenuOpen(false)}>
                💬 Contacto
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
