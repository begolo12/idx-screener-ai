import { NextResponse } from "next/server";
import { sendDiscordWebhook } from "@/lib/discord-service";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { webhookUrl } = await request.json();
    if (!webhookUrl) {
      return NextResponse.json({ success: false, error: "Webhook URL diperlukan." }, { status: 400 });
    }

    const res = await sendDiscordWebhook(webhookUrl, {
      content: "🔔 **Tes Koneksi Bot IDX Screener Berhasil!**",
      embeds: [
        {
          title: "✅ Integrasi Discord Terhubung",
          description: "Koneksi webhook berhasil aktif. Sistem otomatis akan mengirimkan ringkasan analisa pasar pada:\n• **Pukul 10:00 WIB** (Sesi 1 - Morning Pulse)\n• **Pukul 15:00 WIB** (Sesi 2 - Penutupan & Outlook Esok)",
          color: 0x10b981,
          footer: { text: "IDX Screener PWA • TradingView & DeepSeek AI" },
          timestamp: new Date().toISOString(),
        },
      ],
    });

    return NextResponse.json(res);
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
