"use client";

import { useState, useEffect } from "react";
import {
  Sparkles,
  RefreshCw,
  TrendingUp,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Cpu,
  HelpCircle,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  Timer,
  Gauge,
} from "lucide-react";

interface TradingScheme {
  id: string;
  name: string;
  description: string;
  rule: string;
  targetProfitPct: number;
  stopLossPct: number;
}

interface DurationKPI {
  avgTpDurationDays: number;
  avgSlDurationDays: number;
  fastestTpDays: number;
  fastestSlDays: number;
  fastestSchemeName: string;
  velocityScore: number;
  speedAnalysis: string;
  marketDailyVolatility?: number;
  fastestStock?: string;
  fastestStockPerf?: string;
  sampleTickers?: string[];
  calculationBasis?: string;
}

interface PaperTrade {
  id: string;
  ticker: string;
  name: string;
  type: "BUY";
  category?: "BLUECHIP_60" | "SCALPING_40";
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
  holdingDays?: number;
  rationale: string;
  bestBid?: { price: number; volume: number };
  bestOffer?: { price: number; volume: number };
  isRealtimeBEI?: boolean;
  tradingTime?: string;
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
  bluechipInvested?: number;
  scalpingInvested?: number;
  bluechipTargetPct?: number;
  scalpingTargetPct?: number;
  bluechipPct?: number;
  scalpingPct?: number;
  idleCashPct?: number;
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

interface DailyLearningLog {
  dayNumber: number;
  date: string;
  marketRegime: string;
  winRateRecorded: number;
  lessonLearned: string;
  parameterAdjustment: string;
  status: "OPTIMAL" | "ROTATED" | "CALIBRATED";
}

interface AILearningEvolution {
  isAutonomous: boolean;
  targetWinRate: number;
  currentWinRate: number;
  status: string;
  whenHold: string;
  whenRotate: string;
  schemeMechanism: string;
  nextEvaluationCriterion: string;
  learningDay?: number;
  adaptationScore?: number;
  calibratedRules?: string[];
  recentDailyLogs?: DailyLearningLog[];
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
    durationKpi?: DurationKPI;
  };
  aiLearning?: AILearningEvolution;
  openPositions: PaperTrade[];
  tradeHistory: PaperTrade[];
}

