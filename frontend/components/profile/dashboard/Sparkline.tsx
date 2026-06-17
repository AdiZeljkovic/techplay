"use client";

/**
 * Tiny inline SVG line chart with a soft gradient fill, drawn from a number
 * series. Renders nothing meaningful for <2 points (caller should guard).
 */
export default function Sparkline({
    data,
    width = 200,
    height = 48,
    color = "var(--accent)",
    className = "",
}: {
    data: number[];
    width?: number;
    height?: number;
    color?: string;
    className?: string;
}) {
    if (!data || data.length < 2) return null;

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const pad = 3;
    const stepX = (width - pad * 2) / (data.length - 1);

    const points = data.map((v, i) => {
        const x = pad + i * stepX;
        const y = pad + (height - pad * 2) * (1 - (v - min) / range);
        return [x, y] as const;
    });

    const line = points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
    const area = `${line} L${points[points.length - 1][0].toFixed(1)},${height} L${points[0][0].toFixed(1)},${height} Z`;
    const id = `spark-${Math.random().toString(36).slice(2, 8)}`;

    return (
        <svg viewBox={`0 0 ${width} ${height}`} className={className} preserveAspectRatio="none" style={{ width: "100%", height }}>
            <defs>
                <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity="0.35" />
                    <stop offset="100%" stopColor={color} stopOpacity="0" />
                </linearGradient>
            </defs>
            <path d={area} fill={`url(#${id})`} />
            <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        </svg>
    );
}
