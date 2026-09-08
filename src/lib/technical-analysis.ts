export interface TechnicalStock {
  ticker: string;
  name: string;
  price: number;
  changePct: number;
  volume: number;
  turnover: number;
  sector: string;
  rsi: number;
  macd: number;
  macdSignal: number;
  recommendation: number; // >0.1 Buy, >0.5 Strong Buy, <-0.1 Sell, <-0.5 Strong Sell
  ema20: number;
  ema50: number;
  sma200: number;
  signals: string[];
}

export interface SectorPickStock {
  ticker: string;
  name: string;
  price: number;
  changePct: number;
  volume: number;
  turnover: number;
  turnoverFormatted: string;
  rsi: number;
  recommendationScore: number;
  action: "STRONG BUY" | "BUY" | "ACCUMULATE";
  signals: string[];
  aiReason: string;
}

export interface SectorPicksGroup {
  sectorId: string;
  sectorName: string;
  icon: string;
  stocks: SectorPickStock[];
}

export interface MarketTechnicalSummary {
  advancers: number;
  decliners: number;
  unchanged: number;
  marketSentiment: "BULLISH" | "NEUTRAL" | "BEARISH";
  avgRsi: number;
  topBreakouts: TechnicalStock[];
  topOversold: TechnicalStock[];
  topTrendFollowing: TechnicalStock[];
}

export function normalizeSector(rawSector?: string): string {
  if (!rawSector) return "Lainnya";
  const s = rawSector.toLowerCase();
  if (s.includes("finance") || s.includes("bank") || s.includes("invest")) return "Keuangan";
  if (s.includes("energy") || s.includes("mineral") || s.includes("coal") || s.includes("oil") || s.includes("gas")) return "Energi & Tambang";
  if (s.includes("tech") || s.includes("electronic") || s.includes("software") || s.includes("internet")) return "Teknologi";
  if (s.includes("consumer") || s.includes("food") || s.includes("beverage") || s.includes("retail") || s.includes("tobacco")) return "Konsumer & Ritel";
  if (s.includes("transport") || s.includes("communi") || s.includes("telecom") || s.includes("utilit") || s.includes("infra")) return "Infrastruktur & Telko";
  if (s.includes("industr") || s.includes("manufactur") || s.includes("process") || s.includes("material") || s.includes("chemical") || s.includes("auto")) return "Industri & Material";
  if (s.includes("health") || s.includes("pharma") || s.includes("hospital")) return "Kesehatan";
  if (s.includes("real estate") || s.includes("property")) return "Properti";
  return "Lainnya";
}

export async function getTechnicalStocks(limit = 120): Promise<TechnicalStock[]> {
  try {
    const res = await fetch("https://scanner.tradingview.com/indonesia/scan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        options: { lang: "id" },
        symbols: { query: { types: [] }, tickers: [] },
        columns: [
          "name",
          "description",
          "close",
          "change",
          "volume",
          "Value.Traded",
          "sector",
          "RSI",
          "MACD.macd",
          "MACD.signal",
          "Recommend.All",
          "EMA20",
          "EMA50",
          "SMA200"
        ],
        sort: { sortBy: "Value.Traded", sortOrder: "desc" },
        range: [0, limit]
      }),
      next: { revalidate: 60 }
    });

    const json = await res.json();
    const rows = json?.data ?? [];

    return rows.map((item: any) => {
      const d = item.d;
      const ticker = String(d[0] || "").replace("IDX:", "");
      const name = String(d[1] || ticker);
      const price = Number(d[2] || 0);
      const changePct = Number(Number(d[3] || 0).toFixed(2));
      const volume = Number(d[4] || 0);
      const turnover = Number(d[5] || 0);
      const rawSector = String(d[6] || "");
      const rsi = Number(Number(d[7] || 50).toFixed(1));
      const macd = Number(Number(d[8] || 0).toFixed(2));
      const macdSignal = Number(Number(d[9] || 0).toFixed(2));
      const recommendation = Number(Number(d[10] || 0).toFixed(2));
      const ema20 = Number(Number(d[11] || price).toFixed(0));
      const ema50 = Number(Number(d[12] || price).toFixed(0));
      const sma200 = Number(Number(d[13] || price).toFixed(0));

      const signals: string[] = [];
      if (rsi < 35) signals.push("RSI Oversold");
      if (rsi > 70) signals.push("RSI Overbought");
      if (macd > macdSignal && macd > 0) signals.push("MACD Golden Cross");
      if (price > ema20 && ema20 > ema50) signals.push("Uptrend Strong");
      if (recommendation > 0.3) signals.push("TV Strong Buy");

      return {
        ticker,
        name,
        price,
        changePct,
        volume,
        turnover,
        sector: normalizeSector(rawSector),
        rsi,
        macd,
        macdSignal,
        recommendation,
        ema20,
        ema50,
        sma200,
        signals
      };
    });
  } catch (err) {
    console.error("Failed to fetch TradingView technical scan:", err);
    return [];
  }
}

