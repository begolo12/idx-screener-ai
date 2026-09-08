"use client";

import React from "react";
import { TrendingUp, FileText, PieChart, Star, Newspaper } from "lucide-react";

export type NavTab = "screener" | "analysis" | "ailab" | "watchlist" | "news";

interface BottomNavProps {
  currentTab: NavTab;
  onChangeTab: (tab: NavTab) => void;
  watchlistCount: number;
}

interface TabItem {
  id: NavTab;
  label: string;
  icon: typeof TrendingUp;
  count?: number;
}

export function BottomNav({ currentTab, onChangeTab, watchlistCount }: BottomNavProps) {
  const tabs: TabItem[] = [
    { id: "screener", label: "Pasar", icon: TrendingUp },
    { id: "ailab", label: "Portofolio", icon: PieChart },
    { id: "analysis", label: "Laporan", icon: FileText },
    { id: "watchlist", label: "Pantau", icon: Star, count: watchlistCount },
    { id: "news", label: "Berita", icon: Newspaper },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 max-w-md mx-auto safe-bottom shadow-lg">
      <div className="grid grid-cols-5 h-16">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChangeTab(tab.id)}
              className={`flex flex-col items-center justify-center gap-1 transition-colors min-h-[48px] ${
                isActive ? "text-blue-600 font-semibold" : "text-slate-400 hover:text-slate-600"
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? "stroke-[2.25]" : "stroke-[1.75]"}`} />
                {Boolean(tab.count) && (
                  <span className="absolute -top-1 -right-2 bg-blue-600 text-white font-bold text-[9px] w-4 h-4 rounded-full flex items-center justify-center tabular-nums">
                    {tab.count}
                  </span>
                )}
              </div>
              <span className="text-[11px] tracking-tight">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
