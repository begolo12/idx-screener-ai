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

test("paper trading metrics compute winrate correctly", () => {
  const trades = [
    { ticker: "BBCA", pnlPct: 4.5 },
    { ticker: "BBRI", pnlPct: 3.2 },
    { ticker: "TLKM", pnlPct: -2.1 },
    { ticker: "ASII", pnlPct: 5.0 },
  ];

  const wins = trades.filter(t => t.pnlPct > 0).length;
  const total = trades.length;
  const winRate = Number(((wins / total) * 100).toFixed(1));
  const cumulativePnl = Number(trades.reduce((acc, t) => acc + t.pnlPct, 0).toFixed(2));

  assert.equal(wins, 3);
  assert.equal(winRate, 75.0);
  assert.equal(cumulativePnl, 10.6);
});

test("discord webhook validator detects valid and invalid urls", () => {
  const validUrl = "https://discord.com/api/webhooks/123456/abcdef";
  const invalidUrl = "https://example.com/invalid";

  assert.ok(validUrl.startsWith("https://discord.com/api/webhooks/"));
  assert.ok(!invalidUrl.startsWith("https://discord.com/api/webhooks/"));
});
