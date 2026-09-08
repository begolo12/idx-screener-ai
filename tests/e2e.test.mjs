import test from "node:test";
import assert from "node:assert/strict";

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3005";

test("E2E - Healthcheck root page returns 200 OK and valid HTML", async () => {
  const res = await fetch(`${BASE_URL}/`);
  assert.equal(res.status, 200);
  const text = await res.text();
  assert.ok(text.includes("<!DOCTYPE html>") || text.includes("<html"));
  assert.ok(text.includes("IHSG"));
});

test("E2E - /api/market/overview returns accurate live breadth and foreign flow", async () => {
  const res = await fetch(`${BASE_URL}/api/market/overview`);
  assert.equal(res.status, 200);
  const data = await res.json();

  assert.ok(data.ihsg, "IHSG object must exist");
  assert.ok(data.ihsg.value, "IHSG value must be string formatted");
  assert.ok(data.foreignFlow, "Foreign flow must exist");

  // Breadth KPI checks
  assert.ok(data.breadth, "Market breadth must exist");
  assert.ok(typeof data.breadth.up === "number");
  assert.ok(typeof data.breadth.down === "number");
  assert.ok(typeof data.breadth.unchanged === "number");
  assert.equal(data.breadth.up + data.breadth.down + data.breadth.unchanged, data.breadth.total);
});

test("E2E - /api/screener validates sorting, limits, and professional filters", async () => {
  // Test Top Gainers
  const resGainers = await fetch(`${BASE_URL}/api/screener?sort=gainers&limit=10`);
  assert.equal(resGainers.status, 200);
  const gainers = await resGainers.json();
  assert.ok(Array.isArray(gainers.data));
  assert.ok(gainers.data.length <= 10);
  if (gainers.data.length >= 2) {
    assert.ok(gainers.data[0].changePct >= gainers.data[1].changePct, "Gainers sorted desc by changePct");
  }

  // Test Top Losers
  const resLosers = await fetch(`${BASE_URL}/api/screener?sort=losers&limit=10`);
  assert.equal(resLosers.status, 200);
  const losers = await resLosers.json();
  if (losers.data.length >= 2) {
    assert.ok(losers.data[0].changePct <= losers.data[1].changePct, "Losers sorted asc by changePct");
  }

  // Test Top Turnover
  const resTurnover = await fetch(`${BASE_URL}/api/screener?sort=turnover&limit=10`);
  assert.equal(resTurnover.status, 200);
  const turnover = await resTurnover.json();
  if (turnover.data.length >= 2) {
    const val0 = turnover.data[0].turnoverVal || 0;
    const val1 = turnover.data[1].turnoverVal || 0;
    assert.ok(val0 >= val1, "Turnover sorted desc by value");
  }
});

test("E2E - /api/stocks/[ticker] validates quote, technicals, valuation, and 7-day news links", async () => {
  const ticker = "BBCA";
  const res = await fetch(`${BASE_URL}/api/stocks/${ticker}`);
  assert.equal(res.status, 200);
  const data = await res.json();

  assert.equal(data.ticker, ticker);
  assert.ok(data.quote, "Quote must be present");
  assert.ok(typeof data.quote.price === "number");
  assert.ok(typeof data.quote.changePct === "number");
  assert.ok(data.quote.open > 0);
  assert.ok(data.quote.high >= data.quote.low);

  // Valuation & Technical indicators
  assert.ok(data.quote.rsi !== undefined, "RSI must be computed or null");
  assert.ok(data.quote.per !== undefined, "PER must be computed or null");
  assert.ok(data.quote.pbv !== undefined, "PBV must be computed or null");
  assert.ok(data.quote.week52High >= data.quote.week52Low, "52-week high must be >= 52-week low");

  // News integrity (filtered <= 7 days ago, with clickable valid URL)
  assert.ok(Array.isArray(data.news), "News array must be returned");
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  for (const item of data.news) {
    assert.ok(item.title, "News title required");
    assert.ok(item.url && item.url.startsWith("http"), "Valid clickable URL required");
    if (item.publishedAt) {
      const pubTime = new Date(item.publishedAt).getTime();
      assert.ok(pubTime >= sevenDaysAgo, `News '${item.title}' must be within 7 days`);
    }
  }
});

