"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Star, Sparkles, Heart } from "lucide-react";

const CONFETTI_PIECES = [
  { id: 1, x: -95, y: -85, rot: -45, color: "#D81B60", shape: "star" },
  { id: 2, x: -55, y: -110, rot: 25, color: "#F59E0B", shape: "dot" },
  { id: 3, x: -20, y: -95, rot: -15, color: "#EC407A", shape: "heart" },
  { id: 4, x: 20, y: -105, rot: 35, color: "#F59E0B", shape: "star" },
  { id: 5, x: 60, y: -90, rot: -30, color: "#AD1457", shape: "dot" },
  { id: 6, x: 95, y: -80, rot: 50, color: "#F48FB1", shape: "heart" },
  { id: 7, x: -75, y: -45, rot: 15, color: "#FBBF24", shape: "star" },
  { id: 8, x: 75, y: -50, rot: -25, color: "#E91E63", shape: "dot" },
  { id: 9, x: -35, y: -65, rot: 40, color: "#10B981", shape: "dot" },
  { id: 10, x: 40, y: -70, rot: -35, color: "#F59E0B", shape: "heart" },
];

/**
 * Confeti discreto que se dispara únicamente una vez al completar una acción importante
 * (ej. confirmar un pedido o aplicar un cupón). Respeta prefers-reduced-motion.
 */
export function CelebrationConfetti({ active }: { active: boolean }) {
  const shouldReduceMotion = useReducedMotion();

  if (!active || shouldReduceMotion) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[60] flex items-center justify-center overflow-hidden"
    >
      <div className="relative w-1 h-1">
        {CONFETTI_PIECES.map((p) => (
          <motion.span
            key={p.id}
            initial={{ opacity: 1, x: 0, y: 0, scale: 0.4, rotate: 0 }}
            animate={{
              opacity: [1, 1, 0],
              x: p.x * 1.6,
              y: [0, p.y * 1.3, p.y * 0.4 + 90],
              scale: [0.5, 1.15, 0.8],
              rotate: p.rot * 3,
            }}
            transition={{ duration: 1.35, ease: "easeOut" }}
            className="absolute left-0 top-0"
            style={{ color: p.color }}
          >
            {p.shape === "star" && <Star className="w-4 h-4 fill-current" />}
            {p.shape === "heart" && <Heart className="w-3.5 h-3.5 fill-current" />}
            {p.shape === "dot" && (
              <span
                className="block w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: p.color }}
              />
            )}
          </motion.span>
        ))}
      </div>
    </div>
  );
}

/**
 * Encabezado de sección con detalles de marca boutique:
 * Estrellas doradas, cinta decorativa sutil y tipografía Poppins sin cursivas.
 */
export function BoutiqueSectionHeading({
  id,
  title,
  badgeText,
}: {
  id?: string;
  title: string;
  badgeText?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center">
      {badgeText && (
        <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-pink-50 border border-pink-200/80 text-[#AD1457] text-[11px] font-semibold tracking-wide uppercase mb-2 shadow-sm">
          <Sparkles className="w-3 h-3 text-[#F59E0B]" />
          <span>{badgeText}</span>
        </span>
      )}
      <div className="flex items-center justify-center gap-3">
        <div className="hidden sm:flex items-center gap-1.5">
          <div className="h-[1.5px] w-16 md:w-28 bg-gradient-to-r from-transparent via-pink-300 to-[#F59E0B]/60 rounded-full" />
          <Heart className="w-3 h-3 text-pink-400 fill-pink-300" />
        </div>

        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-50 border border-amber-200/80 shadow-sm">
          <Star className="w-4 h-4 text-[#F59E0B] fill-[#F59E0B]" />
        </span>

        <h2
          id={id}
          className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#6A1B4D] text-center"
        >
          {title}
        </h2>

        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-50 border border-amber-200/80 shadow-sm">
          <Star className="w-4 h-4 text-[#F59E0B] fill-[#F59E0B]" />
        </span>

        <div className="hidden sm:flex items-center gap-1.5">
          <Heart className="w-3 h-3 text-pink-400 fill-pink-300" />
          <div className="h-[1.5px] w-16 md:w-28 bg-gradient-to-l from-transparent via-pink-300 to-[#F59E0B]/60 rounded-full" />
        </div>
      </div>
    </div>
  );
}
