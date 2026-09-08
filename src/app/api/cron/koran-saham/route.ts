import { NextResponse } from "next/server";
import { generateAndPublishKoranSaham } from "@/lib/koran-service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const webhookUrl = searchParams.get("webhookUrl") || undefined;

  try {
    const koran = await generateAndPublishKoranSaham(webhookUrl);
    return NextResponse.json({ success: true, koran });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to publish Koran Harian Saham" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const webhookUrl = body.webhookUrl || undefined;

    const koran = await generateAndPublishKoranSaham(webhookUrl);
    return NextResponse.json({ success: true, koran });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to publish Koran Harian Saham" },
      { status: 500 }
    );
  }
}
