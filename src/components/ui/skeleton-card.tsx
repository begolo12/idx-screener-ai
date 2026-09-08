import React from "react";

interface SkeletonProps {
  type?: "stock" | "news" | "header";
  count?: number;
}

export function SkeletonCard({ type = "stock", count = 4 }: SkeletonProps) {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="p-4 bg-surface rounded-xl border border-border/60 flex items-center justify-between"
        >
          {type === "stock" ? (
            <>
              <div className="space-y-2 flex-1 pr-4">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-16 bg-slate-800 rounded" />
                  <div className="h-3.5 w-14 bg-slate-800/60 rounded" />
                </div>
                <div className="h-3 w-36 bg-slate-800/40 rounded" />
                <div className="h-2.5 w-24 bg-slate-800/30 rounded" />
              </div>
              <div className="space-y-2 text-right">
                <div className="h-4 w-20 bg-slate-800 rounded ml-auto" />
                <div className="h-4 w-16 bg-slate-800/60 rounded ml-auto" />
              </div>
            </>
          ) : (
            <div className="w-full space-y-2.5">
              <div className="flex justify-between">
                <div className="h-3 w-20 bg-slate-800 rounded" />
                <div className="h-3 w-16 bg-slate-800/60 rounded" />
              </div>
              <div className="h-4 w-full bg-slate-800 rounded" />
              <div className="h-4 w-3/4 bg-slate-800/60 rounded" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
