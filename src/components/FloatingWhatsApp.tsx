"use client";

import React from "react";
import { PhoneCall } from "lucide-react";
import { BUSINESS_INFO } from "@/data/mockCatalog";
import { getDirectWhatsAppUrl } from "@/lib/whatsapp";

export default function FloatingWhatsApp() {
  return (
    <a
      href={getDirectWhatsAppUrl()}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Chatear por WhatsApp al ${BUSINESS_INFO.whatsappFormatted}`}
      className="fixed bottom-5 right-5 z-40 flex items-center gap-2 bg-gradient-to-r from-[#25D366] to-[#1DA851] text-white px-4 py-3 rounded-full shadow-xl hover:shadow-2xl hover:scale-105 transition-all border-2 border-white"
    >
      <PhoneCall className="w-5 h-5 fill-current" />
      <span className="hidden sm:inline text-xs font-extrabold tracking-tight">
        ¿Dudas? WhatsApp {BUSINESS_INFO.whatsappDisplay}
      </span>
    </a>
  );
}
