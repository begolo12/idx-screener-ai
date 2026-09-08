"use client";

import { useState, useEffect } from "react";
import { Sparkles, RefreshCw, TrendingUp, ShieldCheck, AlertTriangle, CheckCircle2, Clock, Cpu } from "lucide-react";

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
  aiLearning?: {
    isAutonomous: boolean;
    targetWinRate: number;
    currentWinRate: number;
    status: string;
    whenHold: string;
    whenRotate: string;
    schemeMechanism: string;
    nextEvaluationCriterion: string;
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
    const interval = setInterval(loadState, 30000);
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
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
        <p className="text-xs text-slate-500">Memuat Portofolio AI & Data Live TradingView...</p>
      </div>
    );
  }

  const { marketStatus, portfolio, activeScheme, openPositions, tradeHistory, availableSchemes } = state;

  const filteredSectors =
    selectedSectorFilter === "all"
      ? sectorPicks
      : sectorPicks.filter((s) => s.sectorId === selectedSectorFilter);

  return (
    <div className="space-y-4 pb-28 w-full max-w-md mx-auto">
      {/* Real-time Market Hours Banner */}
      <div
        className={`rounded-2xl border p-3.5 flex items-center justify-between gap-2 transition-colors ${
          marketStatus.isOpen
            ? "border-emerald-200 bg-emerald-50 text-emerald-900"
            : "border-slate-200 bg-slate-100 text-slate-800"
        }`}
      >
        <div className="flex items-center gap-2.5">
          <span
            className={`inline-flex h-2.5 w-2.5 rounded-full ${
              marketStatus.isOpen ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
            }`}
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wide">
                {marketStatus.statusText}
              </span>
              <span className="text-[11px] opacity-75 font-mono">({marketStatus.currentWIBTime})</span>
            </div>
            <p className="text-[11px] opacity-85 mt-0.5">
              {marketStatus.sessionText} • {marketStatus.nextOpenText}
            </p>
          </div>
        </div>

        <div className="text-[10px] font-medium rounded-lg bg-white/80 border border-slate-200 px-2 py-1 text-slate-600 shrink-0">
          Senin - Jumat
        </div>
      </div>

      {/* Portfolio Virtual Capital Card (Rp 5.000.000) */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Total Nilai Portofolio
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-xl font-bold tabular-nums text-slate-900">
                Rp {portfolio.totalEquity.toLocaleString("id-ID")}
              </span>
              <span
                className={`text-xs font-bold tabular-nums px-1.5 py-0.5 rounded-md ${
                  portfolio.totalProfitNominal >= 0
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-rose-50 text-rose-700"
                }`}
              >
                {portfolio.totalProfitNominal >= 0 ? "+" : ""}
                Rp {portfolio.totalProfitNominal.toLocaleString("id-ID")} ({portfolio.totalProfitPct >= 0 ? "+" : ""}
                {portfolio.totalProfitPct}%)
              </span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-400 block">Modal Awal</span>
            <span className="text-xs font-semibold tabular-nums text-slate-600">
              Rp {portfolio.initialCapital.toLocaleString("id-ID")}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-100">
            <span className="text-[10px] text-slate-500 block">Sisa Saldo Kas</span>
            <span className="font-bold tabular-nums text-slate-900 mt-0.5 block">
              Rp {portfolio.cash.toLocaleString("id-ID")}
            </span>
          </div>
          <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-100">
            <span className="text-[10px] text-slate-500 block">Aset Saham (Invested)</span>
            <span className="font-bold tabular-nums text-blue-700 mt-0.5 block">
              Rp {portfolio.invested.toLocaleString("id-ID")}
            </span>
          </div>
        </div>
      </div>

      {/* AI Strategy Engine Header */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                AI Strategy Lab & Bandarmologi
              </h2>
              <p className="text-[11px] text-slate-500">
                Skema Berjalan: <strong className="text-blue-600 font-bold">{activeScheme.name}</strong> (TP +{activeScheme.targetProfitPct}% / SL -{activeScheme.stopLossPct}%)
              </p>
            </div>
          </div>

          {/* Autonomous Status Badge (Non-clickable, AI Self-Learning) */}
          <div className="flex flex-col items-end gap-1 shrink-0">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 text-[10px] font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
              Otonom (Self-Learning)
            </span>
            <span className="text-[10px] text-slate-500 font-medium tabular-nums">
              Target: <strong className="text-emerald-700 font-bold">95% Winrate</strong>
            </span>
          </div>
        </div>

        {/* Alasan Pemilihan & Status Berjalan */}
        <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 leading-relaxed">
          {state.metrics.aiRationale}
        </p>
      </div>

      {/* Penjelasan Lengkap Skema & Logika Pembelajaran Otonom AI */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Mekanisme Skema & Logika AI
            </h3>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-md font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            {state.aiLearning?.status || "MEMPERTAHANKAN SKEMA"}
          </span>
        </div>

        {/* Cara Kerja Skema Aktif */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Cara Kerja Skema Saat Ini:</span>
            <span className="text-[11px] font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
              {activeScheme.name}
            </span>
          </div>
          <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 leading-relaxed">
            {state.aiLearning?.schemeMechanism || activeScheme.description}
          </p>
        </div>

        {/* Matriks Keputusan Pembelajaran Mandiri AI */}
        <div className="grid grid-cols-2 gap-2 text-xs pt-1">
          <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-1">
            <span className="text-[10px] font-bold text-emerald-800 flex items-center gap-1 uppercase tracking-wider">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Kapan AI Tetap
            </span>
            <p className="text-[11px] text-emerald-950 leading-snug">
              {state.aiLearning?.whenHold || "Winrate konsisten ≥ 75% & IHSG sejalan dengan momentum volume."}
            </p>
          </div>

          <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200 space-y-1">
            <span className="text-[10px] font-bold text-amber-800 flex items-center gap-1 uppercase tracking-wider">
              <RefreshCw className="w-3.5 h-3.5 text-amber-600" />
              Kapan AI Ganti Skema
            </span>
            <p className="text-[11px] text-amber-950 leading-snug">
              {state.aiLearning?.whenRotate || "Terdeteksi 2x Stop Loss berturut-turut atau regim pasar bergeser."}
            </p>
          </div>
        </div>

        {/* Kriteria Adaptif */}
        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
          <span>Target Akurasi: <strong className="text-emerald-700 font-bold">95%</strong> (Terkini: {state.metrics.winRate}%)</span>
          <span className="text-slate-400 font-medium">Evaluasi Real-time</span>
        </div>
      </div>

      {/* Optimization Result Alert */}
      {optResult && (
        <div
          className={`rounded-2xl border p-3 text-xs space-y-1 ${
            optResult.marketIsOpen
              ? "border-blue-200 bg-blue-50 text-blue-900"
              : "border-amber-200 bg-amber-50 text-amber-900"
          }`}
        >
          <div className="font-semibold flex items-center gap-1.5">
            <span>Hasil Evaluasi:</span>
            {!optResult.marketIsOpen && (
              <span className="text-[10px] bg-amber-200/80 text-amber-800 px-1.5 py-0.2 rounded font-medium">
                Pasar Tutup
              </span>
            )}
          </div>
          <p className="text-[11px] opacity-90">{optResult.marketMessage}</p>
          <div className="text-[11px] font-semibold text-blue-700 mt-1">
            Parameter Rekomendasi: {optResult.adjustment}
          </div>
        </div>
      )}

      {/* Navigation Sub-Tabs (Segmented Control) */}
      <div className="p-1 bg-slate-100 rounded-xl flex gap-1 text-xs">
        <button
          onClick={() => setActiveTab("sector-picks")}
          className={`flex-1 py-1.5 rounded-lg text-center font-semibold transition ${
            activeTab === "sector-picks"
              ? "bg-white text-blue-600 shadow-xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Rekomendasi
        </button>
        <button
          onClick={() => setActiveTab("positions")}
          className={`flex-1 py-1.5 rounded-lg text-center font-semibold transition ${
            activeTab === "positions"
              ? "bg-white text-blue-600 shadow-xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Posisi ({openPositions.length})
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`flex-1 py-1.5 rounded-lg text-center font-semibold transition ${
            activeTab === "history"
              ? "bg-white text-blue-600 shadow-xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Riwayat ({tradeHistory.length})
        </button>
        <button
          onClick={() => setActiveTab("schemes")}
          className={`flex-1 py-1.5 rounded-lg text-center font-semibold transition ${
            activeTab === "schemes"
              ? "bg-white text-blue-600 shadow-xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Aturan
        </button>
      </div>

      {/* Tab 0: Sector Picks (Top Sektor) */}
      {activeTab === "sector-picks" && (
        <div className="space-y-3">
          {/* Sector Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
            <button
              onClick={() => setSelectedSectorFilter("all")}
              className={`px-3 py-1 rounded-full whitespace-nowrap transition ${
                selectedSectorFilter === "all"
                  ? "bg-blue-600 text-white font-semibold shadow-xs"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              Semua Sektor
            </button>
            {sectorPicks.map((sec) => (
              <button
                key={sec.sectorId}
                onClick={() => setSelectedSectorFilter(sec.sectorId)}
                className={`px-3 py-1 rounded-full whitespace-nowrap transition flex items-center gap-1 ${
                  selectedSectorFilter === sec.sectorId
                    ? "bg-blue-600 text-white font-semibold shadow-xs"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
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
              className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3 shadow-xs"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-base">{group.icon}</span>
                  <h3 className="text-sm font-bold text-slate-900">{group.sectorName}</h3>
                </div>
                <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                  {group.stocks.length} Pilihan AI
                </span>
              </div>

              {group.stocks.length === 0 ? (
                <p className="text-xs text-slate-400 py-2 italic">
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
                        className={`rounded-xl border p-3 space-y-2 transition ${
                          isMg
                            ? "border-rose-200 bg-rose-50/50"
                            : isSmartMoney
                            ? "border-emerald-200 bg-emerald-50/40"
                            : "border-slate-200/80 bg-slate-50/50"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-400">#{idx + 1}</span>
                            <span className="text-sm font-bold text-slate-900">{stock.ticker}</span>
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                                isMg
                                  ? "bg-rose-100 text-rose-700"
                                  : stock.action === "STRONG BUY"
                                  ? "bg-emerald-100 text-emerald-800 font-bold"
                                  : stock.action === "BUY"
                                  ? "bg-blue-100 text-blue-700 font-bold"
                                  : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              {stock.action}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-bold tabular-nums text-slate-900 block">
                              Rp {stock.price.toLocaleString("id-ID")}
                            </span>
                            <span
                              className={`text-[11px] font-semibold tabular-nums ${
                                stock.changePct >= 0 ? "text-emerald-700" : "text-rose-700"
                              }`}
                            >
                              {stock.changePct >= 0 ? "+" : ""}
                              {stock.changePct}%
                            </span>
                          </div>
                        </div>

                        {/* Bandarmologi & Broker Info */}
                        {stock.brokerSummary && (
                          <div className="flex flex-wrap items-center justify-between gap-1.5 text-[11px] bg-white p-2 rounded-lg border border-slate-200/80">
                            <div className="flex items-center gap-1.5">
                              <span className="text-slate-500">Top Buyer:</span>
                              <div className="flex items-center gap-1">
                                {stock.brokerSummary.topBuyers.map((code) => (
                                  <span
                                    key={code}
                                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                      code === "MG" || code === "CP"
                                        ? "bg-rose-100 text-rose-700"
                                        : code === "BK" || code === "AK" || code === "ZP" || code === "KZ"
                                        ? "bg-emerald-100 text-emerald-800"
                                        : "bg-slate-100 text-slate-700"
                                    }`}
                                  >
                                    {code}
                                    {code === "MG" && " ⚠️"}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <span
                              className={`font-semibold text-[10px] ${
                                isMg
                                  ? "text-rose-700"
                                  : isSmartMoney
                                  ? "text-emerald-700"
                                  : "text-slate-500"
                              }`}
                            >
                              {isMg
                                ? "Scalper Dominan"
                                : isSmartMoney
                                ? "Smart Money Inflow"
                                : "Retail Flow"}
                            </span>
                          </div>
                        )}

                        <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
                          <span>RSI: <strong className="text-slate-800">{stock.rsi}</strong></span>
                          <span>Nilai: <strong className="text-slate-800">{stock.turnoverFormatted}</strong></span>
                          <span>Skor AI: <strong className="text-blue-600">+{stock.recommendationScore}</strong></span>
                        </div>

                        <p className="text-[11px] text-slate-600 leading-snug px-1">
                          {stock.aiReason}
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
            <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-xs text-slate-500 bg-white">
              Tidak ada posisi aktif saat ini. AI memindai sinyal baru secara otomatis pada jam bursa (Senin-Jumat 09:00 - 15:00 WIB).
            </div>
          ) : (
            openPositions.map((pos) => (
              <div
                key={pos.id}
                className="rounded-2xl border border-slate-200 bg-white p-3.5 space-y-2.5 shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900">{pos.ticker}</span>
                    <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded-md">
                      {pos.lots} LOT ({pos.shares} Lbr)
                    </span>
                  </div>
                  <div className="text-right">
                    <span
                      className={`text-sm font-bold tabular-nums ${
                        pos.pnlPct >= 0 ? "text-emerald-700" : "text-rose-700"
                      }`}
                    >
                      {pos.pnlPct >= 0 ? "+" : ""}
                      {pos.pnlPct}%
                    </span>
                    <span
                      className={`text-[10px] block tabular-nums ${
                        pos.pnlNominal >= 0 ? "text-emerald-600" : "text-rose-600"
                      }`}
                    >
                      {pos.pnlNominal >= 0 ? "+" : ""}Rp {pos.pnlNominal.toLocaleString("id-ID")}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-[11px] bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <div>
                    <span className="text-slate-400 text-[10px] block">Modal Masuk:</span>
                    <span className="text-slate-800 font-semibold">Rp {pos.cost.toLocaleString("id-ID")}</span>
                    <span className="text-[10px] text-slate-400 block">(@{pos.entryPrice})</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Nilai Terkini:</span>
                    <span className="text-slate-800 font-semibold">Rp {pos.currentValue.toLocaleString("id-ID")}</span>
                    <span className="text-[10px] text-slate-400 block">(@{pos.currentPrice})</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">TP / SL:</span>
                    <span className="text-emerald-700 font-semibold">{pos.targetPrice}</span> /{" "}
                    <span className="text-rose-700 font-semibold">{pos.stopLossPrice}</span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-500 leading-snug px-1">
                  {pos.rationale}
                </p>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 2: History & Order Log */}
      {activeTab === "history" && (
        <div className="space-y-4">
          {/* Active Orders Log */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">
                Log Eksekusi Pembelian ({openPositions.length} Posisi)
              </span>
              <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                HOLD
              </span>
            </div>
            {openPositions.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 p-4 text-center text-xs text-slate-400 bg-white">
                Belum ada eksekusi order beli aktif.
              </div>
            ) : (
              openPositions.map((pos) => (
                <div
                  key={`log-${pos.id}`}
                  className="rounded-2xl border border-slate-200 bg-white p-3 space-y-1.5 text-xs shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{pos.ticker}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-md font-semibold bg-emerald-50 text-emerald-800">
                        BUY {pos.lots} LOT
                      </span>
                      <span className="text-[10px] text-slate-400">{pos.entryDate}</span>
                    </div>
                    <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                      Target +5% / SL -3%
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1 border-t border-slate-50">
                    <span>Masuk: <strong className="text-slate-800">Rp {pos.entryPrice.toLocaleString("id-ID")}</strong></span>
                    <span>Total: <strong className="text-slate-800">Rp {pos.cost.toLocaleString("id-ID")}</strong></span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Closed Trades */}
          <div className="space-y-2 pt-2 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">
                Transaksi Selesai ({tradeHistory.length})
              </span>
              <span className="text-[10px] text-slate-400">Realized PnL</span>
            </div>
            {tradeHistory.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-xs text-slate-400 bg-white leading-relaxed">
                Posisi aktif saat ini berjalan di tab <strong>Posisi</strong> dan akan tercatat selesai di sini otomatis saat menyentuh Target Profit (+5%) atau Stop Loss (-3%).
              </div>
            ) : (
              tradeHistory.map((t) => (
                <div
                  key={t.id}
                  className="rounded-2xl border border-slate-200 bg-white p-3 space-y-1.5 text-xs shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{t.ticker}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-md font-semibold ${
                          t.status === "CLOSED_TP"
                            ? "bg-emerald-50 text-emerald-800"
                            : "bg-rose-50 text-rose-800"
                        }`}
                      >
                        {t.status === "CLOSED_TP" ? "TAKE PROFIT" : "STOP LOSS"}
                      </span>
                      <span className="text-[10px] text-slate-400">{t.exitDate}</span>
                    </div>
                    <span
                      className={`tabular-nums font-bold ${
                        t.pnlPct >= 0 ? "text-emerald-700" : "text-rose-700"
                      }`}
                    >
                      {t.pnlPct >= 0 ? "+" : ""}{t.pnlPct}% (Rp {t.pnlNominal.toLocaleString("id-ID")})
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {t.lots} Lot @ Rp {t.entryPrice.toLocaleString("id-ID")} → Jual: Rp {t.exitPrice?.toLocaleString("id-ID")}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Schemes */}
      {activeTab === "schemes" && (
        <div className="space-y-3">
          {availableSchemes.map((s) => (
            <div
              key={s.id}
              className={`rounded-2xl border p-3.5 space-y-2 transition ${
                s.id === activeScheme.id
                  ? "border-blue-300 bg-blue-50/50 shadow-xs"
                  : "border-slate-200 bg-white"
              }`}
            >
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                  {s.name}
                  {s.id === activeScheme.id && (
                    <span className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded-md font-semibold">
                      Aktif Berjalan
                    </span>
                  )}
                </h4>
                <span className="text-[11px] font-semibold text-slate-600">
                  TP +{s.targetProfitPct}% / SL -{s.stopLossPct}%
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">{s.description}</p>
              <div className="text-[11px] text-blue-800 bg-blue-50 p-2.5 rounded-xl border border-blue-100">
                Aturan: {s.rule}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
