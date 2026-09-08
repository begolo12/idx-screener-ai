"use client";

import React, { useEffect, useState } from "react";
import { X, ExternalLink, Newspaper, TrendingUp, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PriceRangeBar } from "@/components/screener/price-range-bar";

interface StockModalProps {
  ticker: string | null;
  onClose: () => void;
}

export function StockModal({ ticker, onClose }: StockModalProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!ticker) return;
    setLoading(true);
    fetch(`/api/stocks/${ticker}`)
      .then((r) => r.json())
      .then((res) => setData(res))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [ticker]);

  // Lock scroll
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

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex flex-col justify-end">
      <div className="bg-surface border-t border-border rounded-t-2xl max-h-[88vh] overflow-y-auto p-5 w-full max-w-md mx-auto animate-in slide-in-from-bottom duration-200">
        <div className="w-12 h-1.5 bg-slate-700 rounded-full mx-auto mb-2" />

        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold font-mono text-slate-100">{ticker}</h2>
              {data?.sector && (
                <span className="text-[10px] text-slate-400 bg-surface-elevated px-1.5 py-0.5 rounded border border-border">
                  {data.sector}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">{data?.name || "Emiten Bursa Efek Indonesia"}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-surface-elevated text-slate-400 active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="py-16 text-center text-slate-400 text-sm space-y-2 animate-pulse">
            <div className="h-4 w-32 bg-slate-800 rounded mx-auto" />
            <p className="text-xs text-slate-500">Mengambil data mendalam {ticker}...</p>
          </div>
        ) : (
          <div className="mt-4 space-y-5">
            {/* Price Range Slider */}
            {quote.low && quote.high && (
              <PriceRangeBar
                current={quote.price || 0}
                low={quote.low}
                high={quote.high}
              />
            )}

            {/* OHLC Statistics 4-Grid */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="bg-surface-elevated p-3 rounded-xl border border-border">
                <span className="text-[11px] text-slate-400">Harga Open</span>
                <p className="text-base font-bold font-mono tabular-nums text-slate-100 mt-0.5">
                  Rp {quote.open?.toLocaleString("id-ID") || "-"}
                </p>
              </div>
              <div className="bg-surface-elevated p-3 rounded-xl border border-border">
                <span className="text-[11px] text-slate-400">Prev Close</span>
                <p className="text-base font-bold font-mono tabular-nums text-slate-100 mt-0.5">
                  Rp {quote.previous?.toLocaleString("id-ID") || "-"}
                </p>
              </div>
              <div className="bg-surface-elevated p-3 rounded-xl border border-border">
                <span className="text-[11px] text-slate-400">Volume Transaksi</span>
                <p className="text-sm font-bold font-mono tabular-nums text-slate-200 mt-1">
                  {(quote.volume / 1_000_000).toFixed(1)}M lembar
                </p>
              </div>
              <div className="bg-surface-elevated p-3 rounded-xl border border-border">
                <span className="text-[11px] text-slate-400">Total Turnover</span>
                <p className="text-sm font-bold font-mono tabular-nums text-slate-200 mt-1">
                  {quote.turnover || "-"}
                </p>
              </div>
            </div>

            {/* Related News Section */}
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-200 mb-3">
                <Newspaper className="w-4 h-4 text-sky-400" />
                <span>Berita Terkait {ticker}</span>
              </div>

              {!data?.news || data.news.length === 0 ? (
                <div className="p-4 rounded-xl bg-surface-elevated/40 border border-border text-center text-xs text-slate-500">
                  Belum ada berita terkhusus untuk emiten {ticker} hari ini.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {data.news.map((item: any, idx: number) => (
                    <a
                      key={idx}
                      href={item.url || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block p-3.5 rounded-xl bg-surface-elevated border border-border hover:border-slate-600 transition"
                    >
                      <p className="text-xs font-medium text-slate-200 line-clamp-2 leading-snug">
                        {item.title}
                      </p>
                      <div className="flex justify-between items-center text-[10px] text-slate-400 mt-2">
                        <span>{item.source || "IDX Channel"}</span>
                        <span>{item.time || "Terkini"}</span>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