test("E2E - /api/ai-lab verifies portfolio mathematical equity, autonomous state, and duration KPI", async () => {
  const res = await fetch(`${BASE_URL}/api/ai-lab`);
  assert.equal(res.status, 200);
  const data = await res.json();

  assert.equal(data.success, true);
  assert.ok(data.state, "State must exist");

  const { portfolio, metrics, aiLearning, openPositions } = data.state;

  // Math Equity Consistency check: Total Equity = Cash + Invested
  assert.equal(portfolio.initialCapital, 5_000_000, "Initial capital must be 5 million IDR");
  const computedInvested = openPositions.reduce((acc, p) => acc + p.currentValue, 0);
  assert.equal(portfolio.invested, computedInvested, "Invested must equal sum of open position values");
  assert.equal(portfolio.totalEquity, portfolio.cash + portfolio.invested, "Total equity = cash + invested");

  // Lot size precision check: 1 Lot = 100 shares
  for (const pos of openPositions) {
    assert.equal(pos.shares, pos.lots * 100, `Stock ${pos.ticker} shares must strictly equal lots * 100`);
    assert.equal(pos.cost, pos.shares * pos.entryPrice, "Cost must equal shares * entryPrice");
    assert.equal(pos.currentValue, pos.shares * pos.currentPrice, "Current value must equal shares * currentPrice");
  }

  // Duration & Speed KPI verification
  assert.ok(metrics.durationKpi, "durationKpi must be calculated");
  assert.ok(metrics.durationKpi.avgTpDurationDays > 0, "avgTpDurationDays must be positive");
  assert.ok(metrics.durationKpi.avgSlDurationDays > 0, "avgSlDurationDays must be positive");
  assert.ok(metrics.durationKpi.velocityScore > 0, "velocityScore must be positive");
  assert.ok(metrics.durationKpi.speedAnalysis.length > 20, "speedAnalysis narrative must be provided");
  assert.ok(metrics.durationKpi.marketDailyVolatility > 0, "marketDailyVolatility must be calculated from live TV data");

  // Autonomous learning target check
  assert.equal(aiLearning.targetWinRate, 95.0, "Autonomous AI learning target must be 95% winrate");
  assert.equal(aiLearning.isAutonomous, true, "AI must operate autonomously");

  // Sector picks verification
  assert.ok(Array.isArray(data.sectorPicks), "Sector picks must be returned");
  for (const group of data.sectorPicks) {
    assert.ok(group.stocks.length <= 5, "Maximum 5 stocks per sector");
  }
});

test("E2E - /api/watchlist supports item lifecycle (GET, POST, DELETE)", async () => {
  const testTicker = "AUTO";

  // 1. Add to Watchlist
  const postRes = await fetch(`${BASE_URL}/api/watchlist`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ticker: testTicker }),
  });
  assert.equal(postRes.status, 200);

  // 2. Fetch Watchlist
  const getRes = await fetch(`${BASE_URL}/api/watchlist`);
  assert.equal(getRes.status, 200);
  const getJson = await getRes.json();
  assert.ok(Array.isArray(getJson.items));

  // 3. Clean up / Delete from Watchlist
  const delRes = await fetch(`${BASE_URL}/api/watchlist?ticker=${testTicker}`, {
    method: "DELETE",
  });
  assert.equal(delRes.status, 200);
});

test("E2E - PWA installability assets and service worker are fully functional", async () => {
  // 1. Manifest test
  const manifestRes = await fetch(`${BASE_URL}/manifest.json`);
  assert.equal(manifestRes.status, 200);
  const manifest = await manifestRes.json();
  assert.equal(manifest.display, "standalone");
  assert.ok(manifest.start_url);
  assert.ok(Array.isArray(manifest.icons) && manifest.icons.length >= 2);

  const has192 = manifest.icons.some((i) => i.sizes === "192x192" && i.type === "image/png");
  const has512 = manifest.icons.some((i) => i.sizes === "512x512" && i.type === "image/png");
  assert.ok(has192, "Manifest must contain 192x192 PNG icon for Android installability");
  assert.ok(has512, "Manifest must contain 512x512 PNG icon for Android installability");

  // 2. Service Worker test
  const swRes = await fetch(`${BASE_URL}/sw.js`);
  assert.equal(swRes.status, 200);
  const swContent = await swRes.text();
  assert.ok(swContent.includes("CACHE_NAME"));
  assert.ok(swContent.includes("addEventListener"));

  // 3. PNG Icons integrity test
  const icon192Res = await fetch(`${BASE_URL}/icon-192.png`);
  assert.equal(icon192Res.status, 200);
  assert.ok(icon192Res.headers.get("content-type")?.includes("image/png"));

  const icon512Res = await fetch(`${BASE_URL}/icon-512.png`);
  assert.equal(icon512Res.status, 200);
  assert.ok(icon512Res.headers.get("content-type")?.includes("image/png"));

  const appleTouchRes = await fetch(`${BASE_URL}/apple-touch-icon.png`);
  assert.equal(appleTouchRes.status, 200);
  assert.ok(appleTouchRes.headers.get("content-type")?.includes("image/png"));
});

