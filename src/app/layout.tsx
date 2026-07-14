import type { Metadata, Viewport } from "next";

import { ConnectionBanner } from "@/features/pwa/connection-banner";
import { RegisterServiceWorker } from "@/features/pwa/register-service-worker";
import { publicEnv } from "@/lib/env";

import "./globals.css";

export const metadata: Metadata = {
  title: "ITU eAccess",
  description: "Sistem rekod masuk dan keluar bilik ITU yang mudah, selamat dan teratur.",
  applicationName: "ITU eAccess",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icon-192.png", sizes: "192x192", type: "image/png" }],
  },
  appleWebApp: { capable: true, statusBarStyle: "default", title: "ITU eAccess" },
};

export const viewport: Viewport = { themeColor: "#1D388C", colorScheme: "light" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ms">
      <body>
        <RegisterServiceWorker />
        <ConnectionBanner fallbackUrl={publicEnv.NEXT_PUBLIC_FALLBACK_FORM_URL} />
        {children}
      </body>
    </html>
  );
}
