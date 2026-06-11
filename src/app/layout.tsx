import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SmartCifra — Aprenda música com IA",
  description:
    "Plataforma de cifras inteligentes com professor IA, geração automática de cifras a partir de áudio e player interativo.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-gray-950 text-gray-100">
        <Navbar />
        <main className="flex-1">{children}</main>
        <footer className="py-6 text-center text-sm text-gray-500 border-t border-gray-800">
          © {new Date().getFullYear()} SmartCifra — Todos os direitos reservados
        </footer>
      </body>
    </html>
  );
}
