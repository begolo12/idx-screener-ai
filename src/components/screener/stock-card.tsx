"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Sparkline } from "@/components/ui/sparkline";
import { Star } from "lucide-react";

interface StockCardProps {
  stock: {
    ticker: string;
    name: string;
    price: number;
    changePct: number;
    volume: number;
    sector?: string;
    sparkline?: number[];
  };
  isWatchlisted: boolean;
  onToggleWatchlist: (ticker: string) => void;
  onClick: (ticker: string) => void;
}

export function StockCard({ stock, isWatchlisted, onToggleWatchlist, onClick }: StockCardProps) {
  const isUp = stock.changePct > 0;
  const isDown = stock.changePct < 0;

  return (
    <div
      onClick={() => onClick(stock.ticker)}
      className="p-3.5 bg-surface rounded-xl border border-border hover:border-slate-600 transition duration-150 active:scale-[0.99] cursor-pointer flex items-center justify-between gap-2"
    >
      {/* Ticker & Metadata */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-mono font-bold text-base tracking-tight text-slate-100">{stock.ticker}</span>
          {stock.sector && (
            <span className="text-[10px] text-slate-400 bg-surface-elevated px-1.5 py-0.5 rounded border border-border/50">
              {stock.sector}
            </span>
          )}
        </div>
        <p className="text-xs text-slate-400 truncate mt-0.5">{stock.name}</p>
        <p className="text-[11px] text-slate-500 font-mono tabular-nums mt-1">
          Vol: {(stock.volume / 1_000_000).toFixed(1)}M lembar
        </p>
      </div>

      {/* Center Sparkline */}
      <div className="hidden sm:block">
        <Sparkline points={stock.sparkline} isUp={isUp} />
      </div>

      {/* Price & Change */}
      <div className="text-right flex items-center gap-2.5">
        <div>
          <div className="font-mono font-bold text-sm sm:text-base tabular-nums text-slate-100">
            Rp {stock.price.toLocaleString("id-ID")}
          </div>
          <div className="mt-0.5">
            <Badge variant={isUp ? "bull" : isDown ? "bear" : "neutral"}>
              {isUp ? "+" : ""}{stock.changePct.toFixed(2)}%
            </Badge>
          </div>
        </div>

        {/* Watchlist Star Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleWatchlist(stock.ticker);
          }}
          className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-amber-400 active:scale-95 transition-transform"
          aria-label={`Toggle Watchlist ${stock.ticker}`}
        >
          <Star className={`w-5 h-5 transition-colors ${isWatchlisted ? "fill-amber-400 text-amber-400" : "text-slate-600"}`} />
        </button>
      </div>
    </div>
  );
}
