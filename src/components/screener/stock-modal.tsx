"use client";

import React, { useEffect, useState } from "react";
import { X, Newspaper, Info } from "lucide-react";
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
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex flex-col justify-end">
      <div className="bg-white border-t border-slate-200 rounded-t-2xl max-h-[88vh] overflow-y-auto p-5 w-full max-w-md mx-auto animate-in slide-in-from-bottom duration-200 shadow-2xl">
        <div className="w-10 h-1 bg-slate-300 rounded-full mx-auto mb-2" />

        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold font-mono text-slate-900">{ticker}</h2>
              {data?.sector && (
                <span className="text-[10px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded font-medium">
                  {data.sector}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">{data?.name || "Emiten Bursa Efek Indonesia"}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg bg-slate-100 text-slate-500 hover:text-slate-700 active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="py-16 text-center text-slate-400 text-sm space-y-2 animate-pulse">
            <div className="h-4 w-32 bg-slate-200 rounded mx-auto" />
            <p className="text-xs text-slate-400">Mengambil data mendalam {ticker}...</p>
          </div>
        ) : (
          <div className="mt-4 space-y-5">
            {quote.low && quote.high && (
              <PriceRangeBar
                current={quote.price || 0}
                low={quote.low}
                high={quote.high}
              />
            )}

            <div className="grid grid-cols-2 gap-2.5">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <span className="text-[11px] text-slate-500">Harga Open</span>
                <p className="text-base font-bold font-mono tabular-nums text-slate-900 mt-0.5">
                  Rp {quote.open?.toLocaleString("id-ID") || "-"}
                </p>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <span className="text-[11px] text-slate-500">Prev Close</span>
                <p className="text-base font-bold font-mono tabular-nums text-slate-900 mt-0.5">
                  Rp {quote.previous?.toLocaleString("id-ID") || "-"}
                </p>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <span className="text-[11px] text-slate-500">Volume Transaksi</span>
                <p className="text-sm font-bold font-mono tabular-nums text-slate-900 mt-1">
                  {(quote.volume / 1_000_000).toFixed(1)}M lembar
                </p>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <span className="text-[11px] text-slate-500">Total Turnover</span>
                <p className="text-sm font-bold font-mono tabular-nums text-slate-900 mt-1">
                  {quote.turnover || "-"}
                </p>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 mb-3">
                <Newspaper className="w-4 h-4 text-blue-600" />
                <span>Berita Terkait {ticker}</span>
              </div>

              {!data?.news || data.news.length === 0 ? (
                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-center text-xs text-slate-500">
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
                      className="block p-3.5 rounded-lg bg-slate-50 border border-slate-200 hover:border-blue-400 hover:bg-white transition"
                    >
                      <p className="text-xs font-medium text-slate-900 line-clamp-2 leading-snug">
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
