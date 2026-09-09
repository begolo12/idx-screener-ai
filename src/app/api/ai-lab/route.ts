import { NextResponse } from "next/server";
import { getStrategyLabState, runAIStrategyOptimization } from "@/lib/strategy-engine";
import { getSectorTopPicks } from "@/lib/technical-analysis";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const [state, sectorPicks] = await Promise.all([
      getStrategyLabState(),
      getSectorTopPicks(),
    ]);

    return NextResponse.json(
      {
        success: true,
        state,
        sectorPicks,
      },
      {
        headers: { "Cache-Control": "no-store, must-revalidate" },
      }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to load AI strategy lab state" },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    const optimization = await runAIStrategyOptimization();
    const [updatedState, sectorPicks] = await Promise.all([
      getStrategyLabState(),
      getSectorTopPicks(),
    ]);

    return NextResponse.json({
      success: true,
      optimization,
      state: updatedState,
      sectorPicks,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to run AI strategy optimization" },
      { status: 500 }
    );
  }
}
