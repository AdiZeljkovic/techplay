"use client";

interface HypeMeterProps {
    score: number;   // 0-100
    label: string;   // e.g. "RISING" | "PEAKED" | "GROWING"
    size?: number;   // SVG size in px, default 140
}

export default function HypeMeter({ score, label, size = 140 }: HypeMeterProps) {
    const r = 54;
    const cx = size / 2;
    const cy = size / 2;
    const circumference = 2 * Math.PI * r;
    const clampedScore = Math.max(0, Math.min(100, score));
    const dashOffset = circumference * (1 - clampedScore / 100);

    const labelColor =
        label === "RISING" ? "#FC4100" :
        label === "PEAKED" ? "#4ade80" :
        "#60a5fa";

    return (
        <div className="flex flex-col items-center">
            <svg
                width={size}
                height={size}
                viewBox={`0 0 ${size} ${size}`}
                aria-label={`Hype meter: ${clampedScore}%`}
            >
                {/* Background track */}
                <circle
                    cx={cx}
                    cy={cy}
                    r={r}
                    fill="none"
                    stroke="rgba(255,255,255,0.05)"
                    strokeWidth="9"
                />
                {/* Progress arc */}
                <circle
                    cx={cx}
                    cy={cy}
                    r={r}
                    fill="none"
                    stroke="#FC4100"
                    strokeWidth="9"
                    strokeDasharray={circumference}
                    strokeDashoffset={dashOffset}
                    strokeLinecap="round"
                    transform={`rotate(-90 ${cx} ${cy})`}
                    style={{ transition: "stroke-dashoffset 0.6s ease" }}
                />
                {/* Center: score */}
                <text
                    x={cx}
                    y={cy - 8}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="white"
                    fontFamily="inherit"
                    fontSize="26"
                    fontWeight="900"
                >
                    {clampedScore}%
                </text>
                {/* Center: "HYPE LEVEL" */}
                <text
                    x={cx}
                    y={cy + 13}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="rgba(255,255,255,0.3)"
                    fontFamily="inherit"
                    fontSize="8"
                    fontWeight="700"
                    letterSpacing="2"
                >
                    HYPE LEVEL
                </text>
                {/* Center: label */}
                <text
                    x={cx}
                    y={cy + 27}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill={labelColor}
                    fontFamily="inherit"
                    fontSize="9"
                    fontWeight="800"
                    letterSpacing="2"
                >
                    {label}
                </text>
            </svg>
        </div>
    );
}
