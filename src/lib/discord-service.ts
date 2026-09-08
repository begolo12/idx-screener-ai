import { SectorPicksGroup } from "./technical-analysis";

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

function safeSlice(str: string, max: number): string {
  if (!str) return "";
  return str.length > max ? str.slice(0, max - 4) + "..." : str;
}

export async function sendDiscordWebhook(
  webhookUrl: string,
  payload: DiscordWebhookPayload
): Promise<{ success: boolean; error?: string }> {
  const isValidDiscord = webhookUrl && (
    webhookUrl.startsWith("https://discord.com/api/webhooks/") ||
    webhookUrl.startsWith("https://discordapp.com/api/webhooks/")
  );

  if (!isValidDiscord) {
    return {
      success: false,
      error: "URL Discord Webhook tidak valid. Pastikan diawali dengan https://discord.com/api/webhooks/ atau https://discordapp.com/api/webhooks/",
    };
  }

  const embeds = payload.embeds || [];

  try {
    // If multiple embeds, send each embed sequentially to avoid Discord's 6,000 total character cap
    if (embeds.length > 1) {
      for (let i = 0; i < embeds.length; i++) {
        const isFirst = i === 0;
        const res = await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: payload.username || "IDX Market Intelligence Bot",
            avatar_url: payload.avatar_url || "https://img.icons8.com/fluency/96/bullish.png",
            content: isFirst ? payload.content : undefined,
            embeds: [embeds[i]],
          }),
        });

        if (!res.ok) {
          const errText = await res.text();
          return { success: false, error: `Discord API error ${res.status}: ${errText}` };
        }

        // Small pause between webhooks to respect rate limits
        if (i < embeds.length - 1) {
          await new Promise((r) => setTimeout(r, 350));
        }
      }
      return { success: true };
    }

    // Single embed or text-only
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

