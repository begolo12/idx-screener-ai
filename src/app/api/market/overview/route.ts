import { NextResponse } from "next/server";
import { getMarketOverview } from "@/lib/market-service";

export async function GET() {
  const data = await getMarketOverview();
  return NextResponse.json(data);
}
