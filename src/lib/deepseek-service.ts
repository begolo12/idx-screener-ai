import { SectorPicksGroup } from "./technical-analysis";

interface DeepSeekMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface DeepSeekChatResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
}

export async function callDeepSeek(
  prompt: string,
  systemPrompt = "Anda adalah Kepala Riset Ekuitas (Head of Equity Research) senior Bursa Efek Indonesia (IDX). Berikan analisa pasar saham yang sangat mendalam, detail per sektor, berbasis data teknikal real-time dan flow bandarmologi broker, tajam dan profesional."
): Promise<string> {
  const apiKey = process.env.DEEPSEEK_API_KEY || "sk-b73acb4ac97c4f9b8a685cfa411b1095";
  const baseUrl = process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com/v1";
  const model = process.env.DEEPSEEK_MODEL || "deepseek-chat";

  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt },
        ],
        temperature: 0.3,
        max_tokens: 2200,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("DeepSeek API error:", res.status, errText);
      throw new Error(`DeepSeek API error: ${res.status}`);
    }

    const data: DeepSeekChatResponse = await res.json();
    return data.choices?.[0]?.message?.content?.trim() || "Analisa tidak dapat dihasilkan.";
  } catch (err) {
    console.error("callDeepSeek failed:", err);
    return "Analisa AI sementara tidak tersedia. Menggunakan data teknikal langsung dari TradingView Scanner.";
  }
}

export async function generateMarketReportWithAI(data: {
  session: "morning" | "closing";
  ihsg: { value: string; change: string; changePct: string };
  foreignFlow: string;
  advancers: number;
  decliners: number;
  topGainers: Array<{ ticker: string; price: number; changePct: number; rsi: number; signals: string[] }>;
  topVolume: Array<{ ticker: string; price: number; turnoverFormatted: string }>;
  sectorPicks: SectorPicksGroup[];
  newsHeadlines: string[];
}): Promise<{
  macroAnalysis: string;
  sectorAnalysis: string;
  brokerAnalysis: string;
  fullMarkdown: string;
}> {
  const sessionTitle = data.session === "morning"
    ? "SESI 1 - MORNING PULSE & BREAKOUT (10:00 WIB)"
    : "SESI 2 - MARKET WRAP & CLOSING OUTLOOK (15:00 WIB)";

  const sectorSummaryText = data.sectorPicks.map(sec => {
    const stockList = sec.stocks.map(s => {
      const brokerText = s.brokerSummary?.isMgDominant
        ? `[⚠️ TOP BUYER MG - SCALPER RAWAN GUYUR]`
        : `[Top Buyer: ${s.brokerSummary?.topBuyers.join(",") || "Campuran"}]`;
      return `  • ${s.ticker}: Rp ${s.price} (${s.changePct >= 0 ? "+" : ""}${s.changePct}%), RSI: ${s.rsi}, Aksi: ${s.action} ${brokerText}`;
    }).join("\n");

    return `${sec.icon} SEKTOR ${sec.sectorName.toUpperCase()}:\n${stockList}`;
  }).join("\n\n");

  const prompt = `
Buatkan laporan riset pasar harian IHSG yang sangat komprehensif, mendalam, dan terstruktur untuk publikasi komunitas trader di Discord.
Target Sesi: ${sessionTitle}
Tanggal: ${new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}

DATA PASAR RIIL (TradingView Scanner & BEI):
- IHSG: ${data.ihsg.value} (${data.ihsg.change}, ${data.ihsg.changePct})
- Arus Dana Asing (Foreign Flow): ${data.foreignFlow}
- Market Breadth: ${data.advancers} Saham Menguat, ${data.decliners} Saham Melemah

DATA 6 SEKTOR DAN SAHAM PILIHAN:
${sectorSummaryText}

SAHAM TURNOVER TERBESAR:
${data.topVolume.map(s => `- ${s.ticker}: Rp ${s.price} (${s.turnoverFormatted})`).join("\n")}

BERITA & KATALIS TERBARU:
${data.newsHeadlines.map(h => `- ${h}`).join("\n")}

INSTRUKSI FORMAT LAPORAN (SANGAT DETAIL):
Bagi laporan menjadi 3 bagian yang jelas:

[BAGIAN 1: ANALISA MAKRO & TEKNIKAL IHSG]
- Tinjauan menyeluruh pergerakan IHSG hari ini.
- Level teknikal: Support Kritis (S1, S2) dan Resistance Kritis (R1, R2).
- Analisa arus dana asing dan dampaknya terhadap likuiditas pasar modal.

[BAGIAN 2: BEDAH LENGKAP 6 SEKTOR BURSA]
Jelaskan secara mendalam kondisi MASING-MASING dari 6 sektor berikut:
1. 🏦 Sektor Keuangan: Ulasan big banks, likuiditas, dan flow asing.
2. ⚡ Sektor Energi & Tambang: Dampak pergerakan harga komoditas dan saham penggerak.
3. 📡 Sektor Infrastruktur & Telko: Evaluasi telekomunikasi dan utilitas.
4. 🛒 Sektor Konsumer & Ritel: Sentimen daya beli dan stabilitas emiten defensif.
5. 💻 Sektor Teknologi: Tren saham teknologi dan volatilitasnya.
6. 🏭 Sektor Industri & Material: Manufaktur, semen, dan industri dasar.

[BAGIAN 3: ANALISA BANDARMOLOGI & REKOMENDASI TRADING]
- Flow Broker: Saham mana yang diakumulasi Smart Money institusi asing (BK, AK, ZP).
- Peringatan Khusus Scalper: Bahas saham yang didominasi broker MG (Semesta Indovest) dan beri peringatan risiko guyuran.
- Rencana trading konkrit (Target Profit & Stop Loss).

Gunakan bahasa analis profesional Indonesia, kaya data angka, tidak bertele-tele, namun sangat informatif dan mendalam.
`;

  const raw = await callDeepSeek(prompt);

  // Extract sections if possible
  const parts = raw.split(/\[BAGIAN \d:[^\]]+\]/i);
  let macroAnalysis = "";
  let sectorAnalysis = "";
  let brokerAnalysis = "";

  if (parts.length >= 4) {
    macroAnalysis = parts[1].trim();
    sectorAnalysis = parts[2].trim();
    brokerAnalysis = parts[3].trim();
  } else {
    // Split into chunks if tags weren't exact
    const paragraphs = raw.split("\n\n");
    const mid1 = Math.floor(paragraphs.length / 3);
    const mid2 = Math.floor((paragraphs.length * 2) / 3);

    macroAnalysis = paragraphs.slice(0, mid1).join("\n\n").trim();
    sectorAnalysis = paragraphs.slice(mid1, mid2).join("\n\n").trim();
    brokerAnalysis = paragraphs.slice(mid2).join("\n\n").trim();
  }

  return {
    macroAnalysis,
    sectorAnalysis,
    brokerAnalysis,
    fullMarkdown: raw,
  };
}

