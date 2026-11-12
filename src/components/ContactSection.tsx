"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  PhoneCall,
  MapPin,
  ShieldCheck,
  MessageSquareHeart,
  Navigation,
  ExternalLink,
  Store,
} from "lucide-react";
import { BUSINESS_INFO } from "@/data/mockCatalog";
import { getDirectWhatsAppUrl } from "@/lib/whatsapp";
import { BoutiqueSectionHeading } from "@/components/BrandDetails";

export default function ContactSection() {
  return (
    <div className="space-y-6">
      {/* Sección Dedicada: Visítanos (Ubicación Oficial en Google Maps) */}
      <motion.section
        id="visitanos"
        aria-labelledby="titulo-visitanos"
        initial={{ opacity: 0, y: 22 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="max-w-[1320px] mx-auto px-4 sm:px-6 pt-4"
      >
        <div className="rounded-3xl bg-gradient-to-r from-[#FCE4EC] via-white to-[#FCE4EC] border border-pink-200 shadow-boutique p-6 sm:p-8">
          <div className="max-w-2xl mx-auto text-center mb-6">
            <BoutiqueSectionHeading
              id="titulo-visitanos"
              title="Visítanos"
              badgeText={BUSINESS_INFO.mapsPlaceName}
            />
            <p className="text-xs sm:text-sm text-[#4A1936] mt-2 leading-relaxed">
              Conoce la ubicación oficial de{" "}
              <strong>{BUSINESS_INFO.mapsPlaceName}</strong> en Google Maps y traza tu ruta directa
              hacia nuestro establecimiento.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-pink-200/90 p-5 sm:p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-5">
            <div className="flex items-start gap-3.5 text-center sm:text-left">
              <div className="hidden sm:flex w-12 h-12 rounded-2xl bg-[#D81B60] text-white items-center justify-center shrink-0 shadow-sm">
                <Store className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <span className="inline-block text-[11px] font-extrabold uppercase tracking-wider text-[#D81B60]">
                  Ubicación Oficial Registrada
                </span>
                <h3 className="text-base sm:text-lg font-extrabold text-[#6A1B4D]">
                  {BUSINESS_INFO.mapsPlaceName}
                </h3>
                <p className="text-xs text-gray-600 max-w-xl leading-relaxed">
                  Abre nuestra ubicación verificada en Google Maps para consultar cómo llegar en
                  tiempo real o escríbenos por WhatsApp si deseas confirmar existencias antes de tu
                  visita.
                </p>
                <div className="pt-1">
                  <a
                    href={BUSINESS_INFO.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#D81B60] hover:underline"
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    <span>Ver en Google Maps ({BUSINESS_INFO.mapsUrl})</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 shrink-0">
              <motion.a
                href={BUSINESS_INFO.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className="btn-shimmer inline-flex items-center gap-2 py-3 px-6 rounded-full bg-gradient-to-r from-[#E91E63] via-[#D81B60] to-[#AD1457] text-white text-xs sm:text-sm font-bold shadow-boutique transition"
              >
                <Navigation className="w-4 h-4" />
                <span>Cómo llegar</span>
              </motion.a>

              <a
                href={BUSINESS_INFO.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 py-3 px-5 rounded-full bg-pink-50 hover:bg-pink-100 border border-pink-200 text-[#6A1B4D] text-xs sm:text-sm font-bold transition"
              >
                <MapPin className="w-4 h-4 text-[#D81B60]" />
                <span>Abrir Google Maps</span>
                <ExternalLink className="w-3.5 h-3.5 text-[#D81B60]" />
              </a>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Sección de Contacto e Información Comercial */}
      <motion.section
        id="contacto"
        aria-labelledby="titulo-contacto"
        initial={{ opacity: 0, y: 22 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="max-w-[1320px] mx-auto px-4 sm:px-6 pb-8"
      >
        <div className="bg-white rounded-3xl border border-pink-200 shadow-card p-6 sm:p-8">
          <div className="max-w-2xl mx-auto mb-8 text-center">
            <BoutiqueSectionHeading
              id="titulo-contacto"
              title="Contacto e Información de nuestra Tienda"
              badgeText="Atención Directa y Amable"
            />
            <p className="text-xs sm:text-sm text-gray-600 mt-2">
              Estamos listos para ayudarte a encontrar el peluche, juguete, disfraz, regalo o
              artículo de fiesta ideal para tu ocasión.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* 1. WhatsApp Oficial */}
            <motion.div
              whileHover={{ y: -4 }}
              className="p-5 rounded-2xl bg-[#FDF2F7] border border-pink-200/80 shadow-sm flex flex-col justify-between transition-shadow hover:shadow-boutique"
            >
              <div>
                <div className="w-10 h-10 rounded-2xl bg-[#25D366] text-white flex items-center justify-center mb-3 shadow-sm">
                  <PhoneCall className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-[#6A1B4D]">WhatsApp Comercial</h3>
                <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                  Atención rápida para consultar existencias actuales, modelos de juguetes y
                  peluches, regalos o tallas de disfraces disponibles.
                </p>
                <p className="text-lg font-extrabold text-[#C2185B] mt-2">
                  {BUSINESS_INFO.whatsappFormatted}
                </p>
              </div>
              <motion.a
                href={getDirectWhatsAppUrl()}
                target="_blank"
                rel="noopener noreferrer"
                whileTap={{ scale: 0.96 }}
                className="btn-shimmer mt-4 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-full bg-[#25D366] hover:bg-[#1DA851] text-white text-xs font-bold shadow transition"
              >
                <MessageSquareHeart className="w-4 h-4" />
                <span>Escribir por WhatsApp</span>
              </motion.a>
            </motion.div>

            {/* 2. Ubicación Real en Google Maps */}
            <motion.div
              whileHover={{ y: -4 }}
              className="p-5 rounded-2xl bg-[#FDF2F7] border border-pink-200/80 shadow-sm flex flex-col justify-between transition-shadow hover:shadow-boutique"
            >
              <div>
                <div className="w-10 h-10 rounded-2xl bg-[#D81B60] text-white flex items-center justify-center mb-3 shadow-sm">
                  <MapPin className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-[#6A1B4D]">
                  {BUSINESS_INFO.mapsPlaceName}
                </h3>
                <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                  {BUSINESS_INFO.deliveryNotice}
                </p>
              </div>
              <div className="mt-4 space-y-2">
                <a
                  href={BUSINESS_INFO.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-shimmer w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-full bg-[#D81B60] hover:bg-[#AD1457] text-white text-xs font-bold shadow transition"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Cómo llegar (Google Maps)</span>
                </a>
              </div>
            </motion.div>

            {/* 3. Atención y Compra Confiable (sin inventar horarios) */}
            <motion.div
              whileHover={{ y: -4 }}
              className="p-5 rounded-2xl bg-[#FDF2F7] border border-pink-200/80 shadow-sm flex flex-col justify-between transition-shadow hover:shadow-boutique"
            >
              <div>
                <div className="w-10 h-10 rounded-2xl bg-[#F59E0B] text-white flex items-center justify-center mb-3 shadow-sm">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-[#6A1B4D]">Atención y Compra Confiable</h3>
                <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                  {BUSINESS_INFO.scheduleNotice}
                </p>
              </div>
              <div className="mt-4 flex items-center gap-2 p-3 rounded-xl bg-white border border-pink-100 text-[11px] text-[#6A1B4D] font-semibold">
                <ShieldCheck className="w-4 h-4 text-[#D81B60] shrink-0" />
                <span>Trato directo y confiable con nuestro establecimiento</span>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.section>
    </div>
  );
}
