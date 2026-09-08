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
        "inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-semibold tabular-nums leading-none tracking-tight",
        {
          "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30": variant === "bull",
          "bg-rose-500/15 text-rose-400 border border-rose-500/30": variant === "bear",
          "bg-sky-500/15 text-sky-400 border border-sky-500/30": variant === "accent",
          "bg-surface-elevated text-slate-300 border border-border": variant === "neutral",
        },
        className
      )}
    >
      {children}
    </span>
  );
}
