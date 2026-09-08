import { NextRequest, NextResponse } from "next/server";
import { getStockQuote } from "@/lib/market-service";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ ticker: string }> }
) {
  const { ticker } = await params;
  if (!ticker) {
    return NextResponse.json({ error: "Ticker is required" }, { status: 400 });
  }
  const data = await getStockQuote(ticker);
  return NextResponse.json(data);
}
