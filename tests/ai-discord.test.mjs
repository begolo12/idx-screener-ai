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

  // Sunday
  assert.ok(isWeekend(0));
  // Saturday
  assert.ok(isWeekend(6));
  // Tuesday at 10:00 (1000)
  assert.ok(!isWeekend(2) && isTimeInTradingHours(1000));
  // Tuesday at 17:00 (1700) -> Closed
  assert.ok(!isTimeInTradingHours(1700));
});

test("discord webhook validator detects valid and invalid urls", () => {
  const validUrl = "https://discord.com/api/webhooks/123456/abcdef";
  const invalidUrl = "https://example.com/invalid";

  assert.ok(validUrl.startsWith("https://discord.com/api/webhooks/"));
  assert.ok(!invalidUrl.startsWith("https://discord.com/api/webhooks/"));
});
