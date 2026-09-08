"use client";

import React from "react";
import { SlidersHorizontal } from "lucide-react";

interface FilterChipsProps {
  activeSort: string;
  onSelectSort: (sort: string) => void;
  onOpenDrawer: () => void;
  hasCustomFilter: boolean;
}

export function FilterChips({ activeSort, onSelectSort, onOpenDrawer, hasCustomFilter }: FilterChipsProps) {
  const chips = [
    { id: "gainers", label: "Top Gainers" },
    { id: "losers", label: "Top Losers" },
    { id: "volume", label: "Top Volume" },
  ];

  return (
    <div className="flex items-center gap-2 overflow-x-auto px-4 py-2.5 bg-background no-scrollbar border-b border-border/40">
      <button
        onClick={onOpenDrawer}
        className={`flex items-center gap-1.5 px-3 min-h-[44px] rounded-xl border text-xs font-medium transition active:scale-95 shrink-0 ${
          hasCustomFilter
            ? "border-sky-500 bg-sky-500/15 text-sky-300"
            : "border-border bg-surface text-slate-300 hover:border-slate-600"
        }`}
      >
        <SlidersHorizontal className="w-4 h-4 text-sky-400" />
        <span>Filter {hasCustomFilter ? "(Aktif)" : ""}</span>
      </button>

      {chips.map((c) => {
        const isActive = activeSort === c.id;
        return (
          <button
            key={c.id}
            onClick={() => onSelectSort(c.id)}
            className={`px-4 min-h-[44px] rounded-xl text-xs font-semibold shrink-0 transition-colors ${
              isActive
                ? "bg-sky-500 text-white shadow-sm shadow-sky-500/25"
                : "bg-surface border border-border text-slate-300 hover:border-slate-600"
            }`}
          >
            {c.label}
          </button>
        );
      })}
    </div>
  );
}
