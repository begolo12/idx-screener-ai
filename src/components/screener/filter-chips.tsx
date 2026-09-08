"use client";

import React from "react";
import { SlidersHorizontal, TrendingUp, TrendingDown, BarChart2, DollarSign } from "lucide-react";

interface FilterChipsProps {
  activeSort: string;
  onSelectSort: (sort: string) => void;
  onOpenDrawer: () => void;
  hasCustomFilter: boolean;
  totalCount?: number;
}

export function FilterChips({
  activeSort,
  onSelectSort,
  onOpenDrawer,
  hasCustomFilter,
}: FilterChipsProps) {
  const chips = [
    { id: "gainers", label: "Top Gainers", icon: TrendingUp, activeColor: "bg-emerald-600 text-white" },
    { id: "losers", label: "Top Losers", icon: TrendingDown, activeColor: "bg-rose-600 text-white" },
    { id: "volume", label: "Top Volume", icon: BarChart2, activeColor: "bg-blue-600 text-white" },
    { id: "turnover", label: "Top Turnover", icon: DollarSign, activeColor: "bg-indigo-600 text-white" },
  ];

  return (
    <div className="flex items-center gap-2 overflow-x-auto px-4 py-2.5 bg-white no-scrollbar border-b border-slate-200 sticky top-0 z-10">
      <button
        onClick={onOpenDrawer}
        className={`flex items-center gap-1.5 px-3 min-h-[34px] rounded-full border text-xs font-semibold transition active:scale-95 shrink-0 ${
          hasCustomFilter
            ? "border-blue-600 bg-blue-50 text-blue-700 font-bold"
            : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
        }`}
      >
        <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600" />
        <span>Filter {hasCustomFilter ? "• Aktif" : ""}</span>
      </button>

      {chips.map((c) => {
        const isActive = activeSort === c.id;
        const Icon = c.icon;
        return (
          <button
            key={c.id}
            onClick={() => onSelectSort(c.id)}
            className={`flex items-center gap-1.5 px-3.5 min-h-[34px] rounded-full text-xs font-semibold shrink-0 transition-colors ${
              isActive
                ? `${c.activeColor} shadow-xs`
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            <span>{c.label}</span>
          </button>
        );
      })}
    </div>
  );
}
