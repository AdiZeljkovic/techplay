"use client";
import type { MetricValue } from "@/lib/state/types";

/** One-series sparkline with a hover value per point. */
export function Sparkline({ values }: { values: MetricValue[] }) {
  if (values.length < 2) return null;
  const pts = [...values].sort((a, b) => a.date.localeCompare(b.date)).slice(-20);
  const ys = pts.map((p) => p.value);
  const min = Math.min(...ys), max = Math.max(...ys);
  const w = 200, h = 34, pad = 4;
  const x = (i: number) => pad + (i * (w - pad * 2)) / (pts.length - 1);
  const y = (v: number) => (max === min ? h / 2 : h - pad - ((v - min) * (h - pad * 2)) / (max - min));
  const d = pts.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join(" ");
  return (
    <svg className="spark" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" role="img" aria-label={`Trend: ${pts.map((p) => `${p.date} ${p.value}`).join(", ")}`}>
      <path d={d} vectorEffect="non-scaling-stroke" />
      {pts.map((p, i) => (
        <g key={p.id}>
          <circle cx={x(i)} cy={y(p.value)} r={i === pts.length - 1 ? 3 : 0} />
          <rect x={x(i) - 6} y={0} width={12} height={h} fill="transparent"><title>{`${p.date}: ${p.value}`}</title></rect>
        </g>
      ))}
    </svg>
  );
}

export function fmtNum(n: number): string {
  return Math.abs(n) >= 1000 ? n.toLocaleString("en-US", { maximumFractionDigits: 0 }) : String(Math.round(n * 100) / 100);
}
