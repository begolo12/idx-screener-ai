import React from "react";
import clsx from "clsx";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "bull" | "bear" | "neutral" | "accent";
  className?: string;
}

export function Badge({ children, variant = "neutral", className }: BadgeProps) {
  return (
    <span
      className={clsx(
        "inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold tabular-nums leading-none tracking-tight",
        {
          "bg-emerald-50 text-emerald-700 border border-emerald-200": variant === "bull",
          "bg-rose-50 text-rose-700 border border-rose-200": variant === "bear",
          "bg-blue-50 text-blue-700 border border-blue-200": variant === "accent",
          "bg-slate-100 text-slate-700 border border-slate-200": variant === "neutral",
        },
        className
      )}
    >
      {children}
    </span>
  );
}
