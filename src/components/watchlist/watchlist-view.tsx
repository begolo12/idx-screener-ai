"use client";

import React, { useEffect, useState } from "react";
import { StockCard } from "@/components/screener/stock-card";
import { Star, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SkeletonCard } from "@/components/ui/skeleton-card";

interface WatchlistViewProps {
  watchlist: string[];
  onToggleWatchlist: (ticker: string) => void;
  onSelectStock: (ticker: string) => void;
  onGoToScreener: () => void;
}

export function WatchlistView({
  watchlist,
  onToggleWatchlist,
  onSelectStock,
  onGoToScreener,
}: WatchlistViewProps) {
  const [stocks, setStocks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (watchlist.length === 0) {
      setStocks([]);
      return;
    }
    setLoading(true);
    fetch("/api/screener?limit=100")
      .then((r) => r.json())
      .then((res) => {
        const all = res.data || [];
        const filtered = all.filter((s: any) => watchlist.includes(s.ticker));
        setStocks(filtered);
      })
      .catch(() => setStocks([]))
      .finally(() => setLoading(false));
  }, [watchlist]);

  if (watchlist.length === 0) {
    return (
      <div className="py-24 text-center px-6 max-w-sm mx-auto">
        <div className="w-14 h-14 rounded-2xl bg-surface-elevated border border-border flex items-center justify-center mx-auto text-amber-400/80">
          <Star className="w-7 h-7 stroke-[1.5]" />
        </div>
        <h3 className="text-base font-bold text-slate-100 mt-4">Watchlist Belum Terisi</h3>
        <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
          Tandai bintang pada saham pilihan di tab Screener untuk memantau harga dan pergerakan hariannya di sini.
        </p>
        <div className="mt-5">
          <Button onClick={onGoToScreener} className="mx-auto">
            <Compass className="w-4 h-4 mr-1.5" />
            Jelajahi Saham Terpopuler
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-2.5 pb-28 w-full max-w-md mx-auto">
      <div className="flex items-center justify-between pb-1">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Saham Pantauan ({watchlist.length})
        </h3>
        <span className="text-[11px] text-slate-500">Tersinkronisasi</span>
      </div>

      {loading ? (
        <SkeletonCard type="stock" count={3} />
      ) : (
        stocks.map((stock) => (
          <StockCard
            key={stock.ticker}
            stock={stock}
            isWatchlisted={true}
            onToggleWatchlist={onToggleWatchlist}
            onClick={onSelectStock}
          />
        ))
      )}
    </div>
  );
}
