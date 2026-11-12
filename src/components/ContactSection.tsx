"use client";

import React from "react";
import { motion } from "framer-motion";
import { PhoneCall, Clock, MapPin, ShieldCheck, MessageSquareHeart } from "lucide-react";
import { BUSINESS_INFO } from "@/data/mockCatalog";
import { getDirectWhatsAppUrl } from "@/lib/whatsapp";
import { BoutiqueSectionHeading } from "@/components/BrandDetails";

export default function ContactSection() {
  return (
    <motion.section
      id="contacto"
      aria-labelledby="titulo-contacto"
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className="max-w-[1320px] mx-auto px-4 sm:px-6 py-8"
    >
      <div className="bg-white rounded-3xl border border-pink-200 shadow-card p-6 sm:p-8">
        <div className="max-w-2xl mx-auto mb-8 text-center">
          <BoutiqueSectionHeading
            id="titulo-contacto"
            title="Contacto e Información de nuestra Tienda"
            badgeText="Atención Directa y Amable"
          />
          <p className="text-xs sm:text-sm text-gray-600 mt-2">
            Estamos listos para ayudarte a encontrar el peluche, juguete, disfraz, regalo o artículo
            de fiesta ideal para tu ocasión.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* WhatsApp Oficial */}
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
                Atención rápida para consultar existencias actuales, modelos de juguetes y peluches,
                regalos o tallas de disfraces disponibles.
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

          {/* Modalidades de Compra y Entrega */}
          <motion.div
            whileHover={{ y: -4 }}
            className="p-5 rounded-2xl bg-[#FDF2F7] border border-pink-200/80 shadow-sm flex flex-col justify-between transition-shadow hover:shadow-boutique"
          >
            <div>
              <div className="w-10 h-10 rounded-2xl bg-[#D81B60] text-white flex items-center justify-center mb-3 shadow-sm">
                <MapPin className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-[#6A1B4D]">Tienda Física y Entrega Local</h3>
              <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                {BUSINESS_INFO.deliveryNotice}
              </p>
            </div>
            <div className="mt-4 p-3 rounded-xl bg-white border border-pink-100 text-[11px] text-gray-600">
              📍 Ubicación en México • Consulta cobertura local por WhatsApp antes de confirmar tu
              pedido.
            </div>
          </motion.div>

          {/* Horarios y Garantía */}
          <motion.div
            whileHover={{ y: -4 }}
            className="p-5 rounded-2xl bg-[#FDF2F7] border border-pink-200/80 shadow-sm flex flex-col justify-between transition-shadow hover:shadow-boutique"
          >
            <div>
              <div className="w-10 h-10 rounded-2xl bg-[#F59E0B] text-white flex items-center justify-center mb-3 shadow-sm">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-[#6A1B4D]">Horario y Compra Confiable</h3>
              <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                {BUSINESS_INFO.schedule}
              </p>
            </div>
            <div className="mt-4 flex items-center gap-2 p-3 rounded-xl bg-white border border-pink-100 text-[11px] text-[#6A1B4D] font-semibold">
              <ShieldCheck className="w-4 h-4 text-[#D81B60] shrink-0" />
              <span>Trato directo y confiable con nuestro negocio</span>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.section>
  );
}
