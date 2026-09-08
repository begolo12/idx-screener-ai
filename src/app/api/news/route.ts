import { NextRequest, NextResponse } from "next/server";
import { getMarketNews } from "@/lib/market-service";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || undefined;
  const data = await getMarketNews(q);
  return NextResponse.json(data);
}
