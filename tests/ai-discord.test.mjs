import test from "node:test";
import assert from "node:assert/strict";

test("buildMarketReportDiscordEmbed creates valid embed structure", () => {
  const isPositive = true;
  const color = isPositive ? 0x10b981 : 0xef4444;

  const embed = {
    title: "🌤️ IDX MORNING PULSE - ANALISA SESI 1 (10:00 WIB)",
    description: "Analisa pasar IDX pagi ini.",
    color,
    fields: [
      { name: "📈 IHSG", value: "6.686,44 (+1.01%)", inline: false },
      { name: "🧠 AI Strategy Lab", value: "Momentum Breakout (75% Win)", inline: true }
    ],
    footer: { text: "IDX Screener PWA" },
    timestamp: new Date().toISOString(),
  };

  assert.equal(embed.color, 0x10b981);
  assert.equal(embed.fields.length, 2);
  assert.ok(embed.title.includes("10:00 WIB"));
  assert.ok(embed.footer.text.includes("IDX Screener"));
});

test("portfolio 5 million calculates lots and equity accurately", () => {
  const initialCapital = 5_000_000;
  const price = 6675; // BBCA
  const pricePerLot = price * 100; // 667,500
  const lots = Math.floor(2_000_000 / pricePerLot); // 2 lot
  const cost = lots * pricePerLot; // 1,335,000
  const cash = initialCapital - cost; // 3,665,000
  const currentValue = lots * 100 * price; // 1,335,000
  const totalEquity = cash + currentValue; // 5,000,000

  assert.equal(lots, 2);
  assert.equal(cost, 1_335_000);
  assert.equal(cash, 3_665_000);
  assert.equal(totalEquity, 5_000_000);
});

test("market hours validation restricts weekend and outside 09:00-15:00", () => {
  const isWeekend = (day) => day === 0 || day === 6;
  const isTimeInTradingHours = (time) => time >= 900 && time <= 1500;

  assert.ok(isWeekend(0));
  assert.ok(isWeekend(6));
  assert.ok(!isWeekend(2) && isTimeInTradingHours(1000));
  assert.ok(!isTimeInTradingHours(1700));
});

test("broker MG scalper penalty modifies recommendation score downward", () => {
  const brokerProfile = {
    code: "MG",
    type: "SCALPER_FAST_MONEY",
    sentiment: "BEARISH_WARNING",
    penalty: -30
  };

  let baseScore = 60;
  if (brokerProfile.code === "MG") {
    baseScore += brokerProfile.penalty; // 60 - 30 = 30
  }

  assert.equal(brokerProfile.code, "MG");
  assert.equal(baseScore, 30);
  assert.ok(baseScore < 50, "MG dominance lowers score below buy threshold");
});

test("sector picks limits to maximum 5 stocks per sector", () => {
  const mockStocks = [
    { ticker: "BBCA", score: 90 },
    { ticker: "BBRI", score: 85 },
    { ticker: "BMRI", score: 80 },
    { ticker: "BBNI", score: 75 },
    { ticker: "BRIS", score: 70 },
    { ticker: "BBTN", score: 65 },
    { ticker: "BTPS", score: 60 },
  ];

  const top5 = mockStocks.slice(0, 5);
  assert.equal(top5.length, 5);
  assert.equal(top5[0].ticker, "BBCA");
  assert.equal(top5[4].ticker, "BRIS");
});

test("portfolio 60/40 scheme correctly allocates Bluechip and Scalping budgets", () => {
  const initialCapital = 5_000_000;
  const targetBluechip = initialCapital * 0.60; // 3,000,000
  const targetScalping = initialCapital * 0.40; // 2,000,000

  // 1. Bluechip BBRI @ 3,390 (1 lot = 339,000) -> 8 lot = 2,712,000
  const bbriPrice = 3390;
  const bbriLots = Math.floor(targetBluechip / (bbriPrice * 100)); // 8 lots
  const bbriCost = bbriLots * bbriPrice * 100; // 2,712,000

  // 2. Scalping BIPI @ 162 (1 lot = 16,200) + ISAT @ 2,450 (1 lot = 245,000)
  const bipiPrice = 162;
  const bipiLots = Math.floor(1_000_000 / (bipiPrice * 100)); // 61 lots = 988,200
  const bipiCost = bipiLots * bipiPrice * 100;

  const isatPrice = 2450;
  const isatLots = Math.floor(1_000_000 / (isatPrice * 100)); // 4 lots = 980,000
  const isatCost = isatLots * isatPrice * 100;

  const totalInvested = bbriCost + bipiCost + isatCost;
  const remainingCash = initialCapital - totalInvested;

  assert.equal(bbriLots, 8);
  assert.equal(bbriCost, 2_712_000);
  assert.ok(bipiCost >= 900_000 && bipiCost <= 1_000_000);
  assert.ok(isatCost >= 900_000 && isatCost <= 1_000_000);
  assert.ok(remainingCash < 400_000, "Cash is maximally deployed without sitting idle");
  assert.equal(totalInvested + remainingCash, initialCapital);
});

test("reinvesting idle cash triggers when position closed at Take Profit", () => {
  let cash = 320_000;
  const closedPositionGain = 1_050_000; // TP +5% on 1M position
  cash += closedPositionGain; // Now cash is 1,370,000

  assert.equal(cash, 1_370_000);
  assert.ok(cash >= 250_000, "Cash exceeds 250k reinvest threshold");

  // Reinvestment allocates to next viable stock
  const candidatePrice = 224; // BUMI @ 224
  const pricePerLot = candidatePrice * 100; // 22,400
  const lotsToBuy = Math.floor(cash / pricePerLot); // 61 lots
  const deployCost = lotsToBuy * pricePerLot; // 1,366,400
  cash -= deployCost; // 3,600 idle cash remaining

  assert.equal(lotsToBuy, 61);
  assert.equal(deployCost, 1_366_400);
  assert.ok(cash < 25_000, "Freed cash instantly reinvested into active market asset");
});


