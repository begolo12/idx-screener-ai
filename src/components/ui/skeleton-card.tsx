import React from "react";

interface SkeletonProps {
  type?: "stock" | "news" | "header";
  count?: number;
}

export function SkeletonCard({ type = "stock", count = 4 }: SkeletonProps) {
  return (
    <div className="space-y-2.5 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="p-3.5 bg-white rounded-2xl border border-slate-200/80 flex items-center justify-between"
        >
          {type === "stock" ? (
            <>
              <div className="flex items-center gap-3 flex-1">
                <div className="w-10 h-10 rounded-xl bg-slate-200" />
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-16 bg-slate-200 rounded" />
                    <div className="h-3.5 w-14 bg-slate-100 rounded" />
                  </div>
                  <div className="h-3 w-32 bg-slate-100 rounded" />
                </div>
              </div>
              <div className="space-y-1.5 text-right">
                <div className="h-4 w-20 bg-slate-200 rounded ml-auto" />
                <div className="h-4 w-14 bg-slate-100 rounded ml-auto" />
              </div>
            </>
          ) : (
            <div className="w-full space-y-2">
              <div className="flex justify-between">
                <div className="h-3 w-20 bg-slate-200 rounded" />
                <div className="h-3 w-16 bg-slate-100 rounded" />
              </div>
              <div className="h-4 w-full bg-slate-200 rounded" />
              <div className="h-3 w-3/4 bg-slate-100 rounded" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
