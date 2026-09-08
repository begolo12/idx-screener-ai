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
    <div className="space-y-2 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
      <div className="flex items-center justify-between text-xs">
        <span className="font-bold text-slate-800">Rentang Harga Hari Ini</span>
        <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
          Saat Ini: Rp {current.toLocaleString("id-ID")}
        </span>
      </div>

      {/* Visual Slider Bar */}
      <div className="relative h-2 w-full bg-slate-200 rounded-full overflow-hidden">
        <div
          className="absolute top-0 bottom-0 left-0 bg-blue-600 rounded-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Low and High Labels */}
      <div className="flex justify-between text-[11px] tabular-nums text-slate-500 pt-0.5">
        <div>
          <span className="text-[10px] text-slate-400 block">Terendah (Low):</span>
          <span className="font-semibold text-slate-700">Rp {low.toLocaleString("id-ID")}</span>
        </div>
        <div className="text-right">
          <span className="text-[10px] text-slate-400 block">Tertinggi (High):</span>
          <span className="font-semibold text-slate-700">Rp {high.toLocaleString("id-ID")}</span>
        </div>
      </div>
    </div>
  );
}
