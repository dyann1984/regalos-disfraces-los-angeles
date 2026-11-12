import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          pinkLight: "#FDF2F7",
          pinkSoft: "#FADCE9",
          pinkPastel: "#F5C2D7",
          fuchsia: "#D81B60",
          fuchsiaDark: "#AD1457",
          fuchsiaVibrant: "#E91E63",
          wine: "#6A1B4D",
          gold: "#F59E0B",
          goldLight: "#FDE68A",
          whatsapp: "#25D366",
          whatsappDark: "#1DA851",
        },
      },
      fontFamily: {
        sans: ["var(--font-poppins)", "Poppins", "system-ui", "sans-serif"],
      },
      boxShadow: {
        boutique:
          "0 10px 30px -5px rgba(216, 27, 96, 0.14), 0 4px 12px -2px rgba(216, 27, 96, 0.07)",
        boutiqueHover:
          "0 20px 38px -8px rgba(216, 27, 96, 0.22), 0 8px 18px -4px rgba(106, 27, 77, 0.12)",
        card: "0 4px 18px rgba(106, 27, 77, 0.08)",
        goldGlow: "0 0 20px rgba(245, 158, 11, 0.28)",
      },
    },
  },
  plugins: [],
};
export default config;
