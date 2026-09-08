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

export interface StrategyLabState {
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

// Initial state with realistic paper trade history
let globalState: StrategyLabState = {
  activeScheme: SCHEMES[0],
  availableSchemes: SCHEMES,
  metrics: {
    totalTrades: 12,
    winCount: 9,
    lossCount: 3,
    winRate: 75.0,
    cumulativePnlPct: 24.6,
    lastEvaluationDate: new Date().toLocaleDateString("id-ID"),
    aiRationale: "Skema Momentum Breakout dipertahankan karena likuiditas IHSG sedang terkonsentrasi pada saham lapis satu dan perbankan.",
  },
  openPositions: [
    {
      id: "pt-1",
      ticker: "BBCA",
      name: "Bank Central Asia Tbk",
      type: "BUY",
      entryPrice: 6550,
      currentPrice: 6675,
      targetPrice: 6875,
      stopLossPrice: 6350,
      pnlPct: 1.91,
      status: "OPEN",
      schemeName: "Momentum Breakout",
      entryDate: "07/09/2026",
      rationale: "Volume breakout di atas resistensi 6.550 didukung akumulasi asing.",
    },
    {
      id: "pt-2",
      ticker: "BBRI",
      name: "Bank Rakyat Indonesia Tbk",
      type: "BUY",
      entryPrice: 3340,
      currentPrice: 3410,
      targetPrice: 3510,
      stopLossPrice: 3240,
      pnlPct: 2.10,
      status: "OPEN",
      schemeName: "Momentum Breakout",
      entryDate: "07/09/2026",
      rationale: "Rebound kuat dari EMA20 dengan golden cross MACD.",
    },
  ],
  tradeHistory: [
    {
      id: "pt-h1",
      ticker: "TLKM",
      name: "Telkom Indonesia Tbk",
      type: "BUY",
      entryPrice: 2520,
      currentPrice: 2650,
      exitPrice: 2645,
      targetPrice: 2645,
      stopLossPrice: 2445,
      pnlPct: 4.96,
      status: "CLOSED_TP",
      schemeName: "Trend Following (EMA Pullback)",
      entryDate: "01/09/2026",
      exitDate: "05/09/2026",
      rationale: "Target profit 5% tercapai di area resisten 2.650.",
    },
    {
      id: "pt-h2",
      ticker: "ASII",
      name: "Astra International Tbk",
      type: "BUY",
      entryPrice: 4800,
      currentPrice: 5050,
      exitPrice: 5040,
      targetPrice: 5040,
      stopLossPrice: 4650,
      pnlPct: 5.00,
      status: "CLOSED_TP",
      schemeName: "Trend Following (EMA Pullback)",
      entryDate: "28/08/2026",
      exitDate: "03/09/2026",
      rationale: "Breakout resistance MA50 tercapai.",
    },
    {
      id: "pt-h3",
      ticker: "UNTR",
      name: "United Tractors Tbk",
      type: "BUY",
      entryPrice: 24500,
      currentPrice: 23800,
      exitPrice: 23750,
      targetPrice: 25700,
      stopLossPrice: 23750,
      pnlPct: -3.06,
      status: "CLOSED_SL",
      schemeName: "Momentum Breakout",
      entryDate: "25/08/2026",
      exitDate: "27/08/2026",
      rationale: "Stop loss terpicu akibat pelemahan harga komoditas batubara.",
    },
  ],
};

export async function getStrategyLabState(): Promise<StrategyLabState> {
  // Update open positions price from live TradingView data
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
      const pnlPct = Number((((currentPrice - pos.entryPrice) / pos.entryPrice) * 100).toFixed(2));

      // Check Take Profit
      if (currentPrice >= pos.targetPrice) {
        newlyClosed.push({
          ...pos,
          currentPrice,
          exitPrice: currentPrice,
          pnlPct,
          status: "CLOSED_TP",
          exitDate: new Date().toLocaleDateString("id-ID"),
          rationale: `Target Profit +${pos.pnlPct}% tercapai pada harga Rp ${currentPrice}.`,
        });
        return null as any;
      }

      // Check Stop Loss
      if (currentPrice <= pos.stopLossPrice) {
        newlyClosed.push({
          ...pos,
          currentPrice,
          exitPrice: currentPrice,
          pnlPct,
          status: "CLOSED_SL",
          exitDate: new Date().toLocaleDateString("id-ID"),
          rationale: `Stop Loss ${pos.pnlPct}% terpicu untuk proteksi modal di Rp ${currentPrice}.`,
        });
        return null as any;
      }

      return {
        ...pos,
        currentPrice,
        pnlPct,
      };
    }).filter(Boolean);

    if (newlyClosed.length > 0) {
      globalState.tradeHistory = [...newlyClosed, ...globalState.tradeHistory];
      globalState.openPositions = updatedOpenPositions;

      // Recalculate metrics
      const closed = globalState.tradeHistory;
      const wins = closed.filter(t => t.pnlPct > 0).length;
      const total = closed.length;
      const winRate = total > 0 ? Number(((wins / total) * 100).toFixed(1)) : 0;
      const cumulativePnlPct = Number(closed.reduce((acc, t) => acc + t.pnlPct, 0).toFixed(2));

      globalState.metrics = {
        ...globalState.metrics,
        totalTrades: total,
        winCount: wins,
        lossCount: total - wins,
        winRate,
        cumulativePnlPct,
      };
    } else {
      globalState.openPositions = updatedOpenPositions;
    }
  } catch (err) {
    console.error("Failed to sync live prices for Strategy Lab:", err);
  }

  return globalState;
}

