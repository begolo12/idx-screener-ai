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
  systemPrompt = "Anda adalah analis riset ekuitas senior Bursa Efek Indonesia (IDX). Berikan analisa pasar saham yang padat, presisi, berbasis data teknikal dan makro, tanpa basa-basi."
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
        max_tokens: 1200,
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
  newsHeadlines: string[];
}): Promise<string> {
  const sessionTitle = data.session === "morning"
    ? "SESI 1 - MORNING PULSE & BREAKOUT (10:00 WIB)"
    : "SESI 2 - MARKET WRAP & CLOSING OUTLOOK (15:00 WIB)";

  const prompt = `
Buatkan laporan analisa pasar saham Indonesia (IDX) untuk publikasi Telegram/Discord:
Target Sesi: ${sessionTitle}
Waktu: ${new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}

Data Pasar Riil (TradingView):
- IHSG: ${data.ihsg.value} (${data.ihsg.change}, ${data.ihsg.changePct})
- Arus Asing: ${data.foreignFlow}
- Breadth: ${data.advancers} Menguat, ${data.decliners} Melemah

Top Saham Pendorong & Penggerak Volume:
${data.topGainers.map(s => `- ${s.ticker}: Rp ${s.price} (${s.changePct > 0 ? "+" : ""}${s.changePct}%), RSI: ${s.rsi}, Sinyal: ${s.signals.join(", ") || "Netral"}`).join("\n")}

Turnover Tertinggi:
${data.topVolume.map(s => `- ${s.ticker}: Rp ${s.price}, Nilai Transaksi: ${s.turnoverFormatted}`).join("\n")}

Katalis Berita Terkini:
${data.newsHeadlines.slice(0, 3).map(n => `- ${n}`).join("\n")}

Format Laporan:
1. Ringkasan Sentimen IHSG & Arah Arus Dana.
2. Saham Sorotan & Analisa Level Teknikal (Support / Resistance / Stoploss).
3. Strategi Aksi Trading untuk sisa sesi atau esok hari.
Gunakan gaya bahasa analis sekuritas profesional, ringkas, padat angka, dan mudah dibaca para trader.
`;

  return callDeepSeek(prompt);
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
