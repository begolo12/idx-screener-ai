import React from "react";
import clsx from "clsx";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
}

export function Button({ variant = "primary", className, children, ...props }: ButtonProps) {
  return (
    <button
      className={clsx(
        "min-h-[44px] min-w-[44px] px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 active:scale-95 flex items-center justify-center gap-2 select-none",
        {
          "bg-sky-500 hover:bg-sky-400 text-white shadow-sm shadow-sky-500/25": variant === "primary",
          "bg-surface-elevated hover:bg-slate-800 text-slate-200 border border-border": variant === "secondary",
          "bg-transparent hover:bg-surface text-slate-400 hover:text-slate-100": variant === "ghost",
          "bg-rose-500/15 text-rose-400 border border-rose-500/30 hover:bg-rose-500/25": variant === "danger",
        },
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
