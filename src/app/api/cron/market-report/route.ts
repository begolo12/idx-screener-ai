import { NextResponse } from "next/server";
import { generateAndDispatchMarketReport, getLastReport } from "@/lib/report-generator";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sessionParam = searchParams.get("session");
  const webhookParam = searchParams.get("webhookUrl");

  // Determine session based on param or current hour (WIB / UTC+7)
  let session: "morning" | "closing" = "morning";
  if (sessionParam === "closing" || sessionParam === "afternoon") {
    session = "closing";
  } else if (!sessionParam) {
    const currentHourWIB = (new Date().getUTCHours() + 7) % 24;
    session = currentHourWIB >= 14 ? "closing" : "morning";
  }

  try {
    const report = await generateAndDispatchMarketReport(session, webhookParam || undefined);
    return NextResponse.json({
      success: true,
      report,
    });
  } catch (err: any) {
    console.error("Cron market report failed:", err);
    return NextResponse.json(
      {
        success: false,
        error: err.message || "Failed to generate market report",
        lastReport: getLastReport(),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const session: "morning" | "closing" = body.session === "closing" ? "closing" : "morning";
    const webhookUrl: string | undefined = body.webhookUrl || undefined;

    const report = await generateAndDispatchMarketReport(session, webhookUrl);

    return NextResponse.json({
      success: true,
      report,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to trigger market report" },
      { status: 500 }
    );
  }
}