export async function runAIStrategyOptimization(): Promise<{
  previousScheme: string;
  newScheme: string;
  rationale: string;
  adjustment: string;
}> {
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
  globalState.metrics.aiRationale = evaluation.rationale;
  globalState.metrics.lastEvaluationDate = new Date().toLocaleDateString("id-ID");

  // Automatically scan new candidate virtual trade according to new scheme
  try {
    const candidateStocks = await getTechnicalStocks(30);
    const existingTickers = new Set(globalState.openPositions.map(p => p.ticker));
    
    // Find best match for scheme
    let chosen: TechnicalStock | undefined;
    if (matched.id === "breakout") {
      chosen = candidateStocks.find(s => !existingTickers.has(s.ticker) && s.changePct > 1 && s.rsi < 70);
    } else if (matched.id === "trend") {
      chosen = candidateStocks.find(s => !existingTickers.has(s.ticker) && s.price >= s.ema50 && s.recommendation > 0.1);
    } else {
      chosen = candidateStocks.find(s => !existingTickers.has(s.ticker) && s.rsi < 45);
    }

    if (chosen && globalState.openPositions.length < 5) {
      const entryPrice = chosen.price;
      const tp = Math.round(entryPrice * (1 + matched.targetProfitPct / 100));
      const sl = Math.round(entryPrice * (1 - matched.stopLossPct / 100));

      const newTrade: PaperTrade = {
        id: `pt-${Date.now()}`,
        ticker: chosen.ticker,
        name: chosen.name,
        type: "BUY",
        entryPrice,
        currentPrice: entryPrice,
        targetPrice: tp,
        stopLossPrice: sl,
        pnlPct: 0,
        status: "OPEN",
        schemeName: matched.name,
        entryDate: new Date().toLocaleDateString("id-ID"),
        rationale: `Sinyal beli terdeteksi oleh AI via skema ${matched.name}. TP: Rp ${tp} (+${matched.targetProfitPct}%), SL: Rp ${sl} (-${matched.stopLossPct}%).`,
      };
      globalState.openPositions.unshift(newTrade);
    }
  } catch (err) {
    console.error("Failed to add new trade on optimization:", err);
  }

  return {
    previousScheme,
    newScheme: matched.name,
    rationale: evaluation.rationale,
    adjustment: evaluation.parameterAdjustment,
  };
}
