"use client";

import React, { useEffect, useState } from "react";
import {
  X,
  Newspaper,
  Star,
  ExternalLink,
  TrendingUp,
  TrendingDown,
  Calculator,
  Calendar,
} from "lucide-react";
import { PriceRangeBar } from "@/components/screener/price-range-bar";

interface StockModalProps {
  ticker: string | null;
  onClose: () => void;
  isWatchlisted?: boolean;
  onToggleWatchlist?: (ticker: string) => void;
}

export function StockModal({
  ticker,
  onClose,
  isWatchlisted = false,
  onToggleWatchlist,
}: StockModalProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [lotCount, setLotCount] = useState(1);

  useEffect(() => {
    if (!ticker) return;

    const fetchStock = (isSilent = false) => {
      if (!isSilent) setLoading(true);
      fetch(`/api/stocks/${ticker}`, { cache: "no-store" })
        .then((r) => r.json())
        .then((res) => setData(res))
        .catch(() => {
          if (!isSilent) setData(null);
        })
        .finally(() => {
          if (!isSilent) setLoading(false);
        });
    };

    fetchStock(false);

    const interval = setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        fetchStock(true);
      }
    }, 6000);

    return () => clearInterval(interval);
  }, [ticker]);

  useEffect(() => {
    if (ticker) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [ticker]);

  if (!ticker) return null;

  const quote = data?.quote || {};
  const isUp = (quote.changePct || 0) > 0;
  const isDown = (quote.changePct || 0) < 0;

  const volumeShares = quote.volume || 0;
  const volumeLots = Math.floor(volumeShares / 100);

  // Lot simulator calculation
  const pricePerShare = quote.price || 0;
  const totalSimulatedCost = pricePerShare * (lotCount * 100);

  return (
    <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-xs flex flex-col justify-end">
      <div className="bg-white border-t border-slate-200 rounded-t-3xl max-h-[90vh] overflow-y-auto p-5 w-full max-w-md mx-auto animate-in slide-in-from-bottom duration-200 shadow-2xl space-y-4">
        {/* Drag handle pill */}
        <div className="w-10 h-1 bg-slate-300 rounded-full mx-auto -mt-1 mb-1" />

        {/* Header: Ticker, Sector, Watchlist toggle, Close */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white font-black flex items-center justify-center text-sm shadow-xs shrink-0 tracking-wider">
              {ticker.slice(0, 2)}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-black text-slate-900 tracking-tight">{ticker}</h2>
                {data?.sector && (
                  <span className="text-[10px] text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md font-semibold border border-slate-200/60">
                    {data.sector}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                {data?.name || "Emiten Bursa Efek Indonesia"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {onToggleWatchlist && (
              <button
                onClick={() => onToggleWatchlist(ticker)}
                className="p-2 min-h-[38px] min-w-[38px] flex items-center justify-center rounded-full bg-slate-100 text-slate-400 hover:text-amber-500 active:scale-95 transition"
                aria-label="Toggle Watchlist"
              >
                <Star
                  className={`w-4 h-4 transition-colors ${
                    isWatchlisted ? "fill-amber-400 text-amber-500" : "text-slate-400"
                  }`}
                />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 min-h-[38px] min-w-[38px] flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition"
              aria-label="Tutup"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center text-slate-400 text-sm space-y-2 animate-pulse">
            <div className="h-6 w-36 bg-slate-200 rounded-lg mx-auto" />
            <p className="text-xs text-slate-400">Mengambil data perdagangan terkini {ticker}...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Main Price Display */}
            <div className="bg-slate-50/90 p-4 rounded-2xl border border-slate-200/80 flex items-baseline justify-between">
              <div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Harga Real-Time
                </span>
                <div className="text-2xl font-black tabular-nums text-slate-900 mt-0.5">
                  Rp {quote.price?.toLocaleString("id-ID") || "-"}
                </div>
              </div>
              <div className="text-right">
                <span
                  className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg tabular-nums ${
                    isUp
                      ? "bg-emerald-100 text-emerald-800"
                      : isDown
                      ? "bg-rose-100 text-rose-800"
                      : "bg-slate-200 text-slate-700"
                  }`}
                >
                  {isUp ? <TrendingUp className="w-3.5 h-3.5" /> : isDown ? <TrendingDown className="w-3.5 h-3.5" /> : null}
                  {quote.nominalChange !== undefined && quote.nominalChange !== 0 && (
                    <span>{quote.nominalChange > 0 ? "+" : ""}{quote.nominalChange.toLocaleString("id-ID")}</span>
                  )}
                  <span>({isUp ? "+" : ""}{quote.changePct?.toFixed(2) || "0.00"}%)</span>
                </span>
                <span className="block text-[10px] text-slate-400 mt-1">
                  Prev: Rp {quote.previous?.toLocaleString("id-ID") || "-"}
                </span>
              </div>
            </div>

            {/* Daily Price Range Bar */}
            {quote.low && quote.high && (
              <PriceRangeBar
                current={quote.price || 0}
                low={quote.low}
                high={quote.high}
              />
            )}

            {/* 52-Week Range & Technical Rating */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80 space-y-1">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Rentang 52 Minggu
                </span>
                <div className="flex items-center justify-between text-xs font-bold text-slate-800 tabular-nums">
                  <span className="text-rose-600">Rp {quote.week52Low?.toLocaleString("id-ID") || "-"}</span>
                  <span className="text-slate-300">—</span>
                  <span className="text-emerald-600">Rp {quote.week52High?.toLocaleString("id-ID") || "-"}</span>
                </div>
                <span className="text-[10px] text-slate-400 block">Terendah & Tertinggi 1 tahun</span>
              </div>

              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80 space-y-1">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Sinyal Indikator (RSI)
                </span>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">
                    RSI: {quote.rsi !== null ? quote.rsi : "50"}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                      quote.techRecommendation?.includes("Buy")
                        ? "bg-emerald-100 text-emerald-800"
                        : quote.techRecommendation?.includes("Sell")
                        ? "bg-rose-100 text-rose-800"
                        : "bg-slate-200 text-slate-700"
                    }`}
                  >
                    {quote.techRecommendation || "Netral"}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 block">Konsensus teknikal 14 hari</span>
              </div>
            </div>

            {/* Trading Overview & Valuation Metrics */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80 space-y-0.5">
                <span className="text-[10px] font-medium text-slate-500 block">Volume Transaksi</span>
                <p className="text-sm font-bold tabular-nums text-slate-900">
                  {volumeLots.toLocaleString("id-ID")} Lot
                </p>
                <span className="text-[10px] text-slate-400 block">
                  ({(volumeShares / 1_000_000).toFixed(1)}M lembar)
                </span>
              </div>

              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80 space-y-0.5">
                <span className="text-[10px] font-medium text-slate-500 block">Nilai Perputaran (Turnover)</span>
                <p className="text-sm font-bold tabular-nums text-slate-900">
                  {quote.turnover || "-"}
                </p>
                <span className="text-[10px] text-slate-400 block">Kapitalisasi: Rp {quote.marketCap || "-"}</span>
              </div>

              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80 space-y-0.5">
                <span className="text-[10px] font-medium text-slate-500 block">Valuasi PER (P/E)</span>
                <p className="text-sm font-bold tabular-nums text-slate-900">
                  {quote.per !== null ? `${quote.per}x` : "-"}
                </p>
                <span className="text-[10px] text-slate-400 block">Rasio laba bersih tahunan</span>
              </div>

              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80 space-y-0.5">
                <span className="text-[10px] font-medium text-slate-500 block">Valuasi PBV (P/B)</span>
                <p className="text-sm font-bold tabular-nums text-slate-900">
                  {quote.pbv !== null ? `${quote.pbv}x` : "-"}
                </p>
                <span className="text-[10px] text-slate-400 block">Rasio terhadap nilai buku</span>
              </div>
            </div>

            {/* Quick Lot Size Simulator for Beginners */}
            <div className="p-3.5 bg-blue-50/50 rounded-2xl border border-blue-100/80 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900">
                  <Calculator className="w-3.5 h-3.5 text-blue-600" />
                  <span>Kalkulator Modal Beli (1 Lot = 100 Lembar)</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {[1, 5, 10, 50].map((l) => (
                  <button
                    key={l}
                    onClick={() => setLotCount(l)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                      lotCount === l
                        ? "bg-blue-600 text-white shadow-xs"
                        : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {l} Lot
                  </button>
                ))}
                <span className="text-xs text-slate-400 ml-auto tabular-nums font-semibold">
                  {lotCount * 100} Lembar
                </span>
              </div>

              <div className="pt-1 flex items-center justify-between border-t border-blue-100 text-xs">
                <span className="text-slate-600 font-medium">Estimasi Modal Beli:</span>
                <span className="font-bold text-blue-700 text-sm tabular-nums">
                  Rp {totalSimulatedCost.toLocaleString("id-ID")}
                </span>
              </div>
            </div>

            {/* 7-Day Filtered News Section with Direct Links */}
            <div className="pt-1">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                  <Newspaper className="w-3.5 h-3.5 text-blue-600" />
                  <span>Kabar Terkait {ticker} (Maks. 7 Hari Terakhir)</span>
                </div>
                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  7 Hari Lalu
                </span>
              </div>

              {!data?.news || data.news.length === 0 ? (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500">
                  Tidak ada pemberitaan khusus untuk {ticker} dalam 7 hari terakhir.
                </div>
              ) : (
                <div className="space-y-2">
                  {data.news.slice(0, 5).map((item: any, idx: number) => (
                    <a
                      key={idx}
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group block p-3 rounded-xl bg-slate-50 border border-slate-200/80 hover:border-blue-500 hover:bg-blue-50/30 transition duration-150"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-semibold text-slate-900 group-hover:text-blue-700 line-clamp-2 leading-snug transition-colors">
                          {item.title}
                        </p>
                        <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 shrink-0 mt-0.5 transition-colors" />
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1.5">
                        <span className="font-medium text-slate-500">{item.source || "IDX Channel"}</span>
                        <span>{item.time || "Terkini"}</span>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* Close Button */}
            <div className="pt-2">
              <button
                onClick={onClose}
                className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition"
              >
                Tutup Detail Saham
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
