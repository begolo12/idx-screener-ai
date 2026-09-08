"use client";

import React, { useState } from "react";
import { Activity, WifiOff, Info, X } from "lucide-react";

interface HeaderProps {
  overview: {
    ihsg?: { value: string; change: string; changePct: string };
    foreignFlow?: { netBuySell: string };
    breadth?: { up: number; down: number; unchanged: number; total: number };
    marketStatus?: string;
    updatedAt?: string;
    isFallback?: boolean;
  } | null;
}

export function MarketHeader({ overview }: HeaderProps) {
  const [showInfo, setShowInfo] = useState(false);
  const ihsg = overview?.ihsg || { value: "6.686,44", change: "+46.93", changePct: "+1.01%" };
  const isUp = !ihsg.changePct.startsWith("-");

  // Determine foreign flow friendly status
  const foreignText = overview?.foreignFlow?.netBuySell || "+Rp 142.5 M (Net Buy)";
  const isForeignBuy = foreignText.toLowerCase().includes("buy") || foreignText.startsWith("+");
  const breadth = overview?.breadth || { up: 385, down: 248, unchanged: 167, total: 800 };

  return (
    <div className="bg-white border-b border-slate-200 px-4 pt-3.5 pb-2.5 sticky top-0 z-30 w-full shadow-xs">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-slate-900 tracking-tight">IHSG (Indeks Saham Gabungan)</span>
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
            <span className="text-2xl font-black tabular-nums text-slate-900 tracking-tight">{ihsg.value}</span>
            <span
              className={`text-xs font-bold tabular-nums px-2 py-0.5 rounded-lg ${
                isUp ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
              }`}
            >
              {ihsg.change} ({ihsg.changePct})
            </span>
          </div>
        </div>

        <div className="text-right">
          <div className="flex items-center justify-end gap-1 text-[11px] text-slate-500 font-semibold">
            <Activity className="w-3 h-3 text-blue-600" />
            <span>Arus Asing</span>
          </div>
          <p
            className={`text-xs font-bold tabular-nums mt-0.5 ${
              isForeignBuy ? "text-emerald-700" : "text-rose-700"
            }`}
          >
            {foreignText}
          </p>
          {overview?.isFallback ? (
            <div className="flex items-center justify-end gap-1 text-[10px] text-amber-600 mt-0.5 font-medium">
              <WifiOff className="w-2.5 h-2.5" />
              <span>Data Tersimpan</span>
            </div>
          ) : (
            <span className="text-[10px] text-slate-400 block mt-0.5">
              Update {overview?.updatedAt || "Real-time"} WIB
            </span>
          )}
        </div>
      </div>

      {/* Market Breadth Summary Bar */}
      <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
        <div className="flex items-center gap-3 tabular-nums">
          <span className="flex items-center gap-1 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <strong className="text-emerald-700 font-bold">{breadth.up}</strong> Naik
          </span>
          <span className="text-slate-300">•</span>
          <span className="flex items-center gap-1 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            <strong className="text-rose-700 font-bold">{breadth.down}</strong> Turun
          </span>
          <span className="text-slate-300">•</span>
          <span className="flex items-center gap-1 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            <strong className="text-slate-700 font-bold">{breadth.unchanged}</strong> Stagnan
          </span>
        </div>
        <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
          BEI Realtime
        </span>
      </div>

      {/* Helpful Explanation Tooltip for Beginners */}
      {showInfo && (
        <div className="mt-3 p-3.5 rounded-2xl bg-blue-50/90 border border-blue-100 text-xs text-slate-700 space-y-2 animate-in fade-in duration-150">
          <div className="flex items-center justify-between font-bold text-blue-950">
            <span>Panduan Pasar Saham:</span>
            <button onClick={() => setShowInfo(false)} className="text-slate-400 hover:text-slate-600">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="leading-relaxed text-[11px]">
            • <strong>IHSG</strong>: Mengukur rata-rata pergerakan 800+ saham di Bursa Efek Indonesia. Nilai hijau menunjukkan bursa sedang dalam fase kenaikan.
          </p>
          <p className="leading-relaxed text-[11px]">
            • <strong>Arus Asing</strong>: Mengukur selisih beli dan jual bersih (Net Buy/Sell) oleh sekuritas dan institusi luar negeri.
          </p>
          <p className="leading-relaxed text-[11px]">
            • <strong>Market Breadth</strong>: Perbandingan jumlah saham yang menguat (Naik) versus melemah (Turun) untuk mengukur kekuatan pasar secara menyeluruh.
          </p>
        </div>
      )}
    </div>
  );
}
