"use client";

import { useEffect, useState } from "react";
import { Download, X, Share } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export function PwaProvider({ children }: { children: React.ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // 1. Register Service Worker
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((reg) => {
            console.log("[PWA] ServiceWorker registered with scope:", reg.scope);
          })
          .catch((err) => {
            console.warn("[PWA] ServiceWorker registration failed:", err);
          });
      });
    }

    // 2. Check if already installed / standalone
    const isAppStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;

    if (isAppStandalone) {
      setIsStandalone(true);
      return;
    }

    // 3. Detect iOS Safari
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIos(isIosDevice);

    // 4. Handle Android/Desktop beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Check if user previously dismissed banner in current session
      const dismissed = sessionStorage.getItem("idx_pwa_dismissed");
      if (!dismissed) {
        setShowInstallBanner(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // 5. Handle app installed
    const handleAppInstalled = () => {
      setShowInstallBanner(false);
      setDeferredPrompt(null);
      setIsStandalone(true);
      console.log("[PWA] App was successfully installed");
    };

    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setShowInstallBanner(false);
        setDeferredPrompt(null);
      }
    } else if (isIos) {
      setShowIosGuide(true);
    }
  };

  const handleDismiss = () => {
    setShowInstallBanner(false);
    sessionStorage.setItem("idx_pwa_dismissed", "true");
  };

  return (
    <>
      {children}

      {/* PWA Floating Install Banner */}
      {showInstallBanner && !isStandalone && (
        <div className="fixed bottom-20 left-4 right-4 z-50 max-w-md mx-auto animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="bg-slate-900/95 backdrop-blur-md text-white p-3 rounded-2xl shadow-2xl border border-slate-700/80 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/icon-192.png"
                alt="App Icon"
                className="w-10 h-10 rounded-xl shadow-sm shrink-0 border border-slate-700"
              />
              <div className="min-w-0">
                <h4 className="text-xs font-semibold text-white truncate">Pasang Aplikasi IDX Screener</h4>
                <p className="text-[11px] text-slate-400 truncate">Install ke layar utama HP (Offline &amp; Cepat)</p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleInstallClick}
                className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 active:scale-95 transition-all text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-md shadow-emerald-950/20"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Pasang</span>
              </button>
              <button
                type="button"
                onClick={handleDismiss}
                aria-label="Tutup"
                className="p-1.5 text-slate-400 hover:text-slate-200 active:scale-90 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* iOS Safari Installation Guide Modal */}
      {showIosGuide && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl p-5 w-full max-w-sm shadow-2xl border border-slate-100 flex flex-col gap-4 text-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/apple-touch-icon.png" alt="Icon" className="w-9 h-9 rounded-xl border border-slate-200" />
                <h3 className="font-bold text-sm text-slate-900">Pasang di iPhone/iPad</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowIosGuide(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-slate-600 space-y-2.5 bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center shrink-0 text-[11px]">
                  1
                </span>
                <p>
                  Tekan ikon <strong className="text-slate-800 inline-flex items-center gap-1"><Share className="w-3 h-3 inline" /> Bagikan (Share)</strong> di menu bawah Safari.
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center shrink-0 text-[11px]">
                  2
                </span>
                <p>
                  Gulir ke bawah dan pilih <strong className="text-slate-800">&quot;Tambah ke Layar Utama&quot; (Add to Home Screen)</strong>.
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center shrink-0 text-[11px]">
                  3
                </span>
                <p>
                  Tekan tombol <strong className="text-slate-800">&quot;Tambah&quot; (Add)</strong> di pojok kanan atas.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowIosGuide(false)}
              className="w-full py-2.5 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 active:scale-95 transition-all text-center"
            >
              Mengerti
            </button>
          </div>
        </div>
      )}
    </>
  );
}
