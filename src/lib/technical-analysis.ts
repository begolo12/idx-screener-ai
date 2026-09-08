export interface TechnicalStock {
  ticker: string;
  name: string;
  price: number;
  changePct: number;
  volume: number;
  turnover: number;
  rsi: number;
  macd: number;
  macdSignal: number;
  recommendation: number; // >0.1 Buy, >0.5 Strong Buy, <-0.1 Sell, <-0.5 Strong Sell
  ema20: number;
  ema50: number;
  sma200: number;
  signals: string[];
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

export async function getTechnicalStocks(limit = 80): Promise<TechnicalStock[]> {
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
      const rsi = Number(Number(d[6] || 50).toFixed(1));
      const macd = Number(Number(d[7] || 0).toFixed(2));
      const macdSignal = Number(Number(d[8] || 0).toFixed(2));
      const recommendation = Number(Number(d[9] || 0).toFixed(2));
      const ema20 = Number(Number(d[10] || price).toFixed(0));
      const ema50 = Number(Number(d[11] || price).toFixed(0));
      const sma200 = Number(Number(d[12] || price).toFixed(0));

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

  // Filter 1: Breakouts (Change > 2%, RSI 50-70, High Volume)
  const topBreakouts = stocks
    .filter(s => s.changePct >= 1.5 && s.rsi >= 50 && s.rsi <= 75 && s.turnover > 5_000_000_000)
    .slice(0, 5);

  // Filter 2: Oversold Rebound (RSI < 38, Change > -1%)
  const topOversold = stocks
    .filter(s => s.rsi < 40 && s.price > 100)
    .sort((a, b) => a.rsi - b.rsi)
    .slice(0, 5);

  // Filter 3: Trend Following (Above EMA50, Golden Cross or Strong Buy)
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
