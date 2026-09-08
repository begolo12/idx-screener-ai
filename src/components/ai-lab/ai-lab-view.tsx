"use client";

import { useState, useEffect } from "react";

interface TradingScheme {
  id: string;
  name: string;
  description: string;
  rule: string;
  targetProfitPct: number;
  stopLossPct: number;
}

interface PaperTrade {
  id: string;
  ticker: string;
  name: string;
  type: "BUY";
  lots: number;
  shares: number;
  entryPrice: number;
  currentPrice: number;
  exitPrice?: number;
  cost: number;
  currentValue: number;
  pnlNominal: number;
  pnlPct: number;
  targetPrice: number;
  stopLossPrice: number;
  status: "OPEN" | "CLOSED_TP" | "CLOSED_SL";
  schemeName: string;
  entryDate: string;
  exitDate?: string;
  rationale: string;
}

interface MarketScheduleStatus {
  isOpen: boolean;
  isWeekend: boolean;
  statusText: string;
  sessionText: string;
  nextOpenText: string;
  currentWIBTime: string;
}

interface PortfolioBalance {
  initialCapital: number;
  cash: number;
  invested: number;
  totalEquity: number;
  totalProfitNominal: number;
  totalProfitPct: number;
}

interface SectorPickStock {
  ticker: string;
  name: string;
  price: number;
  changePct: number;
  volume: number;
  turnover: number;
  turnoverFormatted: string;
  rsi: number;
  recommendationScore: number;
  action: "STRONG BUY" | "BUY" | "ACCUMULATE" | "HINDARI (MG SCALPER)";
  signals: string[];
  aiReason: string;
  brokerSummary?: {
    dominantCategory: "SMART_MONEY" | "RETAIL" | "SCALPER_SPECULATIVE" | "BALANCED";
    isMgDominant: boolean;
    topBuyers: string[];
    topSellers: string[];
    bandarmologiText: string;
  };
}

interface SectorPicksGroup {
  sectorId: string;
  sectorName: string;
  icon: string;
  stocks: SectorPickStock[];
}

interface StrategyLabState {
  marketStatus: MarketScheduleStatus;
  portfolio: PortfolioBalance;
  activeScheme: TradingScheme;
  availableSchemes: TradingScheme[];
  metrics: {
    totalTrades: number;
    winCount: number;
    lossCount: number;
    winRate: number;
    cumulativePnlPct: number;
    lastEvaluationDate: string;
    aiRationale: string;
  };
  openPositions: PaperTrade[];
  tradeHistory: PaperTrade[];
}

