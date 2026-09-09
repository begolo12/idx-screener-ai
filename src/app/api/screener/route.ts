import { NextRequest, NextResponse } from "next/server";
import { getAllStocks } from "@/lib/market-service";
import { filterAndSortStocks } from "@/lib/market-transform.mjs";
import { paginateItems } from "@/lib/pagination.mjs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sort = searchParams.get("sort") || "gainers";
  const sector = searchParams.get("sector");
  const minPrice = searchParams.get("minPrice") ? Number(searchParams.get("minPrice")) : undefined;
  const maxPrice = searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : undefined;
  const page = Number(searchParams.get("page") || "1");
  const limit = Number(searchParams.get("limit") || "15");

  const allStocks = await getAllStocks();
  let filtered = filterAndSortStocks(allStocks, { sort, minPrice, maxPrice });

  if (sector && sector !== "Semua") {
    filtered = filtered.filter((s: any) => s.sector?.toLowerCase() === sector.toLowerCase());
  }

  const paginated = paginateItems(filtered, page, limit);
  return NextResponse.json(paginated, {
    headers: { "Cache-Control": "no-store, must-revalidate" },
  });
}
