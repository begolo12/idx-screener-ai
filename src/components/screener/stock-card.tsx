"use client";

import React, { useState, useEffect, useRef } from "react";
import { Sparkline } from "@/components/ui/sparkline";
import { Star } from "lucide-react";

interface StockCardProps {
  stock: {
    ticker: string;
    name: string;
    price: number;
    changePct: number;
    volume: number;
    turnoverVal?: number;
    sector?: string;
    open?: number;
    high?: number;
    low?: number;
    sparkline?: number[];
  };
  isWatchlisted: boolean;
  onToggleWatchlist: (ticker: string) => void;
  onClick: (ticker: string) => void;
}

export function StockCard({ stock, isWatchlisted, onToggleWatchlist, onClick }: StockCardProps) {
  const [flash, setFlash] = useState<"up" | "down" | null>(null);
  const prevPriceRef = useRef<number>(stock.price);

  useEffect(() => {
    if (prevPriceRef.current !== stock.price) {
      if (stock.price > prevPriceRef.current) {
        setFlash("up");
      } else if (stock.price < prevPriceRef.current) {
        setFlash("down");
      }
      prevPriceRef.current = stock.price;
      const timer = setTimeout(() => setFlash(null), 1200);
      return () => clearTimeout(timer);
    }
  }, [stock.price]);

  const isUp = stock.changePct > 0;
  const isDown = stock.changePct < 0;

  // Format turnover
  const formatTurnover = (val?: number) => {
    if (!val || val === 0) return null;
    if (val >= 1_000_000_000_000) return `Rp ${(val / 1_000_000_000_000).toFixed(1)} T`;
    if (val >= 1_000_000_000) return `Rp ${(val / 1_000_000_000).toFixed(1)} M`;
    if (val >= 1_000_000) return `Rp ${(val / 1_000_000).toFixed(0)} Jt`;
    return `Rp ${val.toLocaleString("id-ID")}`;
  };

  // Format volume (shares to lots)
  const formatVolume = (vol: number) => {
    if (vol >= 1_000_000_000) return `${(vol / 1_000_000_000).toFixed(1)}B`;
    if (vol >= 1_000_000) return `${(vol / 1_000_000).toFixed(1)}M`;
    if (vol >= 1_000) return `${(vol / 1_000).toFixed(0)}K`;
    return vol.toLocaleString("id-ID");
  };

  // Calculate nominal change
  const nominalChange = stock.open && stock.open > 0
    ? stock.price - stock.open
    : Math.round(stock.price * (stock.changePct / 100));

  // Range position calculation (0 to 100%)
  const hasRange = stock.low !== undefined && stock.high !== undefined && stock.high > stock.low;
  const rangePct = hasRange
    ? Math.min(Math.max(((stock.price - stock.low!) / (stock.high! - stock.low!)) * 100, 0), 100)
    : 50;

  const turnoverStr = formatTurnover(stock.turnoverVal);

  return (
    <div
      onClick={() => onClick(stock.ticker)}
      className={`p-3.5 bg-white rounded-2xl border transition-all duration-200 active:scale-[0.99] cursor-pointer space-y-2.5 ${
        flash === "up"
          ? "border-emerald-400 ring-2 ring-emerald-300/40 shadow-sm bg-emerald-50/20"
          : flash === "down"
          ? "border-rose-400 ring-2 ring-rose-300/40 shadow-sm bg-rose-50/20"
          : "border-slate-200/90 hover:border-blue-400 hover:shadow-xs"
      }`}
    >
      {/* Top Row: Avatar, Ticker, Name & Price */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 font-bold flex items-center justify-center text-xs shrink-0 border border-slate-200/80">
            {stock.ticker.slice(0, 2)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-bold text-sm tracking-tight text-slate-900">{stock.ticker}</span>
              {stock.sector && (
                <span className="text-[10px] text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded-md font-medium">
                  {stock.sector}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 truncate mt-0.5">{stock.name}</p>
          </div>
        </div>

        {/* Price & Watchlist Star */}
        <div className="flex items-center gap-1.5 shrink-0 text-right">
          <div>
            <div
              className={`font-bold text-sm sm:text-base tabular-nums transition-all duration-300 rounded px-1.5 py-0.5 -mx-1.5 inline-block ${
                flash === "up"
                  ? "bg-emerald-500 text-white shadow-xs scale-105"
                  : flash === "down"
                  ? "bg-rose-500 text-white shadow-xs scale-105"
                  : "text-slate-900"
              }`}
            >
              Rp {stock.price.toLocaleString("id-ID")}
            </div>
            <div className="flex items-center justify-end gap-1.5 mt-0.5">
              {nominalChange !== 0 && (
                <span className={`text-[10px] tabular-nums font-medium ${isUp ? "text-emerald-600" : isDown ? "text-rose-600" : "text-slate-400"}`}>
                  {nominalChange > 0 ? "+" : ""}{nominalChange.toLocaleString("id-ID")}
                </span>
              )}
              <span
                className={`text-[11px] font-semibold px-1.5 py-0.5 rounded-md tabular-nums ${
                  isUp
                    ? "bg-emerald-50 text-emerald-700"
                    : isDown
                    ? "bg-rose-50 text-rose-700"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {isUp ? "+" : ""}{stock.changePct.toFixed(2)}%
              </span>
            </div>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleWatchlist(stock.ticker);
            }}
            className="p-1.5 min-h-[36px] min-w-[36px] flex items-center justify-center text-slate-400 hover:text-amber-500 active:scale-90 transition-transform"
            aria-label={`Toggle Watchlist ${stock.ticker}`}
          >
            <Star
              className={`w-4 h-4 transition-colors ${
                isWatchlisted ? "fill-amber-400 text-amber-500" : "text-slate-300 hover:text-slate-400"
              }`}
            />
          </button>
        </div>
      </div>

      {/* Middle/Bottom Row: Daily Range Bar & Secondary Metrics */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 gap-3">
        {/* Left: Volume and Turnover */}
        <div className="flex items-center gap-2 tabular-nums">
          <span>Vol: <strong className="text-slate-700 font-semibold">{formatVolume(stock.volume)}</strong></span>
          {turnoverStr && (
            <>
              <span className="text-slate-300">•</span>
              <span>Nilai: <strong className="text-slate-700 font-semibold">{turnoverStr}</strong></span>
            </>
          )}
        </div>

        {/* Right: Daily Range Indicator or Sparkline */}
        {hasRange ? (
          <div className="flex items-center gap-1.5 tabular-nums text-[10px] text-slate-400 shrink-0">
            <span>{stock.low?.toLocaleString("id-ID")}</span>
            <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden relative">
              <div
                className={`h-full rounded-full ${isUp ? "bg-emerald-500" : isDown ? "bg-rose-500" : "bg-slate-400"}`}
                style={{ width: `${rangePct}%` }}
              />
            </div>
            <span>{stock.high?.toLocaleString("id-ID")}</span>
          </div>
        ) : stock.sparkline ? (
          <div className="w-16 shrink-0">
            <Sparkline points={stock.sparkline} isUp={isUp} />
          </div>
        ) : null}
      </div>
    </div>
  );
}
