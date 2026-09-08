"use client";

import React, { useState } from "react";
import { Activity, WifiOff, Info, X } from "lucide-react";

interface HeaderProps {
  overview: {
    ihsg?: { value: string; change: string; changePct: string };
    foreignFlow?: { netBuySell: string };
    marketStatus?: string;
    updatedAt?: string;
    isFallback?: boolean;
  } | null;
}

export function MarketHeader({ overview }: HeaderProps) {
  const [showInfo, setShowInfo] = useState(false);
  const ihsg = overview?.ihsg || { value: "7,310.20", change: "+15.40", changePct: "+0.21%" };
  const isUp = !ihsg.changePct.startsWith("-");

  // Determine foreign flow friendly status
  const foreignText = overview?.foreignFlow?.netBuySell || "+Rp 142.5 M (Net Buy)";
  const isForeignBuy = foreignText.toLowerCase().includes("buy") || foreignText.startsWith("+");

  return (
    <div className="bg-white border-b border-slate-200 p-4 sticky top-0 z-30 w-full shadow-xs">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-slate-800">IHSG (Pasar Saham Indonesia)</span>
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <button
              onClick={() => setShowInfo(!showInfo)}
              className="p-0.5 text-slate-400 hover:text-blue-600 transition"
              aria-label="Penjelasan IHSG"
            >
              <Info className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-xl font-bold tabular-nums text-slate-900">{ihsg.value}</span>
            <span
              className={`text-xs font-bold tabular-nums px-1.5 py-0.5 rounded-md ${
                isUp ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
              }`}
            >
              {ihsg.change} ({ihsg.changePct})
            </span>
          </div>
        </div>

        <div className="text-right">
          <div className="flex items-center justify-end gap-1 text-[11px] text-slate-500 font-medium">
            <Activity className="w-3 h-3 text-blue-600" />
            <span>Investor Asing</span>
          </div>
          <p
            className={`text-xs font-bold tabular-nums mt-0.5 ${
              isForeignBuy ? "text-emerald-700" : "text-rose-700"
            }`}
          >
            {foreignText}
          </p>
          {overview?.isFallback && (
            <div className="flex items-center justify-end gap-1 text-[10px] text-amber-600 mt-0.5 font-medium">
              <WifiOff className="w-2.5 h-2.5" />
              <span>Data Tersimpan</span>
            </div>
          )}
        </div>
      </div>

      {/* Helpful Explanation Tooltip for Beginners */}
      {showInfo && (
        <div className="mt-3 p-3 rounded-xl bg-blue-50/80 border border-blue-100 text-xs text-slate-700 space-y-1.5 animate-in fade-in duration-150">
          <div className="flex items-center justify-between font-bold text-blue-900">
            <span>Panduan Singkat Pasar Saham:</span>
            <button onClick={() => setShowInfo(false)} className="text-slate-400 hover:text-slate-600">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="leading-relaxed text-[11px]">
            • <strong>IHSG</strong>: Mengukur rata-rata pergerakan seluruh saham di Bursa Efek Indonesia. Jika hijau (+), rata-rata saham sedang naik hari ini.
          </p>
          <p className="leading-relaxed text-[11px]">
            • <strong>Investor Asing</strong>: Menunjukkan apakah dana dari luar negeri sedang masuk membeli saham (Net Buy) atau keluar menjual saham (Net Sell).
          </p>
        </div>
      )}
    </div>
  );
}