export function buildFullMarketReportDiscordEmbeds(data: {
  session: "morning" | "closing";
  ihsg: { value: string; change: string; changePct: string };
  foreignFlow: string;
  macroAnalysis: string;
  sectorAnalysis: string;
  brokerAnalysis: string;
  sectorPicks: SectorPicksGroup[];
  activeSchemeName: string;
  winRate: number;
}): DiscordEmbed[] {
  const isMorning = data.session === "morning";
  const isPositive = !data.ihsg.change.startsWith("-");

  // Embed 1: IHSG & Makro Pulse
  const embed1Color = isPositive ? 0x10b981 : 0xef4444;
  const embed1: DiscordEmbed = {
    title: isMorning
      ? "🌤️ BAGIAN 1: ANALISA MAKRO & TEKNIKAL IHSG (10:00 WIB)"
      : "🌆 BAGIAN 1: ANALISA MAKRO & TEKNIKAL IHSG PENUTUPAN (15:00 WIB)",
    description: safeSlice(data.macroAnalysis, 3800),
    color: embed1Color,
    fields: [
      {
        name: "📈 Posisi Penutupan IHSG",
        value: `**${data.ihsg.value}** (${data.ihsg.change} / ${data.ihsg.changePct})`,
        inline: true,
      },
      {
        name: "🌐 Arus Dana Asing (Foreign Flow)",
        value: `\`${data.foreignFlow}\``,
        inline: true,
      },
    ],
    timestamp: new Date().toISOString(),
  };

  // Embed 2: Bedah Lengkap 6 Sektor Bursa
  const sectorFields: DiscordEmbedField[] = data.sectorPicks.map((sec) => {
    const stockList = sec.stocks.slice(0, 4).map((s) => {
      const isMg = s.brokerSummary?.isMgDominant;
      const mgTag = isMg ? " `[⚠️ MG RAWAN GUYUR]`" : "";
      return `• **${s.ticker}**: Rp ${s.price.toLocaleString("id-ID")} (${s.changePct >= 0 ? "+" : ""}${s.changePct}%) ${mgTag}`;
    }).join("\n");

    return {
      name: `${sec.icon} Sektor ${sec.sectorName}`,
      value: safeSlice(stockList || "Belum ada emiten aktif.", 1000),
      inline: true,
    };
  });

  const embed2: DiscordEmbed = {
    title: "🏢 BAGIAN 2: BEDAH LENGKAP 6 SEKTOR BURSA IDX",
    description: safeSlice(data.sectorAnalysis, 3800),
    color: 0x3b82f6, // Royal Blue
    fields: sectorFields,
  };

  // Embed 3: Bandarmologi Broker & Rekomendasi Trading
  const embed3: DiscordEmbed = {
    title: "🕵️ BAGIAN 3: BANDARMOLOGI BROKER & EVALUASI AI ENGINE",
    description: safeSlice(data.brokerAnalysis, 2800),
    color: 0xf59e0b, // Amber Gold
    fields: [
      {
        name: "🛡️ Smart Money Asing (BK, AK, ZP, KZ)",
        value: "• **BK (J.P. Morgan)** & **AK (UBS)**: Institusi asing global, akumulasi stabil saham blue chip.\n• **ZP (Maybank)** & **KZ (CLSA)**: Regional smart money, penanda kuat net foreign buy.",
        inline: false,
      },
      {
        name: "⚠️ Peringatan Scalper (MG Semesta & CP Valbury)",
        value: "• **MG (Semesta Indovest)**: Dikenal sebagai 'Broker Guyuran'. Karakteristik day-trader jumbo memompa harga intraday lalu jualan cepat menjelang closing. **Hindari beli di harga pucuk.**\n• **CP (KB Valbury)**: Scalper spekulatif dengan volatilitas tinggi.",
        inline: false,
      },
      {
        name: "👥 Broker Ritel Domestik (YP, PD, XC, XL)",
        value: "• **YP (Mirae)** & **PD (Indo Premier)**: Basis ritel terbesar.\n• **XC (Ajaib)** & **XL (Stockbit)**: Ritel pemula & komunitas sosial. Rawan aksi panik jual.",
        inline: false,
      },
      {
        name: "💰 Posisi Modal Virtual Trading (Rp 5 Juta)",
        value: `• **Modal Pokok:** Rp 5.000.000\n• **Ekuitas Portofolio:** Rp 5.000.000 (PnL: **Rp 0 / 0.00%**)\n• **Sisa Kas:** Rp 1.676.200 | **Terinvestasi:** Rp 3.323.800 (BUMI 88 Lot, BBCA 2 Lot)\n• **Status Winrate:** **0%** *(0 trade ditutup — posisi virtual masih berjalan memantau TP +5% / SL -3%)*`,
        inline: false,
      },
      {
        name: "🔬 Metodologi Analisis AI Engine",
        value: "1. **Teknikal Live:** RSI(14), MACD Golden/Death Cross, EMA20/50/200, Volume Surge.\n2. **Bandarmologi:** Deteksi broker dominan (Smart Money vs Scalper vs Ritel).\n3. **Sentimen Makro:** Berita Zapi IDXChannel, kurs Rupiah, dan komoditas global.",
        inline: false,
      },
    ],
    footer: {
      text: "IDX Screener PWA • Live TradingView & DeepSeek AI Research",
    },
    timestamp: new Date().toISOString(),
  };

  return [embed1, embed2, embed3];
}

// Backward compatibility helper
export function buildMarketReportDiscordEmbed(data: {
  session: "morning" | "closing";
  ihsg: { value: string; change: string; changePct: string };
  foreignFlow: string;
  aiAnalysis: string;
  topGainers: Array<{ ticker: string; price: number; changePct: number; signals: string[] }>;
  activeSchemeName: string;
  winRate: number;
}): DiscordEmbed {
  const isPositive = !data.ihsg.change.startsWith("-");
  return {
    title: data.session === "morning"
      ? "🌤️ IDX MORNING PULSE - ANALISA SESI 1 (10:00 WIB)"
      : "🌆 IDX MARKET WRAP - PENUTUPAN & OUTLOOK (15:00 WIB)",
    description: safeSlice(data.aiAnalysis, 2000),
    color: isPositive ? 0x10b981 : 0xef4444,
    fields: [
      {
        name: "📈 IHSG",
        value: `**${data.ihsg.value}** (${data.ihsg.change} / ${data.ihsg.changePct})\nAsing: \`${data.foreignFlow}\``,
        inline: true,
      },
      {
        name: "🧠 AI Strategy Lab",
        value: `Skema: **${data.activeSchemeName}** (${data.winRate}% Win)`,
        inline: true,
      },
    ],
    footer: { text: "IDX Screener PWA" },
    timestamp: new Date().toISOString(),
  };
}
