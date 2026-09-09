import { NextResponse } from "next/server";
import { getMarketOverview } from "@/lib/market-service";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const data = await getMarketOverview();
  return NextResponse.json(data, {
    headers: { "Cache-Control": "no-store, must-revalidate" },
  });
}
