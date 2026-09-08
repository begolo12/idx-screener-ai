export interface DiscordEmbedField {
  name: string;
  value: string;
  inline?: boolean;
}

export interface DiscordEmbed {
  title: string;
  description?: string;
  url?: string;
  color?: number;
  fields?: DiscordEmbedField[];
  footer?: {
    text: string;
    icon_url?: string;
  };
  timestamp?: string;
}

export interface DiscordWebhookPayload {
  username?: string;
  avatar_url?: string;
  content?: string;
  embeds?: DiscordEmbed[];
}

export async function sendDiscordWebhook(
  webhookUrl: string,
  payload: DiscordWebhookPayload
): Promise<{ success: boolean; error?: string }> {
  if (!webhookUrl || !webhookUrl.startsWith("https://discord.com/api/webhooks/")) {
    return {
      success: false,
      error: "URL Discord Webhook tidak valid. Pastikan diawali dengan https://discord.com/api/webhooks/",
    };
  }

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: payload.username || "IDX Market Intelligence Bot",
        avatar_url: payload.avatar_url || "https://img.icons8.com/fluency/96/bullish.png",
        ...payload,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      return { success: false, error: `Discord API error ${res.status}: ${errText}` };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Gagal menghubungi Discord server." };
  }
}

export function buildMarketReportDiscordEmbed(data: {
  session: "morning" | "closing";
  ihsg: { value: string; change: string; changePct: string };
  foreignFlow: string;
  aiAnalysis: string;
  topGainers: Array<{ ticker: string; price: number; changePct: number; signals: string[] }>;
  activeSchemeName: string;
  winRate: number;
}): DiscordEmbed {
  const isMorning = data.session === "morning";
  const isPositive = !data.ihsg.change.startsWith("-");

  const title = isMorning
    ? "🌤️ IDX MORNING PULSE - ANALISA SESI 1 (10:00 WIB)"
    : "🌆 IDX MARKET WRAP - PENUTUPAN & OUTLOOK (15:00 WIB)";

  // Emerald Green (0x10B981) or Rose Red (0xEF4444)
  const color = isPositive ? 0x10b981 : 0xef4444;

  const fields: DiscordEmbedField[] = [
    {
      name: "📈 Indeks Harga Saham Gabungan (IHSG)",
      value: `**${data.ihsg.value}** (${data.ihsg.change} / ${data.ihsg.changePct})\nArus Asing: \`${data.foreignFlow}\``,
      inline: false,
    },
    {
      name: "⚡ Top Movers & Momentum Pagi",
      value: data.topGainers.length > 0
        ? data.topGainers
            .slice(0, 4)
            .map(
              s =>
                `• **${s.ticker}**: Rp ${s.price.toLocaleString("id-ID")} (${s.changePct > 0 ? "+" : ""}${s.changePct}%) ${s.signals.length > 0 ? `\`[${s.signals[0]}]\`` : ""}`
            )
            .join("\n")
        : "Tidak ada data mover.",
      inline: false,
    },
    {
      name: "🧠 AI Strategy Lab Tracker",
      value: `Skema Aktif: **${data.activeSchemeName}**\nSimulasi Winrate: **${data.winRate}%** (Adaptive Weekly Optimization)`,
      inline: true,
    },
  ];

  return {
    title,
    description: data.aiAnalysis.length > 1500
      ? data.aiAnalysis.slice(0, 1500) + "...\n*(Lihat selengkapnya di Web PWA)*"
      : data.aiAnalysis,
    color,
    fields,
    footer: {
      text: "IDX Screener PWA • TradingView Scanner & DeepSeek AI",
    },
    timestamp: new Date().toISOString(),
  };
}
