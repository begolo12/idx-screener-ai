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
  entryPrice: number;
  currentPrice: number;
  exitPrice?: number;
  targetPrice: number;
  stopLossPrice: number;
  pnlPct: number;
  status: "OPEN" | "CLOSED_TP" | "CLOSED_SL";
  schemeName: string;
  entryDate: string;
  exitDate?: string;
  rationale: string;
}

interface StrategyLabState {
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
  const [loading, setLoading] = useState(true);
  const [optimizing, setOptimizing] = useState(false);
  const [activeTab, setActiveTab] = useState<"positions" | "history" | "schemes">("positions");
  const [optResult, setOptResult] = useState<{ newScheme: string; rationale: string; adjustment: string } | null>(null);

  const loadState = async () => {
    try {
      const res = await fetch("/api/ai-lab");
      const data = await res.json();
      if (data.success) {
        setState(data.state);
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

  const { metrics, activeScheme, openPositions, tradeHistory, availableSchemes } = state;

  return (
    <div className="space-y-4 pb-20">
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
            <h2 className="text-lg font-bold text-foreground tracking-tight mt-1">
              AI Strategy Lab & Paper Trading
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5 max-w-xl">
              Sistem simulasi otomatis yang mengevaluasi skema trading kuantitatif, merotasi strategi saat performa turun, dan mencatat eksekusi beli/jual secara virtual.
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

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="rounded-xl border border-border/80 bg-card p-3 shadow-sm">
          <span className="text-[11px] text-muted-foreground font-medium">Winrate Simulasi</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className={`text-xl font-bold font-mono ${metrics.winRate >= 60 ? "text-emerald-400" : "text-amber-400"}`}>
              {metrics.winRate}%
            </span>
            <span className="text-[10px] text-muted-foreground">({metrics.winCount}W / {metrics.lossCount}L)</span>
          </div>
        </div>

        <div className="rounded-xl border border-border/80 bg-card p-3 shadow-sm">
          <span className="text-[11px] text-muted-foreground font-medium">Total PnL Simulasi</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className={`text-xl font-bold font-mono ${metrics.cumulativePnlPct >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
              {metrics.cumulativePnlPct >= 0 ? "+" : ""}{metrics.cumulativePnlPct}%
            </span>
            <span className="text-[10px] text-muted-foreground">kumulatif</span>
          </div>
        </div>

        <div className="rounded-xl border border-border/80 bg-card p-3 shadow-sm">
          <span className="text-[11px] text-muted-foreground font-medium">Skema Aktif</span>
          <div className="mt-1">
            <span className="text-xs font-semibold text-cyan-400 block truncate" title={activeScheme.name}>
              {activeScheme.name}
            </span>
            <span className="text-[10px] text-muted-foreground">TP +{activeScheme.targetProfitPct}% / SL -{activeScheme.stopLossPct}%</span>
          </div>
        </div>

        <div className="rounded-xl border border-border/80 bg-card p-3 shadow-sm">
          <span className="text-[11px] text-muted-foreground font-medium">Trade Virtual</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-xl font-bold font-mono text-foreground">{metrics.totalTrades}</span>
            <span className="text-[10px] text-muted-foreground">({openPositions.length} aktif)</span>
          </div>
        </div>
      </div>

      {/* AI Reasoning Box */}
      <div className="rounded-xl border border-border/70 bg-card p-3.5 space-y-2 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-foreground">Rasional AI Quant (DeepSeek)</span>
            <span className="text-[10px] bg-secondary px-2 py-0.5 rounded text-muted-foreground font-mono">
              Evaluasi: {metrics.lastEvaluationDate}
            </span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed italic bg-secondary/20 p-2.5 rounded-lg border border-border/40">
          &ldquo;{metrics.aiRationale}&rdquo;
        </p>
      </div>

      {/* Notification if optimization just ran */}
      {optResult && (
        <div className="rounded-xl border border-cyan-500/30 bg-cyan-950/20 p-3 text-xs space-y-1 text-cyan-200">
          <div className="font-semibold text-cyan-400">Hasil Evaluasi DeepSeek:</div>
          <div>Skema Terpilih: <strong>{optResult.newScheme}</strong></div>
          <div className="text-[11px] text-cyan-300/80">{optResult.rationale}</div>
          <div className="text-[10px] font-mono text-cyan-400 mt-1">Parameter: {optResult.adjustment}</div>
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="flex gap-2 border-b border-border/80 pb-2">
        <button
          onClick={() => setActiveTab("positions")}
          className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
            activeTab === "positions"
              ? "bg-primary text-primary-foreground font-semibold"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Posisi Virtual Aktif ({openPositions.length})
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
            activeTab === "history"
              ? "bg-primary text-primary-foreground font-semibold"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Riwayat Trade Selesai ({tradeHistory.length})
        </button>
        <button
          onClick={() => setActiveTab("schemes")}
          className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
            activeTab === "schemes"
              ? "bg-primary text-primary-foreground font-semibold"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Daftar 3 Skema AI
        </button>
      </div>

      {/* Tab 1: Open Positions */}
      {activeTab === "positions" && (
        <div className="space-y-2.5">
          {openPositions.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-8 text-center text-xs text-muted-foreground">
              Tidak ada posisi aktif saat ini. AI sedang memindai sinyal beli baru dari TradingView Scanner...
            </div>
          ) : (
            openPositions.map((pos) => (
              <div
                key={pos.id}
                className="rounded-xl border border-border/80 bg-card p-3.5 space-y-2 hover:border-primary/40 transition-colors shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-foreground font-mono">{pos.ticker}</span>
                    <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                      VIRTUAL BUY
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
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-[11px] bg-secondary/30 p-2 rounded-lg font-mono">
                  <div>
                    <span className="text-muted-foreground text-[10px] block">Entry:</span>
                    Rp {pos.entryPrice.toLocaleString("id-ID")}
                  </div>
                  <div>
                    <span className="text-muted-foreground text-[10px] block">Harga Live:</span>
                    Rp {pos.currentPrice.toLocaleString("id-ID")}
                  </div>
                  <div>
                    <span className="text-muted-foreground text-[10px] block">Target / SL:</span>
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
          {tradeHistory.map((t) => (
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
                  {t.pnlPct >= 0 ? "+" : ""}{t.pnlPct}%
                </span>
              </div>
              <div className="text-[11px] text-muted-foreground">
                Beli: Rp {t.entryPrice.toLocaleString("id-ID")} → Keluar: Rp {t.exitPrice?.toLocaleString("id-ID")} ({t.schemeName})
              </div>
            </div>
          ))}
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
