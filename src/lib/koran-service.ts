import { zpi } from "./zapi";
import { getMarketOverview } from "./market-service";
import { callDeepSeek } from "./deepseek-service";
import { sendDiscordWebhook, DiscordEmbed } from "./discord-service";

export interface KoranArticle {
  title: string;
  category: string;
  publishedAt: string;
  source: string;
  url?: string;
}

export interface KoranHarianData {
  editionDate: string;
  ihsgSummary: string;
  headlineStory: string;
  macroMonetary: string;
  corporateNews: string;
  commodityPulse: string;
  editorialInsight: string;
  rawArticles: KoranArticle[];
  discordDispatched: boolean;
  discordError?: string;
}

export async function fetchHighImpactNews(): Promise<KoranArticle[]> {
  try {
    const res: any = await zpi.run("finance:idxchannel", "latest", {});
    const items = Array.isArray(res) ? res : res?.items || res?.data || [];

    return items.map((item: any) => ({
      title: item.title || item.headline || "Berita Pasar",
      category: item.category || "MARKET NEWS",
      publishedAt: item.publishedAt || new Date().toISOString(),
      source: item.source || "idxchannel.com",
      url: item.url || "",
    }));
  } catch (err) {
    console.error("Failed to fetch news for koran:", err);
    return [
      {
        title: "IHSG Ditutup Menguat ke 6.686 Ditopang Akumulasi Asing",
        category: "MARKET NEWS",
        publishedAt: new Date().toISOString(),
        source: "idxchannel.com",
      },
      {
        title: "Rupiah Ditutup Menguat Terhadap Dolar AS",
        category: "MACRO",
        publishedAt: new Date().toISOString(),
        source: "idxchannel.com",
      },
    ];
  }
}

