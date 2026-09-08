import React from "react";
import clsx from "clsx";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
}

export function Button({ variant = "primary", className, children, ...props }: ButtonProps) {
  return (
    <button
      className={clsx(
        "min-h-[40px] px-4 py-2 rounded-lg font-medium text-sm transition-all duration-150 active:scale-95 flex items-center justify-center gap-2 select-none",
        {
          "bg-blue-600 hover:bg-blue-700 text-white shadow-sm": variant === "primary",
          "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200": variant === "secondary",
          "bg-transparent hover:bg-slate-100 text-slate-600 hover:text-slate-900": variant === "ghost",
          "bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100": variant === "danger",
        },
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
