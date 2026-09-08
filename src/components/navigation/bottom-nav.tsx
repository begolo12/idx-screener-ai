"use client";

import React from "react";
import { Filter, Newspaper, Star } from "lucide-react";

interface BottomNavProps {
  currentTab: "screener" | "news" | "watchlist";
  onChangeTab: (tab: "screener" | "news" | "watchlist") => void;
  watchlistCount: number;
}

export function BottomNav({ currentTab, onChangeTab, watchlistCount }: BottomNavProps) {
  const tabs = [
    { id: "screener", label: "Screener", icon: Filter },
    { id: "news", label: "Berita", icon: Newspaper },
    { id: "watchlist", label: "Watchlist", icon: Star, count: watchlistCount },
  ] as const;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-surface/95 backdrop-blur-md border-t border-border max-w-md mx-auto safe-bottom">
      <div className="grid grid-cols-3 h-16">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChangeTab(tab.id)}
              className={`flex flex-col items-center justify-center gap-1 transition-colors min-h-[44px] ${
                isActive ? "text-sky-400 font-semibold" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? "stroke-[2.25]" : "stroke-[1.5]"}`} />
                {Boolean(tab.count) && (
                  <span className="absolute -top-1 -right-2.5 bg-sky-500 text-white font-mono font-bold text-[10px] w-4 h-4 rounded-full flex items-center justify-center tabular-nums">
                    {tab.count}
                  </span>
                )}
              </div>
              <span className="text-[11px]">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