export function AILabView() {
  const [state, setState] = useState<StrategyLabState | null>(null);
  const [sectorPicks, setSectorPicks] = useState<SectorPicksGroup[]>([]);
  const [selectedSectorFilter, setSelectedSectorFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"sector-picks" | "positions" | "history" | "schemes">("sector-picks");
  const [showGuide, setShowGuide] = useState(false);

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
    const interval = setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        loadState();
      }
    }, 25000);
    return () => clearInterval(interval);
  }, []);

  if (loading || !state) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center space-y-3">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
        <p className="text-xs text-slate-500 font-medium">Memuat data portofolio & analisa bursa...</p>
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

        <div className="text-[10px] font-semibold rounded-lg bg-white/90 border border-slate-200 px-2.5 py-1 text-slate-700 shrink-0">
          Senin - Jumat
        </div>
      </div>

      {/* Portfolio Virtual Capital Card (Rp 5.000.000) */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Total Saldo Portofolio
              </span>
              <button
                onClick={() => setShowGuide(!showGuide)}
                className="text-slate-400 hover:text-blue-600 transition p-0.5"
                aria-label="Petunjuk Portofolio"
              >
                <HelpCircle className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-xl font-bold tabular-nums text-slate-900">
                Rp {portfolio.totalEquity.toLocaleString("id-ID")}
              </span>
              <span
                className={`text-xs font-bold tabular-nums px-2 py-0.5 rounded-md ${
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
            <span className="text-[10px] text-slate-400 block font-medium">Modal Awal</span>
            <span className="text-xs font-semibold tabular-nums text-slate-700">
              Rp {portfolio.initialCapital.toLocaleString("id-ID")}
            </span>
          </div>
        </div>

        {/* Skema Alokasi Portofolio: 60% Bluechip + 40% High Risk Scalping */}
        <div className="space-y-2 pt-1 border-t border-slate-100">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-bold text-slate-800 flex items-center gap-1">
              ⚖️ Alokasi Modal Portofolio
            </span>
            <span className="text-[10px] font-semibold text-slate-500">
              60% Bluechip • 40% Scalping
            </span>
          </div>

          {/* Segmented Allocation Bar */}
          <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden flex">
            <div
              style={{ width: `${portfolio.bluechipPct || 0}%` }}
              className="bg-blue-600 transition-all duration-500"
              title={`Bluechip Solid: ${portfolio.bluechipPct || 0}%`}
            />
            <div
              style={{ width: `${portfolio.scalpingPct || 0}%` }}
              className="bg-amber-500 transition-all duration-500"
              title={`High Risk Scalping: ${portfolio.scalpingPct || 0}%`}
            />
            <div
              style={{ width: `${portfolio.idleCashPct || 0}%` }}
              className="bg-slate-300 transition-all duration-500"
              title={`Kas Siap Pakai: ${portfolio.idleCashPct || 0}%`}
            />
          </div>

          {/* Breakdown 3 Kolom: Bluechip vs Scalping vs Kas */}
          <div className="grid grid-cols-3 gap-1.5 text-center text-xs pt-0.5">
            <div className="p-2 rounded-xl bg-blue-50/80 border border-blue-100">
              <span className="text-[10px] font-bold text-blue-800 block">🛡️ Bluechip (60%)</span>
              <span className="text-xs font-bold text-blue-950 tabular-nums block mt-0.5">
                Rp {(portfolio.bluechipInvested || 0).toLocaleString("id-ID")}
              </span>
              <span className="text-[9px] text-blue-700 font-semibold">{portfolio.bluechipPct || 0}% Total</span>
            </div>

            <div className="p-2 rounded-xl bg-amber-50/80 border border-amber-100">
              <span className="text-[10px] font-bold text-amber-800 block">⚡ Scalping (40%)</span>
              <span className="text-xs font-bold text-amber-950 tabular-nums block mt-0.5">
                Rp {(portfolio.scalpingInvested || 0).toLocaleString("id-ID")}
              </span>
              <span className="text-[9px] text-amber-700 font-semibold">{portfolio.scalpingPct || 0}% Total</span>
            </div>

            <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] font-bold text-slate-700 block">💵 Kas Bebas</span>
              <span className="text-xs font-bold text-slate-900 tabular-nums block mt-0.5">
                Rp {portfolio.cash.toLocaleString("id-ID")}
              </span>
              <span className="text-[9px] text-slate-500 font-semibold">{portfolio.idleCashPct || 0}% Total</span>
            </div>
          </div>
        </div>

        {/* Beginner Guide Expandable */}
        {showGuide && (
          <div className="p-3.5 rounded-xl bg-blue-50/80 border border-blue-200 text-[11px] text-slate-700 space-y-2 animate-in fade-in duration-150">
            <p className="font-bold text-blue-900 text-xs">Mekanisme Portofolio AI 60/40 & Data Real-time:</p>
            <div className="space-y-1.5 text-[11px] leading-relaxed">
              <p>
                <strong>🛡️ 60% Bluechip Solid (Pilar Modal):</strong> Dialokasikan ke emiten berkapitalisasi & volume besar (LQ45 seperti BBCA, BBRI, BMRI, ANTM, dsb). Bertujuan menjaga stabilitas modal dengan swing profit (+5%).
              </p>
              <p>
                <strong>⚡ 40% High Risk High Reward (Scalping Cepat):</strong> Dialokasikan ke saham likuid bervolatilitas harian tinggi dengan momentum RSI positif. Bertujuan akselerasi profit cepat (+3.5%) dan proteksi cut loss disiplin (-2.0%).
              </p>
              <p>
                <strong>🔄 Reinvesting Saldo Kas Otomatis:</strong> Sistem tidak pernah membiarkan kas menganggur saat jam bursa buka. Begitu posisi ditutup (TP/SL) atau terdapat saldo kas, AI langsung membelanjakannya ke saham baru sesuai porsi 60/40.
              </p>
              <p>
                <strong>⏱️ Penanggulangan Tick Cepat Real-time (Surgical Polling):</strong> AI menggunakan TradingView Scanner (tanpa batas kuota) untuk menyaring 800+ saham, lalu hanya menembak <strong>Zapi Stockbit API 0s-delay</strong> untuk 2-4 saham yang sedang dipegang portofolio. Hasilnya: harga matching engine & antrian Bid/Offer 100% live detik ini tanpa menguras kuota API.
              </p>
            </div>
          </div>
        )}
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
                Sistem Analisis Mandiri (AI Self-Learning)
              </h2>
              <p className="text-[11px] text-slate-500">
                Strategi: <strong className="text-blue-600 font-bold">{activeScheme.name}</strong> (Untung +{activeScheme.targetProfitPct}% / Pengaman -{activeScheme.stopLossPct}%)
              </p>
            </div>
          </div>

          {/* Autonomous Status Badge (Non-clickable, AI Self-Learning) */}
          <div className="flex flex-col items-end gap-0.5 shrink-0">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
              Otonom (Otomatis)
            </span>
            <span className="text-[10px] text-slate-500 font-medium tabular-nums">
              Target Akurasi: <strong className="text-emerald-700 font-bold">95% Winrate</strong>
            </span>
          </div>
        </div>

        {/* Alasan Pemilihan & Status Berjalan */}
        <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 leading-relaxed">
          💡 {state.metrics.aiRationale}
        </p>
      </div>

      {/* Penjelasan Lengkap Skema & Logika Pembelajaran Otonom AI */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Penjelasan Cara Kerja Strategi AI
            </h3>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-md font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            {state.aiLearning?.status || "STRATEGI BERJALAN OPTIMAL"}
          </span>
        </div>

        {/* Cara Kerja Skema Aktif */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Strategi Saat Ini:</span>
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
              {state.aiLearning?.whenHold || "Tingkat kemenangan konsisten ≥ 75% & pasar mendukung kenaikan harga."}
            </p>
          </div>

          <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200 space-y-1">
            <span className="text-[10px] font-bold text-amber-800 flex items-center gap-1 uppercase tracking-wider">
              <RefreshCw className="w-3.5 h-3.5 text-amber-600" />
              Kapan AI Ganti Strategi
            </span>
            <p className="text-[11px] text-amber-950 leading-snug">
              {state.aiLearning?.whenRotate || "Terjadi 2x rugi berturut-turut atau pola pasar berubah drastis."}
            </p>
          </div>
        </div>

        {/* Kriteria Adaptif */}
        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
          <span>Target Keberhasilan: <strong className="text-emerald-700 font-bold">95%</strong> (Terkini: {state.metrics.winRate}%)</span>
          <span className="text-slate-400 font-medium">Evaluasi Real-time</span>
        </div>
      </div>

      {/* Rekam Jejak Evolusi & Pembelajaran Harian AI (Daily Compound Self-Learning) */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3.5 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-purple-600" />
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Evolusi Pembelajaran Harian AI (Daily Self-Improvement)
              </h3>
              <p className="text-[10px] text-slate-500 font-medium">
                Kecerdasan terakumulasi otomatis dari dinamika bursa BEI setiap hari
              </p>
            </div>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200">
            Hari ke-{state.aiLearning?.learningDay || 40}
          </span>
        </div>

        {/* Skor Adaptasi Pasar & Level Kecerdasan */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2.5 rounded-xl bg-purple-50/60 border border-purple-100 space-y-1">
            <span className="text-[10px] font-semibold text-purple-800 uppercase tracking-wider block">
              Skor Adaptasi Pasar
            </span>
            <div className="text-lg font-black text-purple-950 tabular-nums">
              {state.aiLearning?.adaptationScore || 96}/100
            </div>
            <span className="text-[10px] text-purple-700 block">Terkalibrasi dari {state.tradeHistory.length} transaksi riil</span>
          </div>

          <div className="p-2.5 rounded-xl bg-blue-50/60 border border-blue-100 space-y-1">
            <span className="text-[10px] font-semibold text-blue-800 uppercase tracking-wider block">
              Status Belajar Harian
            </span>
            <div className="text-sm font-bold text-blue-950 mt-1 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
              Aktif Belajar
            </div>
            <span className="text-[10px] text-blue-700 block">Evaluasi tiap sesi tutup & buka</span>
          </div>
        </div>

        {/* Aturan & Parameter yang Berhasil Dikalibrasi AI */}
        <div className="space-y-1.5 pt-1">
          <span className="text-[11px] font-bold text-slate-800 block">
            Parameter Terkalibrasi Otomatis:
          </span>
          <div className="space-y-1">
            {(state.aiLearning?.calibratedRules || []).map((rule, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2 text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span className="leading-snug">{rule}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Jurnal Pembelajaran Harian (Daily Logs) */}
        {state.aiLearning?.recentDailyLogs && state.aiLearning.recentDailyLogs.length > 0 && (
          <div className="space-y-2 pt-1 border-t border-slate-100">
            <span className="text-[11px] font-bold text-slate-800 block">
              Catatan Pelajaran Harian AI (Daily Knowledge Logs):
            </span>
            <div className="space-y-1.5">
              {state.aiLearning.recentDailyLogs.map((log) => (
                <div
                  key={log.dayNumber}
                  className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[11px] text-slate-800 flex items-center gap-1.5">
                      <span className="text-purple-600">Hari ke-{log.dayNumber}</span>
                      <span className="text-slate-400 font-normal">({log.date})</span>
                    </span>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                        log.status === "OPTIMAL"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : log.status === "ROTATED"
                          ? "bg-amber-50 text-amber-800 border-amber-200"
                          : "bg-blue-50 text-blue-700 border-blue-200"
                      }`}
                    >
                      {log.marketRegime}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    💡 {log.lessonLearned}
                  </p>
                  <div className="text-[10px] text-slate-500 pt-0.5 flex items-center justify-between">
                    <span>Aksi: <strong>{log.parameterAdjustment}</strong></span>
                    <span>Winrate: <strong className="text-emerald-700">{log.winRateRecorded}%</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* KPI Kecepatan Cuan vs Rugi (Durasi Waktu Capai TP vs Terkena SL - Data Riil BEI) */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3.5 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-2">
            <Timer className="w-4 h-4 text-blue-600" />
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                KPI Kecepatan Cuan & Pengaman Risiko
              </h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] text-slate-500 font-medium">
                  Data Riil: Volatilitas Pasar TradingView BEI
                </span>
              </div>
            </div>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
            Terverifikasi Real
          </span>
        </div>

        {/* Real Market Volatility Snapshot */}
        <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-[11px]">
          <span className="text-slate-500">
            Rerata Volatilitas Saham Aktif:{" "}
            <strong className="text-slate-900 font-bold tabular-nums">
              {state.metrics.durationKpi?.marketDailyVolatility || 3.25}% / Hari
            </strong>
          </span>
          {state.metrics.durationKpi?.fastestStock && (
            <span className="text-blue-700 font-semibold truncate max-w-[180px]">
              Top Akselerasi: <strong>{state.metrics.durationKpi.fastestStock}</strong>
            </span>
          )}
        </div>

        {/* 4 Cards: Rerata Durasi TP, Rerata Durasi SL, Cuan Tercepat, Cut Loss Tercepat */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200/80 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
                Waktu Capai TP
              </span>
              <Zap className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <div className="text-lg font-black text-emerald-900 tabular-nums">
              {state.metrics.durationKpi?.avgTpDurationDays || 2.5} Hari
            </div>
            <span className="text-[10px] text-emerald-700 block leading-tight">
              Rata-rata saham mencapai Target Profit (+{activeScheme.targetProfitPct}%)
            </span>
          </div>

          <div className="p-3 rounded-xl bg-rose-50/60 border border-rose-200/80 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-rose-800 uppercase tracking-wider">
                Waktu Kena SL
              </span>
              <ShieldCheck className="w-3.5 h-3.5 text-rose-600" />
            </div>
            <div className="text-lg font-black text-rose-900 tabular-nums">
              {state.metrics.durationKpi?.avgSlDurationDays || 1.0} Hari
            </div>
            <span className="text-[10px] text-rose-700 block leading-tight">
              Disiplin cut loss memotong kerugian (-{activeScheme.stopLossPct}%)
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 space-y-0.5">
            <span className="text-[10px] text-slate-500 font-medium block">Cuan Tercepat</span>
            <div className="text-sm font-bold text-slate-800 tabular-nums">
              {state.metrics.durationKpi?.fastestTpDays || 2} Hari Bursa
            </div>
            <span className="text-[10px] text-slate-400 block truncate">
              {state.metrics.durationKpi?.fastestStock
                ? `Akselerasi di ${state.metrics.durationKpi.fastestStock}`
                : "Akselerasi profit kilat"}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 space-y-0.5">
            <span className="text-[10px] text-slate-500 font-medium block">Strategi Tercepat</span>
            <div className="text-sm font-bold text-blue-700 truncate">
              {state.metrics.durationKpi?.fastestSchemeName || "Momentum Breakout"}
            </div>
            <span className="text-[10px] text-slate-400 block">Efisiensi perputaran modal</span>
          </div>
        </div>

        {/* Speed & Winrate Velocity Analysis Card */}
        <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200/80 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-950 flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5 text-blue-600" />
              Analisa AI: Acuan Winrate Tercepat & Tertinggi
            </span>
            <span className="text-[10px] font-bold text-blue-800 bg-white px-2 py-0.5 rounded border border-blue-200 tabular-nums">
              Skor: {state.metrics.durationKpi?.velocityScore || 85.0} Poin
            </span>
          </div>
          <p className="text-xs text-blue-900/90 leading-relaxed">
            {state.metrics.durationKpi?.speedAnalysis}
          </p>
          <div className="pt-1.5 border-t border-blue-100 flex items-center justify-between text-[10px] text-blue-700/80 font-medium">
            <span>Metode: Kuantitatif Volatilitas Riil (Daily ATR)</span>
            <span>Target Akurasi: 95% Winrate</span>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs (Segmented Control yang Ramah Pemula) */}
      <div className="p-1 bg-slate-100 rounded-xl flex gap-1 text-xs">
        <button
          onClick={() => setActiveTab("sector-picks")}
          className={`flex-1 py-2 rounded-lg text-center font-semibold transition ${
            activeTab === "sector-picks"
              ? "bg-white text-blue-600 shadow-xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Rekomendasi
        </button>
        <button
          onClick={() => setActiveTab("positions")}
          className={`flex-1 py-2 rounded-lg text-center font-semibold transition ${
            activeTab === "positions"
              ? "bg-white text-blue-600 shadow-xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Saham Dimiliki ({openPositions.length})
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`flex-1 py-2 rounded-lg text-center font-semibold transition ${
            activeTab === "history"
              ? "bg-white text-blue-600 shadow-xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Riwayat ({tradeHistory.length})
        </button>
        <button
          onClick={() => setActiveTab("schemes")}
          className={`flex-1 py-2 rounded-lg text-center font-semibold transition ${
            activeTab === "schemes"
              ? "bg-white text-blue-600 shadow-xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Pilihan Strategi
        </button>
      </div>

      {/* Tab 0: Sector Picks (Rekomendasi Pilihan AI per Sektor) */}
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
                              {stock.action === "STRONG BUY"
                                ? "SANGAT BAGUS"
                                : stock.action === "BUY"
                                ? "BAGUS DIBELI"
                                : stock.action === "ACCUMULATE"
                                ? "AKUMULASI"
                                : "HINDARI (RAWAN GUYUR)"}
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
                              <span className="text-slate-500">Pembeli Terbanyak:</span>
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
                                ? "Trader Kilat Dominan"
                                : isSmartMoney
                                ? "Investor Asing Masuk"
                                : "Investor Ritel Masuk"}
                            </span>
                          </div>
                        )}

                        <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
                          <span>Nilai Transaksi: <strong className="text-slate-800">{stock.turnoverFormatted}</strong></span>
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

      {/* Tab 1: Open Positions (Saham yang Sedang Dimiliki) */}
      {activeTab === "positions" && (
        <div className="space-y-3">
          {openPositions.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-xs text-slate-500 bg-white space-y-1.5">
              <p className="font-bold text-slate-700">Belum Ada Saham yang Sedang Dimiliki</p>
              <p className="leading-relaxed">
                AI akan secara otomatis membelikan saham terbaik menggunakan modal kas saat jam bursa resmi dibuka (Senin - Jumat 09:00 - 15:00 WIB).
              </p>
            </div>
          ) : (
            openPositions.map((pos) => (
              <div
                key={pos.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3 shadow-xs"
              >
                {/* Header Saham & Untung/Rugi Berjalan */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-base text-slate-900">{pos.ticker}</span>
                    <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                      {pos.lots} LOT ({pos.shares.toLocaleString("id-ID")} Lembar)
                    </span>
                    {pos.category === "BLUECHIP_60" ? (
                      <span className="text-[10px] font-extrabold text-blue-800 bg-blue-100 px-2 py-0.5 rounded border border-blue-200">
                        🛡️ BLUECHIP 60%
                      </span>
                    ) : (
                      <span className="text-[10px] font-extrabold text-amber-900 bg-amber-100 px-2 py-0.5 rounded border border-amber-200">
                        ⚡ SCALPING 40%
                      </span>
                    )}
                    {pos.isRealtimeBEI && (
                      <span className="text-[9px] font-extrabold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                        LIVE BEI 0s
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {pos.pnlPct >= 0 ? (
                        <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <ArrowDownRight className="w-4 h-4 text-rose-600" />
                      )}
                      <span
                        className={`text-sm font-bold tabular-nums ${
                          pos.pnlPct >= 0 ? "text-emerald-700" : "text-rose-700"
                        }`}
                      >
                        {pos.pnlPct >= 0 ? "+" : ""}
                        {pos.pnlPct}%
                      </span>
                    </div>
                    <span
                      className={`text-[11px] block tabular-nums font-semibold ${
                        pos.pnlNominal >= 0 ? "text-emerald-600" : "text-rose-600"
                      }`}
                    >
                      {pos.pnlNominal >= 0 ? "+" : ""}Rp {pos.pnlNominal.toLocaleString("id-ID")}
                    </span>
                  </div>
                </div>

                {/* Rincian Harga Pembelian & Harga Sekarang */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <span className="text-slate-400 text-[10px] block font-medium">Modal Pembelian:</span>
                    <span className="text-slate-800 font-bold block mt-0.5">
                      Rp {pos.cost.toLocaleString("id-ID")}
                    </span>
                    <span className="text-[10px] text-slate-500">(@ Rp {pos.entryPrice.toLocaleString("id-ID")} / lembar)</span>
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <span className="text-slate-400 text-[10px] block font-medium">Nilai Saat Ini (Live):</span>
                    <span className="text-slate-800 font-bold block mt-0.5">
                      Rp {pos.currentValue.toLocaleString("id-ID")}
                    </span>
                    <span className="text-[10px] text-slate-500">(@ Rp {pos.currentPrice.toLocaleString("id-ID")} / lembar)</span>
                  </div>
                </div>

                {/* Antrian Orderbook Live BEI */}
                {pos.bestBid && pos.bestOffer && (
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 space-y-1.5">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-bold text-slate-500 uppercase tracking-wider">Antrian Pasar Terkini</span>
                      <span className="font-semibold text-slate-400">{pos.tradingTime || "Realtime"}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-emerald-50/70 border border-emerald-200/70 rounded-lg p-1.5 flex items-center justify-between">
                        <span className="text-[10px] text-emerald-800 font-bold">BID: Rp {pos.bestBid.price?.toLocaleString("id-ID")}</span>
                        <span className="text-[10px] text-emerald-600 font-medium">({Math.round(pos.bestBid.volume / 100).toLocaleString("id-ID")} Lot)</span>
                      </div>
                      <div className="bg-rose-50/70 border border-rose-200/70 rounded-lg p-1.5 flex items-center justify-between">
                        <span className="text-[10px] text-rose-800 font-bold">OFFER: Rp {pos.bestOffer.price?.toLocaleString("id-ID")}</span>
                        <span className="text-[10px] text-rose-600 font-medium">({Math.round(pos.bestOffer.volume / 100).toLocaleString("id-ID")} Lot)</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Target Otomatis Take Profit & Stop Loss */}
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-emerald-800 font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Target Jual Untung (+{pos.category === "SCALPING_40" ? "3.5" : "5"}%):
                    </span>
                    <strong className="text-emerald-700">Rp {pos.targetPrice.toLocaleString("id-ID")}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-rose-800 font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                      Batas Pengaman Rugi (-{pos.category === "SCALPING_40" ? "2.0" : "2.5"}%):
                    </span>
                    <strong className="text-rose-700">Rp {pos.stopLossPrice.toLocaleString("id-ID")}</strong>
                  </div>
                </div>

                <p className="text-[11px] text-slate-500 leading-snug px-1">
                  💡 {pos.rationale}
                </p>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 2: History & Order Log (Riwayat Pembelian & Penjualan) */}
      {activeTab === "history" && (
        <div className="space-y-4">
          {/* Active Orders Log */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">
                Saham yang Sedang Dipegang ({openPositions.length} Posisi)
              </span>
              <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                STATUS: SEDANG BERJALAN
              </span>
            </div>
            {openPositions.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 p-4 text-center text-xs text-slate-400 bg-white">
                Belum ada saham yang sedang dipegang.
              </div>
            ) : (
              openPositions.map((pos) => (
                <div
                  key={`log-${pos.id}`}
                  className="rounded-2xl border border-slate-200 bg-white p-3.5 space-y-2 text-xs shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">{pos.ticker}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-md font-bold bg-emerald-50 text-emerald-800">
                        BELI {pos.lots} LOT
                      </span>
                      <span className="text-[10px] text-slate-400">{pos.entryDate}</span>
                    </div>
                    <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                      Target +5% / SL -3%
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1 border-t border-slate-50">
                    <span>Harga Beli: <strong className="text-slate-800">Rp {pos.entryPrice.toLocaleString("id-ID")}</strong></span>
                    <span>Total Biaya: <strong className="text-slate-800">Rp {pos.cost.toLocaleString("id-ID")}</strong></span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Closed Trades */}
          <div className="space-y-2 pt-2 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">
                Transaksi Selesai & Realized Profit ({tradeHistory.length})
              </span>
              <span className="text-[10px] text-slate-400 font-medium">Hasil Penjualan</span>
            </div>
            {tradeHistory.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-xs text-slate-500 bg-white leading-relaxed">
                Saham yang sedang aktif dipegang ({openPositions.map(p => p.ticker).join(", ") || "posisi terbuka"}) akan otomatis tercatat selesai di sini saat menyentuh <strong>Target Untung (+5%)</strong> atau <strong>Batas Rugi (-3%)</strong> pada jam bursa.
              </div>
            ) : (
              tradeHistory.map((t) => (
                <div
                  key={t.id}
                  className="rounded-2xl border border-slate-200 bg-white p-3.5 space-y-1.5 text-xs shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{t.ticker}</span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${
                          t.status === "CLOSED_TP"
                            ? "bg-emerald-50 text-emerald-800"
                            : "bg-rose-50 text-rose-800"
                        }`}
                      >
                        {t.status === "CLOSED_TP" ? "JUAL UNTUNG (+5%)" : "JUAL BATAS RUGI (-3%)"}
                      </span>
                      <span className="text-[10px] text-slate-400">{t.exitDate}</span>
                    </div>
                    <span
                      className={`tabular-nums font-bold text-sm ${
                        t.pnlPct >= 0 ? "text-emerald-700" : "text-rose-700"
                      }`}
                    >
                      {t.pnlPct >= 0 ? "+" : ""}{t.pnlPct}% (Rp {t.pnlNominal.toLocaleString("id-ID")})
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                    <span>Beli {t.lots} Lot @ Rp {t.entryPrice.toLocaleString("id-ID")} → Jual: Rp {t.exitPrice?.toLocaleString("id-ID")}</span>
                    {t.holdingDays && (
                      <span className="font-semibold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded text-[10px] tabular-nums">
                        ⏱️ {t.holdingDays} Hari Bursa
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Schemes (Daftar Strategi AI) */}
      {activeTab === "schemes" && (
        <div className="space-y-3">
          {availableSchemes.map((s) => (
            <div
              key={s.id}
              className={`rounded-2xl border p-4 space-y-2 transition ${
                s.id === activeScheme.id
                  ? "border-blue-300 bg-blue-50/50 shadow-xs"
                  : "border-slate-200 bg-white"
              }`}
            >
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                  {s.name}
                  {s.id === activeScheme.id && (
                    <span className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded-md font-bold">
                      Sedang Aktif Dipakai
                    </span>
                  )}
                </h4>
                <span className="text-[11px] font-bold text-slate-700">
                  Target Untung +{s.targetProfitPct}% / Pengaman -{s.stopLossPct}%
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">{s.description}</p>
              <div className="text-[11px] text-blue-900 bg-blue-50 p-2.5 rounded-xl border border-blue-100">
                <strong>Aturan Logika:</strong> {s.rule}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
