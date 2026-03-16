import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ERP TEMPLARIOS S.R.L. - Sistema de Gestión de Flotas",
  description: "Sistema integral de gestión de flotas y transporte terrestre para TEMPLARIOS S.R.L. Gestión de viajes, conductores, vehículos y facturación.",
  keywords: ["ERP", "Transporte", "Flotas", "Logística", "TEMPLARIOS", "Bolivia", "Gestión"],
  authors: [{ name: "TEMPLARIOS S.R.L." }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "ERP TEMPLARIOS S.R.L.",
    description: "Sistema de Gestión de Flotas y Transporte",
    siteName: "ERP TEMPLARIOS",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
