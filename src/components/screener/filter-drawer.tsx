"use client";

import React, { useEffect } from "react";
import { X, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSector: string;
  onSelectSector: (sec: string) => void;
  minPrice: string;
  setMinPrice: (val: string) => void;
  maxPrice: string;
  setMaxPrice: (val: string) => void;
  onApply: () => void;
  onReset: () => void;
}

const SECTORS = [
  "Semua",
  "Keuangan",
  "Energi",
  "Infrastruktur",
  "Konsumer",
  "Teknologi",
  "Kesehatan",
  "Industri",
];

export function FilterDrawer({
  isOpen,
  onClose,
  selectedSector,
  onSelectSector,
  minPrice,
  setMinPrice,
  maxPrice,
  setMaxPrice,
  onApply,
  onReset,
}: FilterDrawerProps) {
  // Prevent background scrolling when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex flex-col justify-end">
      <div className="bg-surface border-t border-border rounded-t-2xl p-5 space-y-4 max-h-[85vh] overflow-y-auto w-full max-w-md mx-auto animate-in slide-in-from-bottom duration-200">
        <div className="w-12 h-1.5 bg-slate-700 rounded-full mx-auto mb-1" />

        <div className="flex items-center justify-between pb-2 border-b border-border">
          <h3 className="font-bold text-slate-100 text-base">Filter Saham</h3>
          <div className="flex items-center gap-1">
            <button
              onClick={onReset}
              className="px-2.5 py-1 text-xs text-slate-400 hover:text-sky-400 flex items-center gap-1 min-h-[44px]"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
            <button onClick={onClose} className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-400">Rentang Harga (Rp)</label>
          <div className="flex gap-2 mt-1.5">
            <input
              type="number"
              placeholder="Harga Minimum"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              className="w-1/2 p-3 rounded-xl bg-surface-elevated border border-border text-sm font-mono tabular-nums text-slate-100 focus:outline-none focus:border-sky-500"
            />
            <input
              type="number"
              placeholder="Harga Maksimum"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="w-1/2 p-3 rounded-xl bg-surface-elevated border border-border text-sm font-mono tabular-nums text-slate-100 focus:outline-none focus:border-sky-500"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-400">Sektor Industri</label>
          <div className="flex flex-wrap gap-2 mt-2">
            {SECTORS.map((sec) => (
              <button
                key={sec}
                onClick={() => onSelectSector(sec)}
                className={`px-3.5 py-2 min-h-[40px] rounded-xl text-xs font-medium transition ${
                  selectedSector === sec
                    ? "bg-sky-500 text-white font-semibold shadow-sm shadow-sky-500/25"
                    : "bg-surface-elevated border border-border text-slate-300 hover:border-slate-600"
                }`}
              >
                {sec}
              </button>
            ))}
          </div>
        </div>

        <div className="pt-2">
          <Button onClick={onApply} className="w-full">
            Terapkan Filter
          </Button>
        </div>
      </div>
    </div>
  );
}
