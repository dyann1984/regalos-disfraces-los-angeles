"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  User,
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
} from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { BUSINESS_INFO } from "@/data/mockCatalog";
import { getDirectWhatsAppUrl } from "@/lib/whatsapp";
import { CategorySlug } from "@/types/store";

export default function Header() {
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

  const handleCategorySelect = (slug: CategorySlug | "all", sectionId = "catalogo-principal") => {
    setSelectedCategory(slug);
    setCatalogDropdownOpen(false);
    setMobileMenuOpen(false);
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const el = document.getElementById("catalogo-principal");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
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

          {/* Botón WhatsApp Oficial + Iconos de Cuenta, Favoritos y Carrito */}
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            <motion.a
              href={getDirectWhatsAppUrl()}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ y: -2, scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
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

            {/* Cuenta / Admin */}
            <Link
              href="/admin"
              className="flex flex-col items-center text-[#5A2244] hover:text-[#D81B60] transition px-1.5 py-1 rounded-xl hover:bg-white/70"
              title="Panel de Administración y Pedidos"
            >
              <User className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2]" />
              <span className="text-[11px] font-semibold mt-0.5">Cuenta</span>
            </Link>

            {/* Favoritos con animación de contador */}
            <motion.button
              type="button"
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.93 }}
              onClick={() => setIsFavoritesOpen(true)}
              className="relative flex flex-col items-center text-[#5A2244] hover:text-[#D81B60] transition px-1.5 py-1 rounded-xl hover:bg-white/70"
              aria-label={`Ver favoritos (${favorites.length})`}
            >
              <div className="relative">
                <Heart className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2]" />
                <AnimatePresence mode="popLayout">
                  {favorites.length > 0 && (
                    <motion.span
                      key={favorites.length}
                      initial={{ scale: 0.4, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.4, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 450, damping: 18 }}
                      className="absolute -top-1.5 -right-2 bg-[#E91E63] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow"
                    >
                      {favorites.length}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
              <span className="text-[11px] font-semibold mt-0.5">Favoritos</span>
            </motion.button>

            {/* Carrito con animación de contador */}
            <motion.button
              type="button"
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.93 }}
              onClick={() => setIsCartOpen(true)}
              className="relative flex flex-col items-center text-[#5A2244] hover:text-[#D81B60] transition px-1.5 py-1 rounded-xl hover:bg-white/70"
              aria-label={`Abrir carrito de compras (${cartCount} artículos)`}
            >
              <div className="relative">
                <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2]" />
                <motion.span
                  key={cartCount}
                  initial={{ scale: 0.5, y: -3 }}
                  animate={{ scale: 1, y: 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 16 }}
                  className="absolute -top-1.5 -right-2.5 bg-[#D81B60] text-white text-[10px] font-bold min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center shadow"
                >
                  {cartCount}
                </motion.span>
              </div>
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
          <motion.button
            type="button"
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              setSelectedCategory("all");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full transition ${
              selectedCategory === "all"
                ? "bg-[#F5C2D7]/90 text-[#880E4F] shadow-sm font-bold"
                : "hover:bg-pink-100/80"
            }`}
          >
            <Home className="w-4 h-4 text-[#D81B60]" />
            <span>Inicio</span>
          </motion.button>

          <span className="text-pink-300 select-none">|</span>

          {/* Dropdown Catálogo con AnimatePresence */}
          <div
            className="relative"
            onMouseEnter={() => setCatalogDropdownOpen(true)}
            onMouseLeave={() => setCatalogDropdownOpen(false)}
          >
            <motion.button
              type="button"
              whileHover={{ y: -1 }}
              onClick={() => setCatalogDropdownOpen(!catalogDropdownOpen)}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-full hover:bg-pink-100/80 transition"
              aria-expanded={catalogDropdownOpen}
            >
              <Gift className="w-4 h-4 text-[#D81B60]" />
              <span>Catálogo</span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-[#D81B60] transition-transform duration-200 ${
                  catalogDropdownOpen ? "rotate-180" : ""
                }`}
              />
            </motion.button>

            <AnimatePresence>
              {catalogDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.97 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                  className="absolute left-0 mt-1 w-64 bg-white rounded-2xl shadow-boutiqueHover border border-pink-100 py-2 z-50"
                >
                  <button
                    type="button"
                    onClick={() => handleCategorySelect("all")}
                    className="w-full text-left px-4 py-2 text-xs font-bold text-[#D81B60] hover:bg-pink-50 transition flex items-center justify-between"
                  >
                    <span>✨ Ver todo el catálogo</span>
                    <span>→</span>
                  </button>
                  <div className="my-1 border-t border-pink-100" />
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => handleCategorySelect(cat.slug)}
                      className="w-full text-left px-4 py-2 text-xs font-medium text-gray-700 hover:bg-pink-50 hover:text-[#D81B60] transition flex items-center justify-between"
                    >
                      <span>{cat.name}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <span className="text-pink-300 select-none">|</span>

          <motion.button
            type="button"
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => handleCategorySelect("regalos")}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full transition ${
              selectedCategory === "regalos"
                ? "bg-[#F5C2D7]/90 text-[#880E4F] font-bold"
                : "hover:bg-pink-100/80"
            }`}
          >
            <Gift className="w-4 h-4 text-[#D81B60]" />
            <span>Regalos</span>
          </motion.button>

          <span className="text-pink-300 select-none">|</span>

          <motion.button
            type="button"
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => handleCategorySelect("disfraces")}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full transition ${
              selectedCategory === "disfraces"
                ? "bg-[#F5C2D7]/90 text-[#880E4F] font-bold"
                : "hover:bg-pink-100/80"
            }`}
          >
            <Sparkles className="w-4 h-4 text-[#8E24AA]" />
            <span>Disfraces</span>
          </motion.button>

          <span className="text-pink-300 select-none">|</span>

          <motion.a
            href="#nuestra-tienda"
            whileHover={{ y: -1 }}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full hover:bg-pink-100/80 transition"
          >
            <Store className="w-4 h-4 text-[#D81B60]" />
            <span>Conoce nuestra tienda</span>
          </motion.a>

          <span className="text-pink-300 select-none">|</span>

          <motion.a
            href="#contacto"
            whileHover={{ y: -1 }}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full hover:bg-pink-100/80 transition"
          >
            <Mail className="w-4 h-4 text-[#D81B60]" />
            <span>Contacto</span>
          </motion.a>
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
                Categorías de la tienda
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
              <button
                type="button"
                onClick={() => handleCategorySelect("all")}
                className="text-left px-3 py-2 rounded-xl bg-pink-50 text-xs font-bold text-[#880E4F]"
              >
                🏠 Todo el Catálogo
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleCategorySelect(cat.slug)}
                  className="text-left px-3 py-2 rounded-xl hover:bg-pink-50 text-xs font-medium text-gray-700 border border-pink-100"
                >
                  {cat.shortName}
                </button>
              ))}
            </div>
            <div className="pt-2 border-t border-pink-100 flex justify-between text-xs font-semibold text-[#5A2244]">
              <a href="#ofertas-especiales" onClick={() => setMobileMenuOpen(false)}>
                🔥 Novedades
              </a>
              <a href="#nuestra-tienda" onClick={() => setMobileMenuOpen(false)}>
                🏪 Conoce nuestra tienda
              </a>
              <a href="#contacto" onClick={() => setMobileMenuOpen(false)}>
                📍 Contacto
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
