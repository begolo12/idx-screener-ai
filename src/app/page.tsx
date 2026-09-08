"use client";

import React, { useEffect, useState, useMemo } from "react";
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
import { RotateCcw, Search, X } from "lucide-react";

export default function HomePage() {
  const [tab, setTab] = useState<NavTab>("screener");
  const [sort, setSort] = useState("gainers");
  const [sector, setSector] = useState("Semua");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
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
    const query = new URLSearchParams({ sort, limit: "100" });
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
    setSearchQuery("");
    loadStocks();
  };

  const hasCustomFilter = sector !== "Semua" || Boolean(minPrice) || Boolean(maxPrice);

  // Client-side search filtering
  const filteredStocks = useMemo(() => {
    if (!searchQuery.trim()) return stocks;
    const q = searchQuery.toLowerCase().trim();
    return stocks.filter(
      (s) =>
        s.ticker.toLowerCase().includes(q) ||
        (s.name && s.name.toLowerCase().includes(q)) ||
        (s.sector && s.sector.toLowerCase().includes(q))
    );
  }, [stocks, searchQuery]);

  return (
    <div className="flex-1 flex flex-col w-full">
      <MarketHeader overview={overview} />

      {tab === "screener" && (
        <div className="flex-1 flex flex-col pb-28">
          {/* Screener Search Bar */}
          <div className="px-4 pt-3 pb-1.5 bg-white space-y-1.5">
            <div className="relative flex items-center">
              <input
                type="text"
                placeholder="Cari kode atau nama saham (BBCA, TLKM, Astra...)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-9 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white transition"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="p-1.5 absolute right-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Beginner Friendly Tip */}
            <div className="flex items-center justify-between text-[11px] text-slate-500 px-1 pt-0.5">
              <span>💡 Sentuh saham untuk melihat rentang harga harian & berita</span>
            </div>
          </div>

          {/* Screener Filter Chips & Sort Controls */}
          <FilterChips
            activeSort={sort}
            onSelectSort={setSort}
            onOpenDrawer={() => setIsDrawerOpen(true)}
            hasCustomFilter={hasCustomFilter}
          />

          {/* Screener Status Bar: Result Count & Active Filter Tags */}
          <div className="px-4 py-2 flex items-center justify-between text-[11px] text-slate-500 bg-slate-50/70 border-b border-slate-100">
            <span>
              Menampilkan <strong>{filteredStocks.length}</strong> saham
              {sector !== "Semua" && ` • Sektor ${sector}`}
            </span>
            {hasCustomFilter && (
              <button
                onClick={handleResetFilters}
                className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
          </div>

          {/* Stock Cards List */}
          <div className="p-4 space-y-2.5 flex-1">
            {loading ? (
              <SkeletonCard type="stock" count={6} />
            ) : filteredStocks.length === 0 ? (
              <div className="py-20 text-center px-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                  <Search className="w-6 h-6" />
                </div>
                <p className="text-sm font-bold text-slate-800">Tidak ada saham yang sesuai</p>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                  {searchQuery
                    ? `Tidak ditemukan hasil untuk "${searchQuery}". Coba kata kunci lain.`
                    : "Coba sesuaikan batas harga atau sektor yang dipilih di menu filter."}
                </p>
                <div className="mt-4">
                  <Button variant="secondary" onClick={handleResetFilters} className="mx-auto">
                    <RotateCcw className="w-3.5 h-3.5 mr-1" />
                    Reset Semua Filter
                  </Button>
                </div>
              </div>
            ) : (
              filteredStocks.map((stock) => (
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
