"use client";

import React, { useEffect } from "react";
import { X, RotateCcw, Check } from "lucide-react";
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

const PRICE_PRESETS = [
  { label: "< Rp 500", min: "", max: "500" },
  { label: "500 - 2.000", min: "500", max: "2000" },
  { label: "2.000 - 5.000", min: "2000", max: "5000" },
  { label: "> Rp 5.000", min: "5000", max: "" },
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

  const applyPricePreset = (min: string, max: string) => {
    setMinPrice(min);
    setMaxPrice(max);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex flex-col justify-end">
      <div className="bg-white border-t border-slate-200 rounded-t-3xl p-5 space-y-4 max-h-[85vh] overflow-y-auto w-full max-w-md mx-auto animate-in slide-in-from-bottom duration-200 shadow-2xl">
        <div className="w-10 h-1 bg-slate-300 rounded-full mx-auto mb-1" />

        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Filter Screener Saham</h3>
            <p className="text-xs text-slate-500 mt-0.5">Saring emiten sesuai kriteria Anda</p>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={onReset}
              className="px-2.5 py-1 text-xs text-slate-500 hover:text-blue-600 flex items-center gap-1 min-h-[36px]"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 min-h-[36px] min-w-[36px] flex items-center justify-center text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Price Range Filter */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Rentang Harga Saham (Rp)
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Min (Rp)"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              className="w-1/2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold tabular-nums text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white transition"
            />
            <input
              type="number"
              placeholder="Max (Rp)"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="w-1/2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold tabular-nums text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white transition"
            />
          </div>

          {/* Price Quick Presets */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {PRICE_PRESETS.map((p) => {
              const isSelected = minPrice === p.min && maxPrice === p.max;
              return (
                <button
                  key={p.label}
                  onClick={() => applyPricePreset(p.min, p.max)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition ${
                    isSelected
                      ? "bg-blue-50 border-blue-300 text-blue-700 font-semibold"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Sector Industry */}
        <div className="space-y-2 pt-2">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Sektor Industri
          </label>
          <div className="grid grid-cols-2 gap-2">
            {SECTORS.map((sec) => {
              const isSelected = selectedSector === sec;
              return (
                <button
                  key={sec}
                  onClick={() => onSelectSector(sec)}
                  className={`px-3 py-2 rounded-xl text-xs font-medium border flex items-center justify-between transition ${
                    isSelected
                      ? "bg-blue-600 border-blue-600 text-white font-semibold shadow-xs"
                      : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <span>{sec}</span>
                  {isSelected && <Check className="w-3.5 h-3.5" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="pt-3 border-t border-slate-100 flex gap-2">
          <Button
            variant="secondary"
            onClick={onReset}
            className="w-1/3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 rounded-xl"
          >
            Reset
          </Button>
          <Button
            onClick={onApply}
            className="w-2/3 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl shadow-xs"
          >
            Terapkan Filter
          </Button>
        </div>
      </div>
    </div>
  );
}
