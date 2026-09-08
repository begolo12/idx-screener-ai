import React from "react";

interface RangeBarProps {
  current: number;
  low: number;
  high: number;
}

export function PriceRangeBar({ current, low, high }: RangeBarProps) {
  const range = high - low || 1;
  const percentage = Math.min(100, Math.max(0, ((current - low) / range) * 100));

  return (
    <div className="space-y-1.5 p-3 rounded-xl bg-surface-elevated/60 border border-border">
      <div className="flex justify-between text-[11px] font-mono tabular-nums text-slate-400">
        <span>Low: Rp {low.toLocaleString("id-ID")}</span>
        <span className="text-slate-200 font-semibold">Rentang Sesi Harian</span>
        <span>High: Rp {high.toLocaleString("id-ID")}</span>
      </div>
      <div className="relative h-2 w-full bg-surface rounded-full overflow-hidden border border-border/80">
        <div
          className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-rose-500 via-amber-400 to-emerald-400 rounded-full"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
