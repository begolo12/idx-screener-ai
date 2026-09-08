import React from "react";

interface SparklineProps {
  points?: number[];
  isUp: boolean;
  width?: number;
  height?: number;
}

export function Sparkline({ points = [10, 15, 12, 20], isUp, width = 64, height = 24 }: SparklineProps) {
  if (!points || points.length < 2) return null;

  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;

  const coords = points.map((val, idx) => {
    const x = (idx / (points.length - 1)) * (width - 4) + 2;
    const y = height - 4 - ((val - min) / range) * (height - 8);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const pathD = `M ${coords.join(" L ")}`;
  const strokeColor = isUp ? "#10b981" : "#ef4444";

  return (
    <svg width={width} height={height} className="overflow-visible shrink-0 opacity-80">
      <path
        d={pathD}
        fill="none"
        stroke={strokeColor}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