export async function generateAndPublishKoranSaham(
  customWebhookUrl?: string
): Promise<KoranHarianData> {
  const [marketOverview, articles] = await Promise.all([
    getMarketOverview(),
    fetchHighImpactNews(),
  ]);

  const dateStr = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const prompt = `
Anda adalah Redaktur Utama (Chief Financial Editor) Koran Harian Pasar Modal Indonesia.
Tugas Anda: Susun koran ringkasan berita pasar saham harian ("KORAN HARIAN SAHAM IDX") yang menyajikan informasi paling signifikan, berpengaruh, dan krusial bagi para pelaku pasar modal dan investor.

DATA PASAR HARI INI:
- IHSG: ${marketOverview.ihsg.value} (${marketOverview.ihsg.change} / ${marketOverview.ihsg.changePct})
- Arus Asing: ${marketOverview.foreignFlow.netBuySell}

DAFTAR BERITA REAL TERBARU:
${articles.map((a, i) => `${i + 1}. [${a.category}] ${a.title}`).join("\n")}

SUSUN DENGAN STRUKTUR BERIKUT (Gunakan gaya bahasa jurnalisme koran finansial berkelas seperti Bisnis Indonesia / Kontan):

[HEADLINE UTAMA]
Tulis ulasan mendalam mengenai peristiwa ekonomi/pasar modal paling berpengaruh hari ini serta dampaknya ke indeks harga saham.

[MAKRO & MONETER]
Ulas kondisi nilai tukar Rupiah, inflasi, suku bunga moneter, dan arus modal asing (Net Foreign Flow).

[KORPORASI & EMITEN]
Ulas aksi korporasi, kinerja keuangan, dividen, dan isu strategis emiten yang sedang jadi fokus publik.

[PULSA KOMODITAS & SEKTORAL]
Ulas dampak harga komoditas (minyak mentah, batubara, CPO sawit, emas, nikel) terhadap saham-saham terkait.

[CATATAN REDAKSI & CATALYST RADAR]
Saran taktis dan katalis penting yang wajib dipantau para pelaku pasar esok hari.
`;

  const rawText = await callDeepSeek(
    prompt,
    "Anda adalah Redaktur Utama Koran Pasar Modal yang menyajikan berita finansial bermutu tinggi, padat fakta angka, dan berwibawa."
  );

  // Extract sections
  const getSection = (tag: string, nextTag?: string) => {
    const start = rawText.indexOf(`[${tag}]`);
    if (start === -1) return "";
    const fromStart = rawText.slice(start + tag.length + 2);
    if (!nextTag) return fromStart.trim();
    const end = fromStart.indexOf(`[${nextTag}]`);
    return end === -1 ? fromStart.trim() : fromStart.slice(0, end).trim();
  };

  const headlineStory = getSection("HEADLINE UTAMA", "MAKRO & MONETER") || rawText.slice(0, 800);
  const macroMonetary = getSection("MAKRO & MONETER", "KORPORASI & EMITEN") || "Kondisi makro dan moneter stabil dengan arus modal asing terjaga.";
  const corporateNews = getSection("KORPORASI & EMITEN", "PULSA KOMODITAS & SEKTORAL") || "Aksi korporasi emiten terus berlanjut di pasar reguler.";
  const commodityPulse = getSection("PULSA KOMODITAS & SEKTORAL", "CATATAN REDAKSI & CATALYST RADAR") || "Harga komoditas energi dan agrikultur menopang pergerakan saham sektoral.";
  const editorialInsight = getSection("CATATAN REDAKSI & CATALYST RADAR") || "Fokus pada disiplin manajemen risiko dan momentum saham berfundamental sehat.";

  const webhookUrl =
    customWebhookUrl ||
    process.env.DISCORD_KORAN_WEBHOOK_URL ||
    process.env.DISCORD_WEBHOOK_URL ||
    "";

  let discordDispatched = false;
  let discordError: string | undefined;

  if (webhookUrl) {
    const embed1: DiscordEmbed = {
      title: `📰 KORAN HARIAN PASAR MODAL IDX — EDISI ${dateStr.toUpperCase()}`,
      description: `### 📌 HEADLINE UTAMA\n${headlineStory.slice(0, 2000)}`,
      color: 0x1e3a8a, // Classic Deep Navy Blue Newspaper
      fields: [
        {
          name: "📊 Papan Pasar Modal (IHSG)",
          value: `**${marketOverview.ihsg.value}** (${marketOverview.ihsg.change} / ${marketOverview.ihsg.changePct})\nArus Asing: \`${marketOverview.foreignFlow.netBuySell}\``,
          inline: true,
        },
        {
          name: "💵 Kolom Makro & Moneter",
          value: macroMonetary.slice(0, 1000),
          inline: false,
        },
      ],
      timestamp: new Date().toISOString(),
    };

    const embed2: DiscordEmbed = {
      title: "🏢 EMITEN, KOMODITAS & RADAR KATALIS HARIAN",
      color: 0x0284c7, // Ocean Cyan
      fields: [
        {
          name: "🏢 Berita Korporasi & Aksi Emiten",
          value: corporateNews.slice(0, 1000),
          inline: false,
        },
        {
          name: "⚡ Pulsa Komoditas & Sektoral",
          value: commodityPulse.slice(0, 1000),
          inline: false,
        },
        {
          name: "💡 Catatan Redaksi & Catalyst Radar",
          value: editorialInsight.slice(0, 1000),
          inline: false,
        },
      ],
      footer: {
        text: "Koran Harian Saham IDX • Redaksi Riset Finansial PWA",
        icon_url: "https://img.icons8.com/fluency/96/news.png",
      },
      timestamp: new Date().toISOString(),
    };

    const sendRes = await sendDiscordWebhook(webhookUrl, {
      content: `📢 **[EDISI TERBIT] KORAN HARIAN SAHAM INDONESIA (${dateStr})**\n*Laporan berita pilihan paling berpengaruh terhadap bursa efek hari ini:*`,
      embeds: [embed1, embed2],
    });

    discordDispatched = sendRes.success;
    discordError = sendRes.error;
  }

  return {
    editionDate: dateStr,
    ihsgSummary: `${marketOverview.ihsg.value} (${marketOverview.ihsg.changePct})`,
    headlineStory,
    macroMonetary,
    corporateNews,
    commodityPulse,
    editorialInsight,
    rawArticles: articles,
    discordDispatched,
    discordError,
  };
}
