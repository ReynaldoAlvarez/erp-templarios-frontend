import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { QueryProvider } from "@/components/providers/query-provider";
import { ServiceWorkerRegistration } from "@/components/pwa/service-worker-registration";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#1B3F66",
};

export const metadata: Metadata = {
  title: {
    default: "ERP TEMPLARIOS S.R.L. - Sistema de Gestión de Flotas",
    template: "%s | ERP TEMPLARIOS",
  },
  description: "Sistema integral de gestión de flotas y transporte terrestre para TEMPLARIOS S.R.L. Gestión de viajes, conductores, vehículos y facturación.",
  keywords: ["ERP", "Transporte", "Flotas", "Logística", "TEMPLARIOS", "Bolivia", "Gestión"],
  authors: [{ name: "TEMPLARIOS S.R.L." }],
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/logo.svg", type: "image/svg+xml" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
  },
  openGraph: {
    title: "ERP TEMPLARIOS S.R.L.",
    description: "Sistema de Gestión de Flotas y Transporte",
    siteName: "ERP TEMPLARIOS",
    type: "website",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "ERP TEMPLARIOS",
  },
  formatDetection: {
    telephone: false,
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
        suppressHydrationWarning
      >
        <QueryProvider>
          <ServiceWorkerRegistration />
          {children}
          <Toaster />
        </QueryProvider>
      </body>
    </html>
  );
}