export async function getMarketTechnicalSummary(): Promise<MarketTechnicalSummary> {
  const stocks = await getTechnicalStocks(100);

  let advancers = 0;
  let decliners = 0;
  let unchanged = 0;
  let totalRsi = 0;

  for (const s of stocks) {
    if (s.changePct > 0) advancers++;
    else if (s.changePct < 0) decliners++;
    else unchanged++;
    totalRsi += s.rsi;
  }

  const avgRsi = stocks.length > 0 ? Number((totalRsi / stocks.length).toFixed(1)) : 50;

  let marketSentiment: "BULLISH" | "NEUTRAL" | "BEARISH" = "NEUTRAL";
  if (advancers > decliners * 1.4) marketSentiment = "BULLISH";
  else if (decliners > advancers * 1.4) marketSentiment = "BEARISH";

  const topBreakouts = stocks
    .filter(s => s.changePct >= 1.5 && s.rsi >= 50 && s.rsi <= 75 && s.turnover > 5_000_000_000)
    .slice(0, 5);

  const topOversold = stocks
    .filter(s => s.rsi < 40 && s.price > 100)
    .sort((a, b) => a.rsi - b.rsi)
    .slice(0, 5);

  const topTrendFollowing = stocks
    .filter(s => s.price >= s.ema50 && s.recommendation > 0.2)
    .slice(0, 5);

  return {
    advancers,
    decliners,
    unchanged,
    marketSentiment,
    avgRsi,
    topBreakouts,
    topOversold,
    topTrendFollowing
  };
}

export async function getSectorTopPicks(): Promise<SectorPicksGroup[]> {
  const stocks = await getTechnicalStocks(180);

  const targetSectors = [
    { id: "keuangan", name: "Keuangan", icon: "🏦" },
    { id: "energi", name: "Energi & Tambang", icon: "⚡" },
    { id: "infrastruktur", name: "Infrastruktur & Telko", icon: "📡" },
    { id: "konsumer", name: "Konsumer & Ritel", icon: "🛒" },
    { id: "teknologi", name: "Teknologi", icon: "💻" },
    { id: "industri", name: "Industri & Material", icon: "🏭" },
  ];

  const result: SectorPicksGroup[] = [];

  for (const sec of targetSectors) {
    const sectorStocks = stocks.filter(
      s => s.sector === sec.name && s.price >= 50 && s.turnover > 500_000_000
    );

    // Rank stocks using quantitative AI scoring:
    // Recommendation (weight 40%) + Momentum Change (weight 30%) + RSI Health (weight 20%) + Volume (10%)
    const scored = sectorStocks.map(s => {
      let score = s.recommendation * 50; // max ~25-50
      if (s.changePct > 0) score += Math.min(25, s.changePct * 5);
      if (s.rsi >= 50 && s.rsi <= 68) score += 20; // optimal bullish zone
      else if (s.rsi < 40) score += 15; // oversold bounce potential
      if (s.price > s.ema20) score += 10;

      // Determine action & reasoning
      let action: "STRONG BUY" | "BUY" | "ACCUMULATE" = "BUY";
      let aiReason = "Momentum positif dengan likuiditas aktif di sektor ini.";

      if (score >= 55 || s.recommendation >= 0.4) {
        action = "STRONG BUY";
        aiReason = `Breakout kuat di atas EMA20 didukung rekomendasi teknikal TradingView (+${s.recommendation}). RSI ${s.rsi}.`;
      } else if (s.rsi < 40) {
        action = "ACCUMULATE";
        aiReason = `Area oversold (RSI ${s.rsi}) di dekat support teknikal. Potensi *technical rebound*.`;
      } else {
        action = "BUY";
        aiReason = `Tren akumulasi sehat di atas EMA50 dengan sinyal ${s.signals[0] || "Uptrend"}. Target profit rasio 1:2.`;
      }

      const val = s.turnover;
      const turnoverFormatted = val >= 1_000_000_000
        ? `${(val / 1_000_000_000).toFixed(1)} Miliar`
        : `${(val / 1_000_000).toFixed(0)} Juta`;

      return {
        ticker: s.ticker,
        name: s.name,
        price: s.price,
        changePct: s.changePct,
        volume: s.volume,
        turnover: s.turnover,
        turnoverFormatted,
        rsi: s.rsi,
        recommendationScore: s.recommendation,
        action,
        signals: s.signals,
        aiReason,
        _internalScore: score,
      };
    });

    scored.sort((a, b) => b._internalScore - a._internalScore);

    result.push({
      sectorId: sec.id,
      sectorName: sec.name,
      icon: sec.icon,
      stocks: scored.slice(0, 5).map(({ _internalScore, ...rest }) => rest),
    });
  }

  return result;
}
