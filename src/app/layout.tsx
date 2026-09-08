import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "IDX Stock Screener & News",
  description: "Screener saham BEI dan kurasi berita pasar modal Indonesia",
  manifest: "/manifest.json",
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
  themeColor: "#f8fafc",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className="light">
      <body className="bg-slate-100 min-h-screen text-slate-900 antialiased flex flex-col items-center">
        <main className="w-full max-w-md min-h-screen flex flex-col relative shadow-lg bg-white border-x border-slate-200/80">
          {children}
        </main>
      </body>
    </html>
  );
}
