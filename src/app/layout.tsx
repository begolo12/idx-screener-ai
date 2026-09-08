import type { Metadata, Viewport } from "next";
import { PwaProvider } from "@/components/pwa/pwa-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "IDX Stock Screener & AI Strategy Lab",
  description: "Screener saham BEI, analisa durasi winrate AI, dan kurasi berita pasar modal Indonesia",
  applicationName: "IDX Screener",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "IDX Screener",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#0f172a",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className="light">
      <body className="bg-slate-100 min-h-screen text-slate-900 antialiased flex flex-col items-center">
        <main className="w-full max-w-md min-h-screen flex flex-col relative shadow-lg bg-white border-x border-slate-200/80">
          <PwaProvider>
            {children}
          </PwaProvider>
        </main>
      </body>
    </html>
  );
}
