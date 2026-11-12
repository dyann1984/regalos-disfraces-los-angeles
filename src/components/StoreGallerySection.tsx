"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Store, Sparkles, PhoneCall, X, ZoomIn } from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { BUSINESS_INFO } from "@/data/mockCatalog";
import { getDirectWhatsAppUrl } from "@/lib/whatsapp";
import { BoutiqueSectionHeading } from "@/components/BrandDetails";
import { StoreGalleryPhoto } from "@/types/store";

export default function StoreGallerySection() {
  const { storeGallery } = useStore();
  const [selectedPhoto, setSelectedPhoto] = useState<StoreGalleryPhoto | null>(null);

  return (
    <motion.section
      id="nuestra-tienda"
      aria-labelledby="titulo-nuestra-tienda"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className="max-w-[1320px] mx-auto px-4 sm:px-6 py-8"
    >
      <div className="relative rounded-3xl bg-gradient-to-r from-[#FCE4EC] via-[#FDF2F7] to-[#FCE4EC] border border-pink-200 shadow-boutique p-6 sm:p-8 lg:p-10 overflow-hidden">
        {/* Cinta dorada superior discreta */}
        <div
          aria-hidden="true"
          className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-pink-200 via-[#F59E0B]/50 to-pink-200"
        />

        {/* Encabezado de la sección */}
        <div className="max-w-2xl mx-auto text-center mb-8">
          <BoutiqueSectionHeading
            id="titulo-nuestra-tienda"
            title="Conoce nuestra tienda"
            badgeText="Galería de Regalos, Disfraces y Más — Los Ángeles"
          />
          <p className="text-sm sm:text-base text-[#4A1936] font-medium mt-3 leading-relaxed">
            {BUSINESS_INFO.subSlogan}. Visítanos y descubre todo el surtido que tenemos preparado
            para toda la familia.
          </p>
        </div>

        {/* Cuadrícula de 6 fotografías de la tienda */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {storeGallery.map((item, idx) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: idx * 0.05 }}
              whileHover={{ y: -5 }}
              onClick={() => setSelectedPhoto(item)}
              className="group cursor-pointer bg-white rounded-2xl border border-pink-200/80 shadow-card hover:shadow-boutiqueHover overflow-hidden flex flex-col transition-shadow duration-300"
            >
              <div className="relative aspect-[4/3] w-full bg-[#FDF2F7] overflow-hidden">
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-between p-3">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/95 text-[#6A1B4D] text-[11px] font-bold shadow">
                    <ZoomIn className="w-3.5 h-3.5 text-[#D81B60]" />
                    <span>Ampliar vista</span>
                  </span>
                </div>
              </div>
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#D81B60] uppercase tracking-wider">
                    <Store className="w-3.5 h-3.5" />
                    <span>Espacio #{idx + 1}</span>
                  </div>
                  <h3 className="text-sm font-bold text-[#6A1B4D] mt-1 group-hover:text-[#D81B60] transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs text-gray-600 mt-1 leading-relaxed">{item.caption}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Barra inferior de invitación y contacto directo */}
        <div className="mt-8 bg-white/90 rounded-2xl p-4 sm:p-5 border border-pink-200 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3 text-center sm:text-left">
            <span className="hidden sm:flex w-10 h-10 rounded-2xl bg-pink-100 text-[#D81B60] items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </span>
            <div>
              <h4 className="text-sm font-bold text-[#6A1B4D]">
                ¿Buscas algún juguete, peluche, disfraz o regalo en especial?
              </h4>
              <p className="text-xs text-gray-600 mt-0.5">
                Escríbenos por WhatsApp y con gusto te confirmamos modelos y existencias actuales en
                tienda.
              </p>
            </div>
          </div>

          <motion.a
            href={getDirectWhatsAppUrl(
              "¡Hola! Vi la galería de Regalos, Disfraces y Más — Los Ángeles y me gustaría consultar qué modelos tienen disponibles en tienda."
            )}
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            className="btn-shimmer shrink-0 inline-flex items-center gap-2 bg-gradient-to-r from-[#25D366] to-[#1DA851] text-white text-xs sm:text-sm font-bold px-5 py-2.5 rounded-full shadow-md transition"
          >
            <PhoneCall className="w-4 h-4" />
            <span>Preguntar por WhatsApp ({BUSINESS_INFO.whatsappDisplay})</span>
          </motion.a>
        </div>
      </div>

      {/* Modal Lightbox para ver fotografía ampliada */}
      <AnimatePresence>
        {selectedPhoto && (
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={selectedPhoto.title}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedPhoto(null)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-pink-200 p-4 sm:p-6"
            >
              <button
                type="button"
                onClick={() => setSelectedPhoto(null)}
                aria-label="Cerrar imagen"
                className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-white/90 hover:bg-pink-100 text-[#6A1B4D] flex items-center justify-center shadow"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="aspect-[4/3] w-full rounded-2xl overflow-hidden bg-[#FDF2F7]">
                <img
                  src={selectedPhoto.image}
                  alt={selectedPhoto.title}
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="mt-4">
                <h3 className="text-base sm:text-lg font-extrabold text-[#6A1B4D]">
                  {selectedPhoto.title}
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 mt-1">{selectedPhoto.caption}</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
}
