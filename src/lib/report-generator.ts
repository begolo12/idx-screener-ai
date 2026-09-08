import { getMarketOverview } from "./market-service";
import { getMarketTechnicalSummary, getTechnicalStocks } from "./technical-analysis";
import { generateMarketReportWithAI } from "./deepseek-service";
import { buildMarketReportDiscordEmbed, sendDiscordWebhook } from "./discord-service";
import { getStrategyLabState } from "./strategy-engine";
import { zpi } from "./zapi";

export interface GeneratedReport {
  session: "morning" | "closing";
  generatedAt: string;
  ihsg: {
    value: string;
    change: string;
    changePct: string;
  };
  foreignFlow: string;
  aiAnalysis: string;
  activeScheme: string;
  winRate: number;
  discordDispatched: boolean;
  discordError?: string;
}

let lastReportCache: GeneratedReport | null = null;

export async function generateAndDispatchMarketReport(
  session: "morning" | "closing",
  customWebhookUrl?: string
): Promise<GeneratedReport> {
  const [marketData, technicalSummary, techStocks, strategyState] = await Promise.all([
    getMarketOverview(),
    getMarketTechnicalSummary(),
    getTechnicalStocks(20),
    getStrategyLabState(),
  ]);

  // Fetch news headlines from Zapi
  let headlines: string[] = [];
  try {
    const newsRes: any = await zpi.run("finance:idxchannel", "latest", {});
    const items = Array.isArray(newsRes) ? newsRes : newsRes?.items || newsRes?.data || [];
    headlines = items.slice(0, 4).map((n: any) => n.title || n.headline).filter(Boolean);
  } catch {
    headlines = [
      "IHSG fluktuatif merespons pergerakan bursa regional Asia.",
      "Sektor perbankan dan energi menjadi penopang likuiditas pasar modal.",
    ];
  }

  const topGainersFormatted = techStocks
    .filter(s => s.changePct > 0)
    .slice(0, 5)
    .map(s => ({
      ticker: s.ticker,
      price: s.price,
      changePct: s.changePct,
      rsi: s.rsi,
      signals: s.signals,
    }));

  const topVolumeFormatted = techStocks.slice(0, 3).map(s => {
    const val = s.turnover;
    const formatted = val >= 1_000_000_000
      ? `${(val / 1_000_000_000).toFixed(1)} Miliar`
      : `${(val / 1_000_000).toFixed(0)} Juta`;
    return {
      ticker: s.ticker,
      price: s.price,
      turnoverFormatted: formatted,
    };
  });

  // Generate analysis text using DeepSeek
  const aiAnalysis = await generateMarketReportWithAI({
    session,
    ihsg: marketData.ihsg,
    foreignFlow: marketData.foreignFlow.netBuySell,
    advancers: technicalSummary.advancers,
    decliners: technicalSummary.decliners,
    topGainers: topGainersFormatted,
    topVolume: topVolumeFormatted,
    newsHeadlines: headlines,
  });

  // Discord Dispatching
  const webhookUrl = customWebhookUrl || process.env.DISCORD_WEBHOOK_URL || "";
  let discordDispatched = false;
  let discordError: string | undefined;

  if (webhookUrl) {
    const embed = buildMarketReportDiscordEmbed({
      session,
      ihsg: marketData.ihsg,
      foreignFlow: marketData.foreignFlow.netBuySell,
      aiAnalysis,
      topGainers: topGainersFormatted,
      activeSchemeName: strategyState.activeScheme.name,
      winRate: strategyState.metrics.winRate,
    });

    const sendRes = await sendDiscordWebhook(webhookUrl, {
      content: session === "morning"
        ? "📢 **Laporan Pasar Sesi 1 (10:00 WIB) telah terbit!**"
        : "📢 **Laporan Penutupan Pasar Sesi 2 (15:00 WIB) telah terbit!**",
      embeds: [embed],
    });

    discordDispatched = sendRes.success;
    discordError = sendRes.error;
  }

  const result: GeneratedReport = {
    session,
    generatedAt: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
    ihsg: marketData.ihsg,
    foreignFlow: marketData.foreignFlow.netBuySell,
    aiAnalysis,
    activeScheme: strategyState.activeScheme.name,
    winRate: strategyState.metrics.winRate,
    discordDispatched,
    discordError,
  };

  lastReportCache = result;
  return result;
}

export function getLastReport(): GeneratedReport | null {
  return lastReportCache;
}
