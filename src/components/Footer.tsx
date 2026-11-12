"use client";

import React from "react";
import Link from "next/link";
import { PhoneCall, Shield, Lock, Heart, MapPin, Navigation, ExternalLink } from "lucide-react";
import { BUSINESS_INFO } from "@/data/mockCatalog";
import { getDirectWhatsAppUrl } from "@/lib/whatsapp";

export default function Footer() {
  return (
    <footer className="bg-gradient-to-b from-[#FCE4EC] to-[#F8BBD0]/80 border-t border-pink-200 text-[#4A1936] mt-10">
      <div className="max-w-[1320px] mx-auto px-4 sm:px-6 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Columna 1: Marca y Ubicación Oficial */}
          <div className="space-y-3">
            <div className="inline-block bg-white/90 p-2 rounded-2xl shadow-sm border border-pink-100">
              <img
                src="/images/logo-header.jpg"
                alt={BUSINESS_INFO.name}
                className="h-14 w-auto object-contain rounded-lg"
              />
            </div>
            <p className="text-xs leading-relaxed text-[#5A2244] font-medium">
              {BUSINESS_INFO.subSlogan}.
            </p>
            <p className="text-xs font-extrabold text-[#880E4F]">
              WhatsApp Oficial: {BUSINESS_INFO.whatsappFormatted}
            </p>
            <div className="pt-1 space-y-1.5">
              <p className="text-xs font-bold text-[#6A1B4D] flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-[#D81B60] shrink-0" />
                <span>{BUSINESS_INFO.mapsPlaceName}</span>
              </p>
              <a
                href={BUSINESS_INFO.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#D81B60] hover:underline"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>Cómo llegar en Google Maps</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Columna 2: Categorías Principales y Catálogo */}
          <div>
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-[#6A1B4D] mb-3">
              Catálogo y Categorías
            </h3>
            <ul className="space-y-1.5 text-xs font-semibold">
              <li>
                <Link href="/catalogo" className="text-[#D81B60] font-extrabold hover:underline">
                  ✨ Ver todo el catálogo
                </Link>
              </li>
              <li>
                <Link href="/catalogo?categoria=peluches" className="hover:text-[#D81B60]">
                  Peluches
                </Link>
              </li>
              <li>
                <Link href="/catalogo?categoria=juguetes" className="hover:text-[#D81B60]">
                  Juguetes
                </Link>
              </li>
              <li>
                <Link href="/catalogo?categoria=regalos" className="hover:text-[#D81B60]">
                  Regalos
                </Link>
              </li>
              <li>
                <Link href="/catalogo?categoria=disfraces" className="hover:text-[#D81B60]">
                  Disfraces
                </Link>
              </li>
              <li>
                <Link
                  href="/catalogo?categoria=fiestas-celebraciones"
                  className="hover:text-[#D81B60]"
                >
                  Artículos para fiestas
                </Link>
              </li>
              <li>
                <Link
                  href="/catalogo?categoria=accesorios-otros"
                  className="hover:text-[#D81B60]"
                >
                  Accesorios
                </Link>
              </li>
            </ul>
          </div>

          {/* Columna 3: Información Comercial */}
          <div>
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-[#6A1B4D] mb-3">
              Información Comercial
            </h3>
            <ul className="space-y-2 text-xs text-[#5A2244]">
              <li className="flex items-start gap-1.5">
                <Shield className="w-3.5 h-3.5 text-[#D81B60] shrink-0 mt-0.5" />
                <span>
                  Todos nuestros productos son artículos terminados y listos para obsequiar y
                  celebrar en tienda.
                </span>
              </li>
              <li className="flex items-start gap-1.5">
                <Shield className="w-3.5 h-3.5 text-[#D81B60] shrink-0 mt-0.5" />
                <span>
                  Precios en Pesos Mexicanos (MXN) y existencias sujetas a confirmación en tienda.
                </span>
              </li>
              <li className="flex items-start gap-1.5">
                <Shield className="w-3.5 h-3.5 text-[#D81B60] shrink-0 mt-0.5" />
                <span>
                  Protección de datos de contacto conforme a las buenas prácticas comerciales en
                  México.
                </span>
              </li>
            </ul>
          </div>

          {/* Columna 4: Ubicación, WhatsApp y Administración */}
          <div className="space-y-3">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-[#6A1B4D] mb-2">
              Visítanos y Contáctanos
            </h3>
            <div className="flex flex-wrap gap-2">
              <a
                href={getDirectWhatsAppUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#1DA851] text-white text-xs font-bold px-4 py-2.5 rounded-full shadow transition"
              >
                <PhoneCall className="w-4 h-4" />
                <span>WhatsApp {BUSINESS_INFO.whatsappDisplay}</span>
              </a>

              <a
                href={BUSINESS_INFO.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 bg-[#D81B60] hover:bg-[#AD1457] text-white text-xs font-bold px-4 py-2.5 rounded-full shadow transition"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>Cómo llegar</span>
              </a>
            </div>

            <div className="pt-1 flex flex-wrap gap-2">
              <Link
                href="/#nuestra-tienda"
                className="inline-block px-3.5 py-1.5 rounded-full bg-white/85 border border-pink-200 text-xs font-bold text-[#880E4F] hover:bg-white transition"
              >
                🏪 Conoce nuestra tienda
              </Link>
              <a
                href={BUSINESS_INFO.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full bg-white/85 border border-pink-200 text-xs font-bold text-[#880E4F] hover:bg-white transition"
              >
                <MapPin className="w-3.5 h-3.5 text-[#D81B60]" />
                <span>Google Maps</span>
              </a>
            </div>

            <div className="pt-3 border-t border-pink-300/60">
              <Link
                href="/admin"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#6A1B4D] hover:text-[#D81B60]"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Acceso Propietaria (/admin)</span>
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-4 border-t border-pink-300/60 flex flex-col sm:flex-row items-center justify-between text-xs text-[#5A2244] gap-2">
          <p>
            © {new Date().getFullYear()} <strong>{BUSINESS_INFO.name}</strong> (
            {BUSINESS_INFO.mapsPlaceName}). Todos los derechos reservados.
          </p>
          <p className="flex items-center gap-1 font-semibold">
            <span>Hecho con</span>
            <Heart className="w-3.5 h-3.5 text-[#D81B60] fill-current" />
            <span>para toda la familia</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