export async function evaluateTradingSchemeWithAI(params: {
  currentScheme: string;
  winrate: number;
  totalTrades: number;
  recentTrades: Array<{ ticker: string; type: string; pnlPct: number; exitReason: string }>;
  candidateSchemes: Array<{ name: string; description: string; rule: string }>;
}): Promise<{
  recommendedScheme: string;
  rationale: string;
  parameterAdjustment: string;
}> {
  const prompt = `
Anda adalah AI Quant Portfolio Manager. Evaluasi performa sistem trading saham IDX berikut:

Skema Aktif Saat Ini: "${params.currentScheme}"
Performa Simulasi:
- Winrate: ${params.winrate}%
- Total Trade Selesai: ${params.totalTrades}

Log Trade Terakhir:
${params.recentTrades.map(t => `- ${t.ticker}: ${t.type}, PnL: ${t.pnlPct > 0 ? "+" : ""}${t.pnlPct}%, Alasan: ${t.exitReason}`).join("\n")}

Pilihan Skema Tersedia:
${params.candidateSchemes.map(s => `1. ${s.name}: ${s.description} (Rule: ${s.rule})`).join("\n")}

Instruksi:
Tentukan apakah sistem harus mempertahankan skema saat ini atau beralih ke skema lain untuk memaksimalkan winrate dan profit faktor.
Jawab HANYA dalam format JSON valid berikut (tanpa markdown tambahan):
{
  "recommendedScheme": "Nama skema yang dipilih",
  "rationale": "Alasan singkat pemilihan berbasis kondisi pasar saat ini",
  "parameterAdjustment": "Saran penyesuaian parameter (misal trailing stop, toleransi RSI)"
}
`;

  try {
    const raw = await callDeepSeek(prompt, "Anda adalah AI Quant Manager yang hanya mengeluarkan format JSON valid.");
    const cleaned = raw.replace(/```json/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(cleaned);
    return {
      recommendedScheme: parsed.recommendedScheme || params.currentScheme,
      rationale: parsed.rationale || "Skema dipertahankan berdasarkan volatilitas bursa.",
      parameterAdjustment: parsed.parameterAdjustment || "Trailing stop 2%, Target 5%"
    };
  } catch {
    return {
      recommendedScheme: params.currentScheme,
      rationale: "Evaluasi skema mempertahankan pola berjalan dengan proteksi drawdown.",
      parameterAdjustment: "Target Profit 5%, Stop Loss 3%"
    };
  }
}
