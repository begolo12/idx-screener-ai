"use client";

import React from "react";
import { Filter, Newspaper, Star, Send, Cpu } from "lucide-react";

export type NavTab = "screener" | "analysis" | "ailab" | "watchlist" | "news";

interface BottomNavProps {
  currentTab: NavTab;
  onChangeTab: (tab: NavTab) => void;
  watchlistCount: number;
}

interface TabItem {
  id: NavTab;
  label: string;
  icon: typeof Filter;
  count?: number;
}

export function BottomNav({ currentTab, onChangeTab, watchlistCount }: BottomNavProps) {
  const tabs: TabItem[] = [
    { id: "screener", label: "Screener", icon: Filter },
    { id: "analysis", label: "Analisa", icon: Send },
    { id: "ailab", label: "AI Lab", icon: Cpu },
    { id: "watchlist", label: "Pantau", icon: Star, count: watchlistCount },
    { id: "news", label: "Berita", icon: Newspaper },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-surface/95 backdrop-blur-md border-t border-border max-w-md mx-auto safe-bottom">
      <div className="grid grid-cols-5 h-16">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChangeTab(tab.id)}
              className={`flex flex-col items-center justify-center gap-0.5 transition-colors min-h-[44px] ${
                isActive ? "text-cyan-400 font-semibold" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <div className="relative">
                <Icon className={`w-4 h-4 ${isActive ? "stroke-[2.25]" : "stroke-[1.5]"}`} />
                {Boolean(tab.count) && (
                  <span className="absolute -top-1 -right-2 bg-cyan-500 text-white font-mono font-bold text-[9px] w-3.5 h-3.5 rounded-full flex items-center justify-center tabular-nums">
                    {tab.count}
                  </span>
                )}
              </div>
              <span className="text-[10px] tracking-tight">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
