import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { StoreProvider } from "@/context/StoreContext";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  style: ["normal"],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Regalos, Disfraces y Más — Los Ángeles | Tienda de Regalos y Juguetes en México",
  description:
    "Regalos increíbles para cada ocasión. Encuentra peluches, juguetes, disfraces, regalos, artículos para fiestas y muchas sorpresas más. WhatsApp +52 56 3547 8874.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es-MX" className={poppins.variable}>
      <body className="font-sans antialiased selection:bg-[#F48FB1] selection:text-[#6A1B4D]">
        <StoreProvider>{children}</StoreProvider>
      </body>
    </html>
  );
}
