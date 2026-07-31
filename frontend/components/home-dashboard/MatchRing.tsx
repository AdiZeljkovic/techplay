"use client";

/** Circular match badge — the percentage sits inside a partially filled ring. */
export default function MatchRing({ percent, size = 44 }: { percent: number; size?: number }) {
    const stroke = 3;
    const r = size / 2 - stroke;
    const circumference = 2 * Math.PI * r;
    const dash = (Math.min(100, Math.max(0, percent)) / 100) * circumference;

    return (
        <div className="relative shrink-0" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="-rotate-90">
                <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} />
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={r}
                    fill="none"
                    stroke="#34d399"
                    strokeWidth={stroke}
                    strokeLinecap="round"
                    strokeDasharray={`${dash} ${circumference - dash}`}
                />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-[11px] font-black text-emerald-400 tabular-nums">
                {percent}%
            </span>
        </div>
    );
}
