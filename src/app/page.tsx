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
  const [isLiveSyncing, setIsLiveSyncing] = useState(false);

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
  const loadOverview = () => {
    return fetch("/api/market/overview", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => setOverview(data))
      .catch(() => {});
  };

  // Load Screener Stocks
  const loadStocks = (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setIsLiveSyncing(true);

    const query = new URLSearchParams({ sort, limit: "800" });
    if (sector !== "Semua") query.set("sector", sector);
    if (minPrice) query.set("minPrice", minPrice);
    if (maxPrice) query.set("maxPrice", maxPrice);

    return fetch(`/api/screener?${query.toString()}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((res) => {
        if (res.data && Array.isArray(res.data)) {
          setStocks(res.data);
        }
      })
      .catch(() => {
        if (!isSilent) setStocks([]);
      })
      .finally(() => {
        if (!isSilent) setLoading(false);
        setIsLiveSyncing(false);
      });
  };

  const handleManualRefresh = () => {
    setIsLiveSyncing(true);
    Promise.all([loadOverview(), loadStocks(true)]).finally(() => {
      setIsLiveSyncing(false);
    });
  };

  useEffect(() => {
    loadOverview();
    loadStocks(false);

    // Auto-refresh interval (polling every 6 seconds when window tab is active)
    const intervalId = setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        loadOverview();
        loadStocks(true);
      }
    }, 6000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        loadOverview();
        loadStocks(true);
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [sort, sector, minPrice, maxPrice]);

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

  // Client-side search filtering across all 800+ stocks
  const filteredStocks = useMemo(() => {
    if (!searchQuery.trim()) return stocks;
    const q = searchQuery.toLowerCase().trim();
    const matches = stocks.filter(
      (s) =>
        s.ticker.toLowerCase().includes(q) ||
        (s.name && s.name.toLowerCase().includes(q)) ||
        (s.sector && s.sector.toLowerCase().includes(q))
    );

    // Prioritize exact ticker match (e.g. BBCA) or startsWith ticker match
    return matches.sort((a, b) => {
      const aExact = a.ticker.toLowerCase() === q;
      const bExact = b.ticker.toLowerCase() === q;
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;
      const aStarts = a.ticker.toLowerCase().startsWith(q);
      const bStarts = b.ticker.toLowerCase().startsWith(q);
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;
      return 0;
    });
  }, [stocks, searchQuery]);

  return (
    <div className="flex-1 flex flex-col w-full">
      <MarketHeader
        overview={overview}
        isSyncing={isLiveSyncing}
        onRefresh={handleManualRefresh}
      />

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

          {/* Quick Highlight Cards (Top 3 Movers/Active) when no active search query */}
          {!searchQuery && stocks.length >= 3 && !hasCustomFilter && (
            <div className="px-4 pt-3 pb-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-800 tracking-tight">Sorotan Pasar Terkini</span>
                <span className="text-[10px] text-slate-400 font-medium">Berdasarkan {sort === "gainers" ? "Kenaikan" : sort === "losers" ? "Koreksi" : sort === "turnover" ? "Nilai Transaksi" : "Volume"}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {stocks.slice(0, 3).map((stk) => {
                  const up = stk.changePct > 0;
                  const down = stk.changePct < 0;
                  return (
                    <button
                      key={stk.ticker}
                      onClick={() => setSelectedTicker(stk.ticker)}
                      className="p-2.5 bg-white rounded-xl border border-slate-200/90 text-left hover:border-blue-400 active:scale-95 transition shadow-2xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-slate-900">{stk.ticker}</span>
                        <span
                          className={`text-[10px] font-bold px-1 py-0.2 rounded ${
                            up
                              ? "bg-emerald-50 text-emerald-700"
                              : down
                              ? "bg-rose-50 text-rose-700"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {up ? "+" : ""}{stk.changePct.toFixed(1)}%
                        </span>
                      </div>
                      <div className="text-[11px] font-bold text-slate-800 tabular-nums mt-1">
                        Rp {stk.price.toLocaleString("id-ID")}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

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

      <StockModal
        ticker={selectedTicker}
        onClose={() => setSelectedTicker(null)}
        isWatchlisted={selectedTicker ? watchlist.includes(selectedTicker) : false}
        onToggleWatchlist={toggleWatchlist}
      />

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
