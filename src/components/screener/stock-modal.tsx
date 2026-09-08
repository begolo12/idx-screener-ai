"use client";

import React, { useEffect, useState } from "react";
import { X, Newspaper, Building2, TrendingUp, DollarSign } from "lucide-react";
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

  // Volume formatting in lembar and lots
  const volumeShares = quote.volume || 0;
  const volumeLots = Math.floor(volumeShares / 100);

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex flex-col justify-end">
      <div className="bg-white border-t border-slate-200 rounded-t-3xl max-h-[88vh] overflow-y-auto p-5 w-full max-w-md mx-auto animate-in slide-in-from-bottom duration-200 shadow-2xl space-y-4">
        <div className="w-10 h-1 bg-slate-300 rounded-full mx-auto mb-1" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-700 font-bold flex items-center justify-center text-sm border border-blue-100 shrink-0">
              {ticker.slice(0, 2)}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold text-slate-900">{ticker}</h2>
                {data?.sector && (
                  <span className="text-[10px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md font-semibold">
                    {data.sector}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{data?.name || "Emiten Bursa Efek Indonesia"}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 min-h-[38px] min-w-[38px] flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="py-16 text-center text-slate-400 text-sm space-y-2 animate-pulse">
            <div className="h-5 w-36 bg-slate-200 rounded-lg mx-auto" />
            <p className="text-xs text-slate-400">Mengambil data perdagangan {ticker}...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Real Price Range Bar */}
            {quote.low && quote.high && (
              <PriceRangeBar
                current={quote.price || 0}
                low={quote.low}
                high={quote.high}
              />
            )}

            {/* 4 Informative Cards with clear Indonesian explanations */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80 space-y-0.5">
                <span className="text-[10px] font-medium text-slate-500 block">Harga Buka Pagi (Open)</span>
                <p className="text-base font-bold tabular-nums text-slate-900">
                  Rp {quote.open?.toLocaleString("id-ID") || "-"}
                </p>
                <span className="text-[10px] text-slate-400 block">Harga transaksi jam 09:00</span>
              </div>

              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80 space-y-0.5">
                <span className="text-[10px] font-medium text-slate-500 block">Harga Kemarin (Prev)</span>
                <p className="text-base font-bold tabular-nums text-slate-900">
                  Rp {quote.previous?.toLocaleString("id-ID") || "-"}
                </p>
                <span className="text-[10px] text-slate-400 block">Penutupan hari bursa lalu</span>
              </div>

              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80 space-y-0.5">
                <span className="text-[10px] font-medium text-slate-500 block">Volume Saham</span>
                <p className="text-base font-bold tabular-nums text-slate-900">
                  {volumeLots.toLocaleString("id-ID")} Lot
                </p>
                <span className="text-[10px] text-slate-400 block">
                  ({(volumeShares / 1_000_000).toFixed(1)}M lembar)
                </span>
              </div>

              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80 space-y-0.5">
                <span className="text-[10px] font-medium text-slate-500 block">Perputaran Uang</span>
                <p className="text-base font-bold tabular-nums text-slate-900">
                  {quote.turnover || "-"}
                </p>
                <span className="text-[10px] text-slate-400 block">Total nilai transaksi hari ini</span>
              </div>
            </div>

            {/* Related News Section */}
            <div className="pt-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 mb-2.5">
                <Newspaper className="w-3.5 h-3.5 text-blue-600" />
                <span>Kabar & Berita Terkait {ticker}</span>
              </div>

              {!data?.news || data.news.length === 0 ? (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500">
                  Belum ada publikasi berita khusus untuk {ticker} hari ini.
                </div>
              ) : (
                <div className="space-y-2">
                  {data.news.slice(0, 3).map((item: any, idx: number) => (
                    <a
                      key={idx}
                      href={item.url || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block p-3 rounded-xl bg-slate-50 border border-slate-200/80 hover:border-blue-400 hover:bg-white transition"
                    >
                      <p className="text-xs font-semibold text-slate-900 line-clamp-2 leading-snug">
                        {item.title}
                      </p>
                      <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1.5">
                        <span>{item.source || "IDX Channel"}</span>
                        <span>{item.time || "Terkini"}</span>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* Close action */}
            <div className="pt-2">
              <button
                onClick={onClose}
                className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition"
              >
                Tutup Detail
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
