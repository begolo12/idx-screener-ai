import { getTechnicalStocks, TechnicalStock } from "./technical-analysis";
import { evaluateTradingSchemeWithAI } from "./deepseek-service";

export interface TradingScheme {
  id: string;
  name: string;
  description: string;
  rule: string;
  targetProfitPct: number;
  stopLossPct: number;
}

export interface PaperTrade {
  id: string;
  ticker: string;
  name: string;
  type: "BUY";
  lots: number;
  shares: number; // lots * 100 (standar BEI / IDX)
  entryPrice: number;
  currentPrice: number;
  exitPrice?: number;
  cost: number; // shares * entryPrice
  currentValue: number; // shares * currentPrice
  pnlNominal: number; // currentValue - cost
  pnlPct: number;
  targetPrice: number;
  stopLossPrice: number;
  status: "OPEN" | "CLOSED_TP" | "CLOSED_SL";
  schemeName: string;
  entryDate: string;
  exitDate?: string;
  rationale: string;
}

export interface MarketScheduleStatus {
  isOpen: boolean;
  isWeekend: boolean;
  statusText: string;
  sessionText: string;
  nextOpenText: string;
  currentWIBTime: string;
}

export interface PortfolioBalance {
  initialCapital: number; // Rp 5.000.000
  cash: number;
  invested: number;
  totalEquity: number;
  totalProfitNominal: number;
  totalProfitPct: number;
}

