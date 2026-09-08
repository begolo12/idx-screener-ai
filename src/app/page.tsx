"use client";

import React, { useEffect, useState } from "react";
import { MarketHeader } from "@/components/screener/market-header";
import { FilterChips } from "@/components/screener/filter-chips";
import { StockCard } from "@/components/screener/stock-card";
import { StockModal } from "@/components/screener/stock-modal";
import { FilterDrawer } from "@/components/screener/filter-drawer";
import { NewsView } from "@/components/news/news-view";
import { WatchlistView } from "@/components/watchlist/watchlist-view";
import { AnalysisDashboard } from "@/components/analysis/analysis-dashboard";
import { AILabView } from "@/components/ai-lab/ai-lab-view";
import { BottomNav, NavTab } from "@/components/navigation/bottom-nav";
import { SkeletonCard } from "@/components/ui/skeleton-card";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";

export default function HomePage() {
  const [tab, setTab] = useState<NavTab>("screener");
  const [sort, setSort] = useState("gainers");
  const [sector, setSector] = useState("Semua");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedTicker, setSelectedTicker] = useState<string | null>(null);

  const [overview, setOverview] = useState<any>(null);
  const [stocks, setStocks] = useState<any[]>([]);
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Load Watchlist with local + remote sync
  useEffect(() => {
    const local = localStorage.getItem("idx_watchlist");
    if (local) {
      try {
        setWatchlist(JSON.parse(local));
      } catch {}
    }
    fetch("/api/watchlist")
      .then((r) => r.json())
      .then((res) => {
        if (res.items && res.items.length > 0) {
          setWatchlist(res.items);
          localStorage.setItem("idx_watchlist", JSON.stringify(res.items));
        }
      })
      .catch(() => {});
  }, []);

  // Load Market Overview
  useEffect(() => {
    fetch("/api/market/overview")
      .then((r) => r.json())
      .then((data) => setOverview(data))
      .catch(() => {});
  }, []);

  // Load Screener Stocks
  const loadStocks = () => {
    setLoading(true);
    const query = new URLSearchParams({ sort });
    if (sector !== "Semua") query.set("sector", sector);
    if (minPrice) query.set("minPrice", minPrice);
    if (maxPrice) query.set("maxPrice", maxPrice);

    fetch(`/api/screener?${query.toString()}`)
      .then((r) => r.json())
      .then((res) => setStocks(res.data || []))
      .catch(() => setStocks([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadStocks();
  }, [sort, sector]);

  const toggleWatchlist = (ticker: string) => {
    const isPresent = watchlist.includes(ticker);
    const next = isPresent ? watchlist.filter((t) => t !== ticker) : [...watchlist, ticker];
    setWatchlist(next);
    localStorage.setItem("idx_watchlist", JSON.stringify(next));

    const method = isPresent ? "DELETE" : "POST";
    const url = isPresent ? `/api/watchlist?ticker=${ticker}` : "/api/watchlist";
    fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: isPresent ? undefined : JSON.stringify({ ticker }),
    }).catch(() => {});
  };

  const handleResetFilters = () => {
    setSector("Semua");
    setMinPrice("");
    setMaxPrice("");
    setSort("gainers");
    loadStocks();
  };

  const hasCustomFilter = sector !== "Semua" || Boolean(minPrice) || Boolean(maxPrice);

  return (
    <div className="flex-1 flex flex-col w-full">
      <MarketHeader overview={overview} />

      {tab === "screener" && (
        <div className="flex-1 flex flex-col pb-28">
          <FilterChips
            activeSort={sort}
            onSelectSort={setSort}
            onOpenDrawer={() => setIsDrawerOpen(true)}
            hasCustomFilter={hasCustomFilter}
          />

          <div className="p-4 space-y-2.5 flex-1">
            {loading ? (
              <SkeletonCard type="stock" count={5} />
            ) : stocks.length === 0 ? (
              <div className="py-20 text-center px-4 bg-surface rounded-2xl border border-border">
                <p className="text-sm font-semibold text-slate-200">Tidak ada saham yang sesuai</p>
                <p className="text-xs text-slate-400 mt-1">
                  Coba sesuaikan batas harga atau sektor yang dipilih.
                </p>
                <div className="mt-4">
                  <Button variant="secondary" onClick={handleResetFilters} className="mx-auto">
                    <RotateCcw className="w-3.5 h-3.5 mr-1" />
                    Reset Semua Filter
                  </Button>
                </div>
              </div>
            ) : (
              stocks.map((stock) => (
                <StockCard
                  key={stock.ticker}
                  stock={stock}
                  isWatchlisted={watchlist.includes(stock.ticker)}
                  onToggleWatchlist={toggleWatchlist}
                  onClick={setSelectedTicker}
                />
              ))
            )}
          </div>
        </div>
      )}

      {tab === "analysis" && (
        <div className="p-4 flex-1">
          <AnalysisDashboard />
        </div>
      )}

      {tab === "ailab" && (
        <div className="p-4 flex-1">
          <AILabView />
        </div>
      )}

      {tab === "news" && <NewsView />}

      {tab === "watchlist" && (
        <WatchlistView
          watchlist={watchlist}
          onToggleWatchlist={toggleWatchlist}
          onSelectStock={setSelectedTicker}
          onGoToScreener={() => setTab("screener")}
        />
      )}

      <StockModal ticker={selectedTicker} onClose={() => setSelectedTicker(null)} />

      <FilterDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        selectedSector={sector}
        onSelectSector={setSector}
        minPrice={minPrice}
        setMinPrice={setMinPrice}
        maxPrice={maxPrice}
        setMaxPrice={setMaxPrice}
        onApply={() => {
          setIsDrawerOpen(false);
          loadStocks();
        }}
        onReset={handleResetFilters}
      />

      <BottomNav
        currentTab={tab}
        onChangeTab={setTab}
        watchlistCount={watchlist.length}
      />
    </div>
  );
}
