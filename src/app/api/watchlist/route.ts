import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(req: NextRequest) {
  const userId = req.headers.get("x-user-id") || "default_user";
  const sql = getDb();
  if (!sql) {
    return NextResponse.json({ items: [], fallback: true });
  }
  try {
    const rows = await sql`SELECT ticker, created_at FROM watchlists WHERE user_id = ${userId} ORDER BY created_at DESC`;
    return NextResponse.json({ items: rows.map(r => r.ticker) });
  } catch (err) {
    return NextResponse.json({ items: [], fallback: true });
  }
}

export async function POST(req: NextRequest) {
  const userId = req.headers.get("x-user-id") || "default_user";
  const body = await req.json().catch(() => ({}));
  const ticker = body.ticker?.toUpperCase();

  if (!ticker) {
    return NextResponse.json({ error: "Invalid ticker" }, { status: 400 });
  }

  const sql = getDb();
  if (!sql) {
    return NextResponse.json({ success: true, fallback: true });
  }

  try {
    await sql`
      INSERT INTO watchlists (user_id, ticker)
      VALUES (${userId}, ${ticker})
      ON CONFLICT (user_id, ticker) DO NOTHING
    `;
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ success: true, fallback: true });
  }
}

export async function DELETE(req: NextRequest) {
  const userId = req.headers.get("x-user-id") || "default_user";
  const { searchParams } = new URL(req.url);
  const ticker = searchParams.get("ticker")?.toUpperCase();

  if (!ticker) {
    return NextResponse.json({ error: "Invalid ticker" }, { status: 400 });
  }

  const sql = getDb();
  if (!sql) {
    return NextResponse.json({ success: true, fallback: true });
  }

  try {
    await sql`DELETE FROM watchlists WHERE user_id = ${userId} AND ticker = ${ticker}`;
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ success: true, fallback: true });
  }
}
