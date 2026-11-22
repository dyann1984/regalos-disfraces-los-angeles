"use client";

import React, { useEffect, useState } from "react";
import QRCode from "qrcode";
import {
  Download,
  QrCode,
  Share2,
  Copy,
  Check,
  ExternalLink,
  PhoneCall,
} from "lucide-react";
import { BUSINESS_INFO } from "@/data/mockCatalog";
import {
  buildStoreFacebookShareUrl,
  buildStoreWhatsAppShareUrl,
  CATALOG_PUBLIC_URL,
} from "@/lib/whatsapp";
import { trackStoreEvent } from "@/lib/metrics";

interface CatalogQRCodeCardProps {
  compact?: boolean;
  onShowToast?: (msg: string, variant?: "success" | "error" | "info") => void;
}

export default function CatalogQRCodeCard({
  compact = false,
  onShowToast,
}: CatalogQRCodeCardProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let active = true;
    QRCode.toDataURL(CATALOG_PUBLIC_URL, {
      errorCorrectionLevel: "H",
      margin: 2,
      width: 520,
      color: {
        dark: "#6A1B4D",
        light: "#FFFFFF",
      },
    })
      .then((url) => {
        if (active) setQrDataUrl(url);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const handleDownloadBrandedPNG = async () => {
    if (!qrDataUrl || downloading) return;
    setDownloading(true);
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 1000;
      canvas.height = 1260;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("No se pudo generar el archivo PNG.");

      // Fondo rosa suave boutique
      const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      grad.addColorStop(0, "#FCE4EC");
      grad.addColorStop(0.5, "#FFF9FB");
      grad.addColorStop(1, "#FCE4EC");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Marco interior blanco
      ctx.fillStyle = "#FFFFFF";
      ctx.strokeStyle = "#F48FB1";
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.roundRect(56, 56, canvas.width - 112, canvas.height - 112, 42);
      ctx.fill();
      ctx.stroke();

      // Encabezado
      ctx.fillStyle = "#D81B60";
      ctx.font = "700 28px Poppins, Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("CATÁLOGO EN LÍNEA", canvas.width / 2, 138);

      ctx.fillStyle = "#6A1B4D";
      ctx.font = "800 40px Poppins, Arial, sans-serif";
      ctx.fillText("Regalos, Disfraces y Más", canvas.width / 2, 195);

      ctx.fillStyle = "#AD1457";
      ctx.font = "800 44px Poppins, Arial, sans-serif";
      ctx.fillText("— LOS ÁNGELES —", canvas.width / 2, 248);

      // Dibujar QR nítido
      await new Promise<void>((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          const qrSize = 640;
          const x = (canvas.width - qrSize) / 2;
          const y = 290;
          ctx.drawImage(img, x, y, qrSize, qrSize);
          resolve();
        };
        img.onerror = () => reject(new Error("Error dibujando el código QR."));
        img.src = qrDataUrl;
      });

      // Pie informativo
      ctx.fillStyle = "#6A1B4D";
      ctx.font = "700 32px Poppins, Arial, sans-serif";
      ctx.fillText("Escanea con tu cámara para ver productos", canvas.width / 2, 998);

      ctx.fillStyle = "#D81B60";
      ctx.font = "600 24px Poppins, Arial, sans-serif";
      ctx.fillText("regalos-disfraces-los-angeles.vercel.app/catalogo", canvas.width / 2, 1052);

      ctx.fillStyle = "#1DA851";
      ctx.font = "700 28px Poppins, Arial, sans-serif";
      ctx.fillText(`WhatsApp: ${BUSINESS_INFO.whatsappFormatted}`, canvas.width / 2, 1124);

      const link = document.createElement("a");
      link.download = "qr-catalogo-los-angeles.png";
      link.href = canvas.toDataURL("image/png");
      link.click();

      trackStoreEvent("qr_download");
      onShowToast?.("Código QR descargado listo para imprimir o compartir.", "success");
    } catch {
      onShowToast?.("No se pudo descargar el código QR.", "error");
    } finally {
      setDownloading(false);
    }
  };

  const handleCopyStoreUrl = async () => {
    try {
      await navigator.clipboard.writeText(CATALOG_PUBLIC_URL);
      setCopied(true);
      trackStoreEvent("share_click");
      onShowToast?.("¡Enlace del catálogo copiado!", "success");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      onShowToast?.(CATALOG_PUBLIC_URL, "info");
    }
  };

  return (
    <div
      className={`rounded-3xl bg-gradient-to-br from-[#FFF0F6] via-white to-[#FCE4EC]/70 border border-pink-200 shadow-card ${
        compact ? "p-4 sm:p-5" : "p-5 sm:p-8"
      }`}
    >
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* Código QR */}
        <div className="md:col-span-4 flex flex-col items-center">
          <div className="bg-white p-3.5 rounded-3xl border-2 border-pink-200 shadow-boutique inline-flex flex-col items-center gap-2">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt="Código QR del catálogo de Regalos, Disfraces y Más — Los Ángeles"
                width={208}
                height={208}
                className="w-44 h-44 sm:w-52 sm:h-52 object-contain rounded-xl"
              />
            ) : (
              <div className="w-44 h-44 sm:w-52 sm:h-52 rounded-xl bg-pink-50 flex items-center justify-center text-[#D81B60]">
                <QrCode className="w-12 h-12 animate-pulse" />
              </div>
            )}
            <span className="text-[11px] font-extrabold text-[#6A1B4D] uppercase tracking-wider">
              Escanea el catálogo
            </span>
          </div>
        </div>

        {/* Texto + Acciones de descarga y compartir */}
        <div className="md:col-span-8 space-y-4 text-center md:text-left">
          <div className="space-y-1.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-pink-200 text-[#D81B60] text-[11px] font-extrabold shadow-sm">
              <QrCode className="w-3.5 h-3.5" />
              <span>Catálogo Digital y Código QR</span>
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#6A1B4D] leading-tight">
              Comparte nuestra tienda o descarga el código QR
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 max-w-xl mx-auto md:mx-0 leading-relaxed">
              Escanea el código desde cualquier celular para abrir directamente el catálogo
              actualizado de <strong>{BUSINESS_INFO.name}</strong>, o descárgalo en alta calidad
              para mostrarlo en tienda, bolsas y estados de WhatsApp.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5">
            <button
              type="button"
              disabled={!qrDataUrl || downloading}
              onClick={handleDownloadBrandedPNG}
              className="btn-shimmer inline-flex items-center gap-2 px-5 py-3 rounded-full bg-gradient-to-r from-[#E91E63] via-[#D81B60] to-[#AD1457] text-white text-xs sm:text-sm font-bold shadow-md disabled:opacity-50 transition"
            >
              <Download className="w-4 h-4" />
              <span>{downloading ? "Generando PNG..." : "Descargar QR (PNG)"}</span>
            </button>

            <a
              href={buildStoreWhatsAppShareUrl()}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackStoreEvent("share_click")}
              className="inline-flex items-center gap-2 px-4 py-3 rounded-full bg-[#25D366] hover:bg-[#1DA851] text-white text-xs sm:text-sm font-bold shadow-sm transition"
            >
              <PhoneCall className="w-4 h-4" />
              <span>Compartir en WhatsApp</span>
            </a>

            <a
              href={buildStoreFacebookShareUrl()}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackStoreEvent("share_click")}
              className="inline-flex items-center gap-2 px-4 py-3 rounded-full bg-[#1877F2] hover:bg-[#1465C9] text-white text-xs sm:text-sm font-bold shadow-sm transition"
            >
              <Share2 className="w-4 h-4" />
              <span>Compartir en Facebook</span>
            </a>

            <button
              type="button"
              onClick={handleCopyStoreUrl}
              className="inline-flex items-center gap-1.5 px-4 py-3 rounded-full bg-white border border-pink-200 text-[#6A1B4D] hover:bg-pink-50 text-xs sm:text-sm font-bold transition"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>¡Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-[#D81B60]" />
                  <span>Copiar enlace</span>
                </>
              )}
            </button>
          </div>

          <p className="text-[11px] text-gray-500 flex items-center justify-center md:justify-start gap-1">
            <ExternalLink className="w-3 h-3 text-[#D81B60]" />
            <span>Destino del QR: {CATALOG_PUBLIC_URL}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
