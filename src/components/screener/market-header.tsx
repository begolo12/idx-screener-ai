"use client";

import React from "react";
import { Activity, WifiOff } from "lucide-react";

interface HeaderProps {
  overview: {
    ihsg?: { value: string; change: string; changePct: string };
    foreignFlow?: { netBuySell: string };
    marketStatus?: string;
    updatedAt?: string;
    isFallback?: boolean;
  } | null;
}

export function MarketHeader({ overview }: HeaderProps) {
  const ihsg = overview?.ihsg || { value: "7,310.20", change: "+15.40", changePct: "+0.21%" };
  const isUp = !ihsg.changePct.startsWith("-");

  return (
    <div className="bg-surface/95 backdrop-blur-md border-b border-border p-4 sticky top-0 z-30 w-full">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">IHSG (IDX)</span>
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] text-slate-500 font-mono">
              {overview?.marketStatus || "SESI AKTIF"}
            </span>
          </div>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-xl font-bold font-mono tabular-nums text-slate-100">{ihsg.value}</span>
            <span className={`text-xs font-mono font-bold tabular-nums ${isUp ? "text-emerald-400" : "text-rose-400"}`}>
              {ihsg.change} ({ihsg.changePct})
            </span>
          </div>
        </div>

        <div className="text-right">
          <div className="flex items-center justify-end gap-1 text-[11px] text-slate-400">
            <Activity className="w-3.5 h-3.5 text-sky-400" />
            <span>Arus Asing</span>
          </div>
          <p className="text-xs font-mono font-medium text-slate-200 mt-0.5">
            {overview?.foreignFlow?.netBuySell || "+Rp 142.5 M"}
          </p>
          {overview?.isFallback && (
            <div className="flex items-center justify-end gap-1 text-[10px] text-amber-400/90 font-mono mt-0.5">
              <WifiOff className="w-2.5 h-2.5" />
              <span>Offline Cache</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