export interface StrategyLabState {
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

export const SCHEMES: TradingScheme[] = [
  {
    id: "breakout",
    name: "Momentum Breakout",
    description: "Mendeteksi lonjakan volume tinggi dan penembusan resistance teknikal.",
    rule: "Volume > 2x rata-rata, RSI 55-72, Harga > EMA20, Rekomendasi TV > 0.2",
    targetProfitPct: 5.0,
    stopLossPct: 3.0,
  },
  {
    id: "trend",
    name: "Trend Following (EMA Pullback)",
    description: "Mengikuti tren kenaikan saham blue chip dengan entri di area support dinamis EMA20.",
    rule: "Harga di atas EMA50, MACD > Signal, RSI 45-60, Nilai Transaksi > Rp 10 Miliar",
    targetProfitPct: 6.0,
    stopLossPct: 2.5,
  },
  {
    id: "mean_reversion",
    name: "Mean Reversion (Oversold Bounce)",
    description: "Membeli saham berkualitas yang mengalami diskon berlebihan di area jenuh jual.",
    rule: "RSI < 38, Candle Rebound, Rekomendasi TV membaik, Harga > Rp 100",
    targetProfitPct: 4.0,
    stopLossPct: 2.5,
  },
];

export function checkIDXMarketStatus(): MarketScheduleStatus {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const wib = new Date(utc + 7 * 3600000);

  const day = wib.getDay(); // 0: Minggu, 6: Sabtu
  const hour = wib.getHours();
  const minute = wib.getMinutes();
  const time = hour * 100 + minute;

  const currentWIBTime = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")} WIB`;
  const isWeekend = day === 0 || day === 6;

  if (isWeekend) {
    return {
      isOpen: false,
      isWeekend: true,
      statusText: "LIBUR AKHIR PEKAN",
      sessionText: "Bursa IDX Tutup",
      nextOpenText: "Buka kembali hari Senin pukul 09:00 WIB",
      currentWIBTime,
    };
  }

  const isFriday = day === 5;
  const session1End = isFriday ? 1130 : 1200;
  const session2Start = isFriday ? 1400 : 1330;
  const session2End = 1500; // Batas jam buka bursa 15:00 WIB sesuai instruksi

  if (time < 900) {
    return {
      isOpen: false,
      isWeekend: false,
      statusText: "PRE-OPENING",
      sessionText: "Pasar Belum Dibuka",
      nextOpenText: "Buka pukul 09:00 WIB",
      currentWIBTime,
    };
  } else if (time >= 900 && time <= session1End) {
    return {
      isOpen: true,
      isWeekend: false,
      statusText: "PASAR BUKA (SESI 1)",
      sessionText: "Jam Perdagangan Buka",
      nextOpenText: `Istirahat sesi 1 pukul ${isFriday ? "11:30" : "12:00"} WIB`,
      currentWIBTime,
    };
  } else if (time > session1End && time < session2Start) {
    return {
      isOpen: false,
      isWeekend: false,
      statusText: "ISTIRAHAT BURSA",
      sessionText: "Jeda Sesi Perdagangan",
      nextOpenText: `Sesi 2 buka pukul ${isFriday ? "14:00" : "13:30"} WIB`,
      currentWIBTime,
    };
  } else if (time >= session2Start && time <= session2End) {
    return {
      isOpen: true,
      isWeekend: false,
      statusText: "PASAR BUKA (SESI 2)",
      sessionText: "Jam Perdagangan Buka",
      nextOpenText: "Tutup pasar pukul 15:00 WIB",
      currentWIBTime,
    };
  } else {
    return {
      isOpen: false,
      isWeekend: false,
      statusText: "PASAR TUTUP",
      sessionText: "Di Luar Jam Bursa",
      nextOpenText: "Buka esok hari pukul 09:00 WIB",
      currentWIBTime,
    };
  }
}

const INITIAL_CAPITAL = 5_000_000; // Modal virtual Rp 5.000.000

let globalState: {
  cash: number;
  activeScheme: TradingScheme;
  openPositions: PaperTrade[];
  tradeHistory: PaperTrade[];
  lastEvaluationDate: string;
  aiRationale: string;
} = {
  cash: INITIAL_CAPITAL,
  activeScheme: SCHEMES[0],
  openPositions: [],
  tradeHistory: [],
  lastEvaluationDate: new Date().toLocaleDateString("id-ID"),
  aiRationale: "Modal virtual Rp 5.000.000 siap dialokasikan ke sinyal live TradingView Scanner pada jam buka bursa (09:00 - 15:00 WIB).",
};

let isInitialized = false;

// Initialize positions with real TradingView data fitting Rp 5.000.000 budget
async function initRealPositionsIfEmpty() {
  if (isInitialized && globalState.openPositions.length > 0) return;
  try {
    const liveStocks = await getTechnicalStocks(25);
    // Find top 2 real stocks from TradingView
    const candidates = liveStocks
      .filter(s => s.price >= 100 && s.price <= 10000 && s.volume > 500000)
      .slice(0, 2);

    if (candidates.length > 0) {
      // Allocate ~Rp 1.500.000 - Rp 2.000.000 per position (lot sizing: 1 lot = 100 shares)
      const targetAllocation = 2_000_000;
      let availableCash = INITIAL_CAPITAL;
      const initialPositions: PaperTrade[] = [];

      for (let i = 0; i < candidates.length; i++) {
        const s = candidates[i];
        const pricePerLot = s.price * 100;
        const lots = Math.max(1, Math.floor(targetAllocation / pricePerLot));
        const cost = lots * pricePerLot;

        if (availableCash >= cost) {
          availableCash -= cost;
          const tp = Math.round(s.price * 1.05);
          const sl = Math.round(s.price * 0.97);

          initialPositions.push({
            id: `live-pos-${s.ticker}-${i}`,
            ticker: s.ticker,
            name: s.name,
            type: "BUY",
            lots,
            shares: lots * 100,
            entryPrice: s.price,
            currentPrice: s.price,
            cost,
            currentValue: cost,
            pnlNominal: 0,
            pnlPct: 0.0,
            targetPrice: tp,
            stopLossPrice: sl,
            status: "OPEN",
            schemeName: globalState.activeScheme.name,
            entryDate: new Date().toLocaleDateString("id-ID"),
            rationale: `Beli real TradingView: ${lots} Lot (${lots * 100} lembar) @ Rp ${s.price.toLocaleString("id-ID")}. RSI ${s.rsi}.`,
          });
        }
      }

      globalState.openPositions = initialPositions;
      globalState.cash = availableCash;
      globalState.aiRationale = `Alokasi modal Rp 5.000.000: ${initialPositions.map(p => `${p.ticker} (${p.lots} Lot)`).join(", ")}. Sisa kas Rp ${availableCash.toLocaleString("id-ID")}.`;
    }
    isInitialized = true;
  } catch (err) {
    console.error("Failed to init real positions:", err);
  }
}

export async function getStrategyLabState(): Promise<StrategyLabState> {
  const marketStatus = checkIDXMarketStatus();
  await initRealPositionsIfEmpty();

  // Sync live prices from TradingView Scanner
  try {
    const liveStocks = await getTechnicalStocks(40);
    const stockMap = new Map<string, TechnicalStock>();
    for (const s of liveStocks) stockMap.set(s.ticker, s);

    let updatedOpenPositions = [...globalState.openPositions];
    let newlyClosed: PaperTrade[] = [];

    updatedOpenPositions = updatedOpenPositions.map(pos => {
      const live = stockMap.get(pos.ticker);
      if (!live) return pos;

      const currentPrice = live.price;
      const currentValue = pos.shares * currentPrice;
      const pnlNominal = currentValue - pos.cost;
      const pnlPct = Number((((currentPrice - pos.entryPrice) / pos.entryPrice) * 100).toFixed(2));

      // Check Take Profit or Stop Loss only when market was open
      if (marketStatus.isOpen) {
        if (currentPrice >= pos.targetPrice) {
          globalState.cash += currentValue;
          newlyClosed.push({
            ...pos,
            currentPrice,
            exitPrice: currentPrice,
            currentValue,
            pnlNominal,
            pnlPct,
            status: "CLOSED_TP",
            exitDate: new Date().toLocaleDateString("id-ID"),
            rationale: `Target Profit +${pnlPct}% (Rp +${pnlNominal.toLocaleString("id-ID")}) tercapai di harga Rp ${currentPrice}.`,
          });
          return null as any;
        }

        if (currentPrice <= pos.stopLossPrice) {
          globalState.cash += currentValue;
          newlyClosed.push({
            ...pos,
            currentPrice,
            exitPrice: currentPrice,
            currentValue,
            pnlNominal,
            pnlPct,
            status: "CLOSED_SL",
            exitDate: new Date().toLocaleDateString("id-ID"),
            rationale: `Stop Loss ${pnlPct}% (Rp ${pnlNominal.toLocaleString("id-ID")}) terpicu di Rp ${currentPrice}.`,
          });
          return null as any;
        }
      }

      return {
        ...pos,
        currentPrice,
        currentValue,
        pnlNominal,
        pnlPct,
      };
    }).filter(Boolean);

    if (newlyClosed.length > 0) {
      globalState.tradeHistory = [...newlyClosed, ...globalState.tradeHistory];
    }
    globalState.openPositions = updatedOpenPositions;
  } catch (err) {
    console.error("Failed to sync live prices for Strategy Lab:", err);
  }

  // Calculate portfolio balance
  const invested = globalState.openPositions.reduce((acc, p) => acc + p.currentValue, 0);
  const totalEquity = globalState.cash + invested;
  const totalProfitNominal = totalEquity - INITIAL_CAPITAL;
  const totalProfitPct = Number((((totalEquity - INITIAL_CAPITAL) / INITIAL_CAPITAL) * 100).toFixed(2));

  // Metrics from closed trades (strictly based on real closed trades)
  const closed = globalState.tradeHistory;
  const wins = closed.filter(t => t.pnlPct > 0).length;
  const total = closed.length;
  const winRate = total > 0 ? Number(((wins / total) * 100).toFixed(1)) : 0;
  const cumulativePnlPct = Number(closed.reduce((acc, t) => acc + t.pnlPct, 0).toFixed(2));

  return {
    marketStatus,
    portfolio: {
      initialCapital: INITIAL_CAPITAL,
      cash: globalState.cash,
      invested,
      totalEquity,
      totalProfitNominal,
      totalProfitPct,
    },
    activeScheme: globalState.activeScheme,
    availableSchemes: SCHEMES,
    metrics: {
      totalTrades: total,
      winCount: wins,
      lossCount: total - wins,
      winRate,
      cumulativePnlPct,
      lastEvaluationDate: globalState.lastEvaluationDate,
      aiRationale: globalState.aiRationale,
    },
    openPositions: globalState.openPositions,
    tradeHistory: globalState.tradeHistory,
  };
}

export async function runAIStrategyOptimization(): Promise<{
  marketIsOpen: boolean;
  marketMessage: string;
  previousScheme: string;
  newScheme: string;
  rationale: string;
  adjustment: string;
}> {
  const marketStatus = checkIDXMarketStatus();
  const currentState = await getStrategyLabState();

  const evaluation = await evaluateTradingSchemeWithAI({
    currentScheme: currentState.activeScheme.name,
    winrate: currentState.metrics.winRate,
    totalTrades: currentState.metrics.totalTrades,
    recentTrades: currentState.tradeHistory.slice(0, 5).map(t => ({
      ticker: t.ticker,
      type: t.type,
      pnlPct: t.pnlPct,
      exitReason: t.rationale,
    })),
    candidateSchemes: SCHEMES.map(s => ({
      name: s.name,
      description: s.description,
      rule: s.rule,
    })),
  });

  const matched = SCHEMES.find(
    s => s.name.toLowerCase().includes(evaluation.recommendedScheme.toLowerCase()) ||
         evaluation.recommendedScheme.toLowerCase().includes(s.name.toLowerCase())
  ) || SCHEMES[0];

  const previousScheme = globalState.activeScheme.name;
  globalState.activeScheme = matched;
  globalState.aiRationale = evaluation.rationale;
  globalState.lastEvaluationDate = new Date().toLocaleDateString("id-ID");

  let marketMessage = "Skema berhasil dievaluasi.";

  // Strictly enforce market open hours (09:00 - 15:00 WIB, Monday-Friday)
  if (!marketStatus.isOpen) {
    marketMessage = `Skema disesuaikan ke ${matched.name}. Transaksi baru DITAHAN karena ${marketStatus.statusText} (${marketStatus.currentWIBTime}). Perdagangan aktif Senin-Jumat pukul 09:00 - 15:00 WIB.`;
    return {
      marketIsOpen: false,
      marketMessage,
      previousScheme,
      newScheme: matched.name,
      rationale: evaluation.rationale,
      adjustment: evaluation.parameterAdjustment,
    };
  }

  // If market is open and cash is available, execute 1 buy order according to scheme
  if (globalState.cash >= 500_000 && globalState.openPositions.length < 4) {
    try {
      const candidateStocks = await getTechnicalStocks(30);
      const existingTickers = new Set(globalState.openPositions.map(p => p.ticker));

      let chosen: TechnicalStock | undefined;
      if (matched.id === "breakout") {
        chosen = candidateStocks.find(s => !existingTickers.has(s.ticker) && s.changePct > 1 && s.rsi < 70);
      } else if (matched.id === "trend") {
        chosen = candidateStocks.find(s => !existingTickers.has(s.ticker) && s.price >= s.ema50 && s.recommendation > 0.1);
      } else {
        chosen = candidateStocks.find(s => !existingTickers.has(s.ticker) && s.rsi < 45);
      }

      if (chosen) {
        const pricePerLot = chosen.price * 100;
        const maxSpend = Math.min(globalState.cash, 1_500_000);
        const lots = Math.floor(maxSpend / pricePerLot);

        if (lots >= 1) {
          const cost = lots * pricePerLot;
          globalState.cash -= cost;

          const tp = Math.round(chosen.price * (1 + matched.targetProfitPct / 100));
          const sl = Math.round(chosen.price * (1 - matched.stopLossPct / 100));

          const newTrade: PaperTrade = {
            id: `pt-${Date.now()}`,
            ticker: chosen.ticker,
            name: chosen.name,
            type: "BUY",
            lots,
            shares: lots * 100,
            entryPrice: chosen.price,
            currentPrice: chosen.price,
            cost,
            currentValue: cost,
            pnlNominal: 0,
            pnlPct: 0,
            targetPrice: tp,
            stopLossPrice: sl,
            status: "OPEN",
            schemeName: matched.name,
            entryDate: new Date().toLocaleDateString("id-ID"),
            rationale: `Beli saat bursa buka (${marketStatus.currentWIBTime}): ${lots} Lot (${lots * 100} lembar) @ Rp ${chosen.price.toLocaleString("id-ID")}.`,
          };
          globalState.openPositions.unshift(newTrade);
          marketMessage = `Skema diperbarui ke ${matched.name}. Berhasil beli virtual ${chosen.ticker} sebanyak ${lots} Lot (Rp ${cost.toLocaleString("id-ID")}). Sisa kas: Rp ${globalState.cash.toLocaleString("id-ID")}.`;
        }
      }
    } catch (err) {
      console.error("Failed to execute buy during market hours:", err);
    }
  }

  return {
    marketIsOpen: true,
    marketMessage,
    previousScheme,
    newScheme: matched.name,
    rationale: evaluation.rationale,
    adjustment: evaluation.parameterAdjustment,
  };
}