export function AILabView() {
  const [state, setState] = useState<StrategyLabState | null>(null);
  const [sectorPicks, setSectorPicks] = useState<SectorPicksGroup[]>([]);
  const [selectedSectorFilter, setSelectedSectorFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [optimizing, setOptimizing] = useState(false);
  const [activeTab, setActiveTab] = useState<"sector-picks" | "positions" | "history" | "schemes">("sector-picks");
  const [optResult, setOptResult] = useState<{
    marketIsOpen: boolean;
    marketMessage: string;
    newScheme: string;
    rationale: string;
    adjustment: string;
  } | null>(null);

  const loadState = async () => {
    try {
      const res = await fetch("/api/ai-lab");
      const data = await res.json();
      if (data.success) {
        setState(data.state);
        if (data.sectorPicks) {
          setSectorPicks(data.sectorPicks);
        }
      }
    } catch (err) {
      console.error("Failed to load AI lab state:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadState();
    const interval = setInterval(loadState, 30000); // sync live prices every 30s
    return () => clearInterval(interval);
  }, []);

  const handleOptimize = async () => {
    setOptimizing(true);
    setOptResult(null);
    try {
      const res = await fetch("/api/ai-lab", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setOptResult(data.optimization);
        setState(data.state);
        if (data.sectorPicks) {
          setSectorPicks(data.sectorPicks);
        }
      }
    } catch (err) {
      console.error("Failed to optimize AI scheme:", err);
    } finally {
      setOptimizing(false);
    }
  };

  if (loading || !state) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center space-y-3">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="text-xs text-muted-foreground">Memuat AI Strategy Lab & Data Live TradingView...</p>
      </div>
    );
  }

  const { marketStatus, portfolio, activeScheme, openPositions, tradeHistory, availableSchemes } = state;

  const filteredSectors = selectedSectorFilter === "all"
    ? sectorPicks
    : sectorPicks.filter(s => s.sectorId === selectedSectorFilter);

  return (
    <div className="space-y-4 pb-20">
      {/* Real-time Market Hours Banner */}
      <div
        className={`rounded-xl border p-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 transition-colors ${
          marketStatus.isOpen
            ? "border-emerald-500/30 bg-emerald-950/20 text-emerald-300"
            : "border-rose-500/30 bg-rose-950/20 text-rose-300"
        }`}
      >
        <div className="flex items-center gap-2.5">
          <span
            className={`inline-flex h-3 w-3 rounded-full ${
              marketStatus.isOpen ? "bg-emerald-400 animate-pulse" : "bg-rose-500"
            }`}
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold font-mono tracking-wide uppercase">
                {marketStatus.statusText}
              </span>
              <span className="text-[11px] opacity-80">({marketStatus.currentWIBTime})</span>
            </div>
            <p className="text-[11px] opacity-90 mt-0.5">
              {marketStatus.sessionText} • {marketStatus.nextOpenText}
            </p>
          </div>
        </div>

        <div className="text-[10px] font-mono rounded bg-background/50 border border-border/50 px-2 py-1 self-start sm:self-auto text-foreground">
          Jam Perdagangan: Senin - Jumat (09:00 - 15:00 WIB)
        </div>
      </div>

      {/* Portfolio Virtual Capital Card (Rp 5.000.000) */}
      <div className="rounded-xl border border-border/80 bg-card p-4 space-y-3 shadow-sm">
        <div className="flex items-center justify-between border-b border-border/60 pb-2.5">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
              Modal Virtual Trading
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-xl font-bold font-mono text-foreground">
                Rp {portfolio.totalEquity.toLocaleString("id-ID")}
              </span>
              <span
                className={`text-xs font-bold font-mono ${
                  portfolio.totalProfitNominal >= 0 ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                {portfolio.totalProfitNominal >= 0 ? "+" : ""}Rp {portfolio.totalProfitNominal.toLocaleString("id-ID")} (
                {portfolio.totalProfitPct >= 0 ? "+" : ""}
                {portfolio.totalProfitPct}%)
              </span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-muted-foreground block font-mono">Modal Pokok</span>
            <span className="text-xs font-semibold font-mono text-foreground">
              Rp {portfolio.initialCapital.toLocaleString("id-ID")}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs font-mono">
          <div className="rounded-lg bg-secondary/30 p-2.5 border border-border/40">
            <span className="text-[10px] text-muted-foreground block">Sisa Saldo Kas</span>
            <span className="font-bold text-foreground mt-0.5 block">
              Rp {portfolio.cash.toLocaleString("id-ID")}
            </span>
          </div>
          <div className="rounded-lg bg-secondary/30 p-2.5 border border-border/40">
            <span className="text-[10px] text-muted-foreground block">Dana di Saham (Invested)</span>
            <span className="font-bold text-cyan-400 mt-0.5 block">
              Rp {portfolio.invested.toLocaleString("id-ID")}
            </span>
          </div>
        </div>
      </div>

      {/* Top Header Card */}
      <div className="relative overflow-hidden rounded-xl border border-primary/20 bg-gradient-to-br from-card via-card to-primary/5 p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
              <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 font-bold">
                Adaptive AI Engine • DeepSeek
              </span>
            </div>
            <h2 className="text-base font-bold text-foreground tracking-tight mt-1">
              AI Strategy Lab & Bandarmologi Broker
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5 max-w-xl">
              Memadukan indikator teknikal TradingView & profiling broker (waspada scalper MG, prioritaskan Smart Money asing).
            </p>
          </div>

          <button
            onClick={handleOptimize}
            disabled={optimizing}
            className="self-start sm:self-auto rounded-lg bg-gradient-to-r from-primary to-cyan-600 px-3.5 py-2 text-xs font-semibold text-white shadow hover:opacity-90 disabled:opacity-50 transition-all flex items-center gap-2"
          >
            {optimizing ? (
              <>
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>DeepSeek Evaluasi Skema...</span>
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Evaluasi & Rotasi Skema AI</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Scheme Info Card */}
      <div className="rounded-xl border border-border/80 bg-card p-3.5 space-y-1.5 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-cyan-400 flex items-center gap-2">
            Skema Aktif: {activeScheme.name}
            <span className="text-[9px] bg-cyan-500/20 text-cyan-300 px-1.5 py-0.5 rounded font-mono">
              TARGET +{activeScheme.targetProfitPct}% / SL -{activeScheme.stopLossPct}%
            </span>
          </span>
          <span className="text-[10px] text-muted-foreground font-mono">
            {openPositions.length} Posisi Aktif
          </span>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed italic bg-secondary/20 p-2.5 rounded-lg border border-border/40">
          &ldquo;{state.metrics.aiRationale}&rdquo;
        </p>
      </div>

      {/* Optimization Result Alert */}
      {optResult && (
        <div
          className={`rounded-xl border p-3 text-xs space-y-1 ${
            optResult.marketIsOpen
              ? "border-cyan-500/30 bg-cyan-950/20 text-cyan-200"
              : "border-amber-500/30 bg-amber-950/20 text-amber-200"
          }`}
        >
          <div className="font-semibold flex items-center gap-1.5">
            <span>Hasil Evaluasi DeepSeek:</span>
            {!optResult.marketIsOpen && (
              <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded font-mono">
                PASAR TUTUP
              </span>
            )}
          </div>
          <p className="text-[11px] opacity-90">{optResult.marketMessage}</p>
          <div className="text-[10px] font-mono text-cyan-400 mt-1">
            Parameter Rekomendasi: {optResult.adjustment}
          </div>
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-border/80 pb-2">
        <button
          onClick={() => setActiveTab("sector-picks")}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
            activeTab === "sector-picks"
              ? "bg-primary text-primary-foreground font-semibold shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <span>⭐</span>
          <span>Top 5 Tiap Sektor ({sectorPicks.reduce((acc, s) => acc + s.stocks.length, 0)})</span>
        </button>
        <button
          onClick={() => setActiveTab("positions")}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            activeTab === "positions"
              ? "bg-primary text-primary-foreground font-semibold shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Posisi Real Aktif ({openPositions.length})
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            activeTab === "history"
              ? "bg-primary text-primary-foreground font-semibold shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Riwayat Trade ({tradeHistory.length})
        </button>
        <button
          onClick={() => setActiveTab("schemes")}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            activeTab === "schemes"
              ? "bg-primary text-primary-foreground font-semibold shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          3 Skema Kuantitatif
        </button>
      </div>

      {/* Tab 0: Sector Picks (Top 5 per Sektor with Broker Insights) */}
      {activeTab === "sector-picks" && (
        <div className="space-y-4">
          {/* Sector Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
            <button
              onClick={() => setSelectedSectorFilter("all")}
              className={`px-2.5 py-1 rounded-full whitespace-nowrap transition-colors ${
                selectedSectorFilter === "all"
                  ? "bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/40"
                  : "bg-secondary/40 text-muted-foreground hover:text-foreground border border-border/50"
              }`}
            >
              Semua Sektor ({sectorPicks.length})
            </button>
            {sectorPicks.map((sec) => (
              <button
                key={sec.sectorId}
                onClick={() => setSelectedSectorFilter(sec.sectorId)}
                className={`px-2.5 py-1 rounded-full whitespace-nowrap transition-colors flex items-center gap-1 ${
                  selectedSectorFilter === sec.sectorId
                    ? "bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/40"
                    : "bg-secondary/40 text-muted-foreground hover:text-foreground border border-border/50"
                }`}
              >
                <span>{sec.icon}</span>
                <span>{sec.sectorName}</span>
              </button>
            ))}
          </div>

          {/* Grouped Sector List */}
          {filteredSectors.map((group) => (
            <div
              key={group.sectorId}
              className="rounded-xl border border-border/80 bg-card p-4 space-y-3 shadow-sm"
            >
              <div className="flex items-center justify-between border-b border-border/60 pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-base">{group.icon}</span>
                  <h3 className="text-sm font-bold text-foreground">{group.sectorName}</h3>
                </div>
                <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                  {group.stocks.length} Saham Terpilih AI
                </span>
              </div>

              {group.stocks.length === 0 ? (
                <p className="text-xs text-muted-foreground py-2 italic">
                  Belum ada saham yang memenuhi kriteria likuiditas di sektor ini saat ini.
                </p>
              ) : (
                <div className="space-y-2.5">
                  {group.stocks.map((stock, idx) => {
                    const isMg = stock.brokerSummary?.isMgDominant;
                    const isSmartMoney = stock.brokerSummary?.dominantCategory === "SMART_MONEY";

                    return (
                      <div
                        key={stock.ticker}
                        className={`rounded-lg border p-3 space-y-2 transition-colors ${
                          isMg
                            ? "border-rose-500/40 bg-rose-950/10 hover:border-rose-500/60"
                            : isSmartMoney
                            ? "border-emerald-500/30 bg-emerald-950/10 hover:border-emerald-500/50"
                            : "border-border/50 bg-secondary/20 hover:border-cyan-500/40"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-bold text-muted-foreground/60">
                              #{idx + 1}
                            </span>
                            <span className="text-sm font-bold font-mono text-foreground tracking-tight">
                              {stock.ticker}
                            </span>
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.5 rounded font-mono ${
                                isMg
                                  ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                                  : stock.action === "STRONG BUY"
                                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                  : stock.action === "BUY"
                                  ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                                  : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                              }`}
                            >
                              {stock.action}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-bold font-mono text-foreground block">
                              Rp {stock.price.toLocaleString("id-ID")}
                            </span>
                            <span
                              className={`text-[10px] font-mono font-semibold ${
                                stock.changePct >= 0 ? "text-emerald-400" : "text-rose-400"
                              }`}
                            >
                              {stock.changePct >= 0 ? "+" : ""}{stock.changePct}%
                            </span>
                          </div>
                        </div>

                        {/* Bandarmologi & Broker Info Bar */}
                        {stock.brokerSummary && (
                          <div className="flex flex-wrap items-center justify-between gap-1.5 text-[10px] font-mono bg-background/50 px-2.5 py-1.5 rounded border border-border/40">
                            <div className="flex items-center gap-1.5">
                              <span className="text-muted-foreground">Top Buyer:</span>
                              <div className="flex items-center gap-1">
                                {stock.brokerSummary.topBuyers.map((code) => (
                                  <span
                                    key={code}
                                    className={`px-1 py-0.2 rounded font-bold ${
                                      code === "MG" || code === "CP"
                                        ? "bg-rose-500/20 text-rose-400 border border-rose-500/40"
                                        : code === "BK" || code === "AK" || code === "ZP" || code === "KZ"
                                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                                        : "bg-secondary text-foreground"
                                    }`}
                                  >
                                    {code}
                                    {code === "MG" && " ⚠️"}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <span
                              className={`font-semibold ${
                                isMg
                                  ? "text-rose-400"
                                  : isSmartMoney
                                  ? "text-emerald-400"
                                  : "text-muted-foreground"
                              }`}
                            >
                              {isMg
                                ? "⚠️ SCALPER DOMINAN"
                                : isSmartMoney
                                ? "🛡️ SMART MONEY INFLOW"
                                : "RETAIL FLOW"}
                            </span>
                          </div>
                        )}

                        <div className="flex items-center justify-between text-[11px] text-muted-foreground font-mono bg-background/40 px-2.5 py-1.5 rounded">
                          <span>RSI: <strong className="text-foreground">{stock.rsi}</strong></span>
                          <span>Transaksi: <strong className="text-foreground">{stock.turnoverFormatted}</strong></span>
                          <span>Skor TV: <strong className="text-cyan-400">+{stock.recommendationScore}</strong></span>
                        </div>

                        <p className={`text-[11px] leading-snug ${isMg ? "text-rose-300 font-medium" : "text-muted-foreground/90"}`}>
                          💡 {stock.aiReason}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Tab 1: Open Positions */}
      {activeTab === "positions" && (
        <div className="space-y-2.5">
          {openPositions.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-8 text-center text-xs text-muted-foreground">
              Tidak ada posisi aktif saat ini. AI akan memindai kandidat baru saat bursa buka (Senin-Jumat 09:00 - 15:00 WIB).
            </div>
          ) : (
            openPositions.map((pos) => (
              <div
                key={pos.id}
                className="rounded-xl border border-border/80 bg-card p-3.5 space-y-2.5 hover:border-primary/40 transition-colors shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-foreground font-mono">{pos.ticker}</span>
                    <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded font-mono">
                      {pos.lots} LOT ({pos.shares} LEMBAR)
                    </span>
                    <span className="text-[10px] text-muted-foreground hidden sm:inline">{pos.name}</span>
                  </div>
                  <div className="text-right">
                    <span
                      className={`text-sm font-bold font-mono ${
                        pos.pnlPct >= 0 ? "text-emerald-400" : "text-rose-400"
                      }`}
                    >
                      {pos.pnlPct >= 0 ? "+" : ""}{pos.pnlPct}%
                    </span>
                    <span
                      className={`text-[10px] font-mono block ${
                        pos.pnlNominal >= 0 ? "text-emerald-400/90" : "text-rose-400/90"
                      }`}
                    >
                      {pos.pnlNominal >= 0 ? "+" : ""}Rp {pos.pnlNominal.toLocaleString("id-ID")}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-[11px] bg-secondary/30 p-2.5 rounded-lg font-mono">
                  <div>
                    <span className="text-muted-foreground text-[10px] block">Modal Beli:</span>
                    Rp {pos.cost.toLocaleString("id-ID")} (@{pos.entryPrice})
                  </div>
                  <div>
                    <span className="text-muted-foreground text-[10px] block">Nilai Sekarang:</span>
                    Rp {pos.currentValue.toLocaleString("id-ID")} (@{pos.currentPrice})
                  </div>
                  <div>
                    <span className="text-muted-foreground text-[10px] block">TP / SL:</span>
                    <span className="text-emerald-400">{pos.targetPrice}</span> /{" "}
                    <span className="text-rose-400">{pos.stopLossPrice}</span>
                  </div>
                </div>

                <p className="text-[11px] text-muted-foreground leading-snug">
                  {pos.rationale}
                </p>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 2: History */}
      {activeTab === "history" && (
        <div className="space-y-2.5">
          {tradeHistory.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-8 text-center text-xs text-muted-foreground">
              Belum ada transaksi selesai. Posisi akan ditutup otomatis ketika harga live menyentuh Target Profit (+5%) atau Stop Loss (-3%) pada jam perdagangan bursa.
            </div>
          ) : (
            tradeHistory.map((t) => (
              <div
                key={t.id}
                className="rounded-xl border border-border/60 bg-card p-3 space-y-1.5 text-xs shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-foreground font-mono">{t.ticker}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                        t.status === "CLOSED_TP"
                          ? "bg-emerald-500/15 text-emerald-400"
                          : "bg-rose-500/15 text-rose-400"
                      }`}
                    >
                      {t.status === "CLOSED_TP" ? "TAKE PROFIT" : "STOP LOSS"}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono">{t.exitDate}</span>
                  </div>
                  <span
                    className={`font-mono font-bold ${
                      t.pnlPct >= 0 ? "text-emerald-400" : "text-rose-400"
                    }`}
                  >
                    {t.pnlPct >= 0 ? "+" : ""}{t.pnlPct}% (Rp {t.pnlNominal.toLocaleString("id-ID")})
                  </span>
                </div>
                <div className="text-[11px] text-muted-foreground">
                  {t.lots} Lot @ Rp {t.entryPrice.toLocaleString("id-ID")} → Keluar: Rp {t.exitPrice?.toLocaleString("id-ID")} ({t.schemeName})
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 3: Schemes */}
      {activeTab === "schemes" && (
        <div className="space-y-3">
          {availableSchemes.map((s) => (
            <div
              key={s.id}
              className={`rounded-xl border p-3.5 space-y-1.5 transition-colors ${
                s.id === activeScheme.id
                  ? "border-cyan-500/50 bg-cyan-950/10 shadow-sm"
                  : "border-border/60 bg-card"
              }`}
            >
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-foreground flex items-center gap-2">
                  {s.name}
                  {s.id === activeScheme.id && (
                    <span className="text-[9px] bg-cyan-500/20 text-cyan-400 px-1.5 py-0.5 rounded uppercase font-mono">
                      Aktif Berjalan
                    </span>
                  )}
                </h4>
                <span className="text-[10px] font-mono text-muted-foreground">
                  TP +{s.targetProfitPct}% / SL -{s.stopLossPct}%
                </span>
              </div>
              <p className="text-xs text-muted-foreground">{s.description}</p>
              <div className="text-[11px] font-mono text-cyan-300/90 bg-secondary/40 p-2 rounded border border-border/40">
                Rule: {s.rule}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
