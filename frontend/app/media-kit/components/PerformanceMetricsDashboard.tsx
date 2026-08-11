"use client";

import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { TrendingUp, Users, Activity, Globe } from "lucide-react";

/**
 * TODO(numbers): every figure below is a placeholder, not a measurement.
 * Nothing in this project produced them — analytics only started recording on
 * 11 August 2026. They are shown to advertisers, so they are the first thing to
 * replace once there is a month of real data behind Pulse and GA.
 *
 * On the colour: the device split is a categorical scale — three identities,
 * no order — so its hues are fixed and assigned in order, never cycled. They
 * were validated against this page's panel surface rather than picked by eye:
 * worst adjacent pair ΔE 28.9 under deuteranopia, 28.1 under tritanopia, 36.0
 * with normal vision. Everything else here is a single series, so it wears a
 * single hue, and no chart carries two y-scales.
 */

/** Fixed categorical order. Never cycled, never reassigned by rank. */
const CATEGORICAL = ["#DC143C", "#3B82F6", "#D97706"] as const;

const KPIS = [
    { icon: Users, label: "Average monthly users", value: "20K+", change: "+285%" },
    { icon: TrendingUp, label: "Growth rate", value: "12.4%", change: "+3.1%" },
    { icon: Activity, label: "Bounce rate", value: "68.3%", change: "-2.1%" },
    { icon: Globe, label: "Page views", value: "36.5K+", change: "+270%" },
];

const deviceData = [
    { name: "Desktop", value: 62 },
    { name: "Mobile", value: 31 },
    { name: "Tablet", value: 7 },
];

const contentPerformance = [
    { category: "Reviews", avgViews: 125 },
    { category: "Tech", avgViews: 180 },
    { category: "News", avgViews: 95 },
    { category: "Opinions", avgViews: 220 },
];

// Hourly shape for roughly 667 daily visitors.
const timeData = [
    { hour: "00:00", visitors: 18 },
    { hour: "04:00", visitors: 12 },
    { hour: "08:00", visitors: 32 },
    { hour: "12:00", visitors: 45 },
    { hour: "16:00", visitors: 62 },
    { hour: "20:00", visitors: 68 },
    { hour: "23:00", visitors: 38 },
];

const AXIS = { fill: "rgba(255,255,255,0.35)", fontSize: 11 };
const GRID = "rgba(255,255,255,0.06)";

/** Tooltip in ink tokens — a value never wears the series colour. */
function ChartTooltip({ active, payload, label, suffix = "" }: {
    active?: boolean;
    payload?: { name?: string; value?: number }[];
    label?: string;
    suffix?: string;
}) {
    if (!active || !payload?.length) return null;

    return (
        <div className="rounded-[var(--radius-inner)] border border-[var(--line-strong)] bg-[var(--surface-2)] px-3 py-2 shadow-lg">
            {label && <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--ink-faint)]">{label}</p>}
            {payload.map((entry) => (
                <p key={entry.name} className="text-[13px] font-semibold text-[var(--ink-hi)] tabular-nums">
                    {entry.name ? entry.name + ": " : ""}{entry.value}{suffix}
                </p>
            ))}
        </div>
    );
}

function ChartPanel({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="rounded-[var(--radius-card)] bg-[var(--surface-1)] border border-[var(--line)] p-5">
            <h3 className="mb-4 font-display text-[13px] font-bold uppercase tracking-wider text-[var(--ink-hi)]">{title}</h3>
            {children}
        </div>
    );
}

export default function PerformanceMetricsDashboard() {
    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {KPIS.map((kpi) => (
                    <div key={kpi.label} className="rounded-[var(--radius-card)] bg-[var(--surface-1)] border border-[var(--line)] p-5">
                        <span className="inline-flex w-10 h-10 rounded-[var(--radius-inner)] bg-[var(--fill-2)] text-[var(--accent)] items-center justify-center mb-3.5">
                            <kpi.icon className="w-[18px] h-[18px]" />
                        </span>
                        <p className="font-display text-[22px] font-black tabular-nums leading-none text-[var(--ink-hi)]">{kpi.value}</p>
                        <p className="mt-1.5 text-[11px] font-bold uppercase tracking-wider text-[var(--ink-faint)]">{kpi.label}</p>
                        <p className="mt-2 text-[12px] font-bold tabular-nums text-[var(--ink-low)]">{kpi.change}</p>
                    </div>
                ))}
            </div>

            <div className="grid lg:grid-cols-2 gap-4">
                <ChartPanel title="Devices">
                    <div className="flex items-center gap-5">
                        <ResponsiveContainer width="55%" height={180}>
                            <PieChart>
                                <Pie
                                    data={deviceData}
                                    dataKey="value"
                                    innerRadius={48}
                                    outerRadius={74}
                                    paddingAngle={2}
                                    stroke="var(--surface-1)"
                                    strokeWidth={2}
                                >
                                    {deviceData.map((entry, i) => (
                                        <Cell key={entry.name} fill={CATEGORICAL[i]} />
                                    ))}
                                </Pie>
                                <Tooltip content={<ChartTooltip suffix="%" />} />
                            </PieChart>
                        </ResponsiveContainer>

                        {/* Three series, so identity is never colour alone. */}
                        <ul className="flex-1 space-y-2.5">
                            {deviceData.map((entry, i) => (
                                <li key={entry.name} className="flex items-center gap-2.5">
                                    <span aria-hidden className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: CATEGORICAL[i] }} />
                                    <span className="flex-1 text-[12.5px] text-[var(--ink-mid)]">{entry.name}</span>
                                    <span className="font-display text-[13px] font-bold tabular-nums text-[var(--ink-hi)]">{entry.value}%</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </ChartPanel>

                <ChartPanel title="Average views by section">
                    <ResponsiveContainer width="100%" height={180}>
                        <BarChart data={contentPerformance} margin={{ top: 4, right: 4, bottom: 0, left: -18 }}>
                            <CartesianGrid stroke={GRID} vertical={false} />
                            <XAxis dataKey="category" tick={AXIS} tickLine={false} axisLine={false} />
                            <YAxis tick={AXIS} tickLine={false} axisLine={false} />
                            <Tooltip cursor={{ fill: "rgba(255,255,255,0.04)" }} content={<ChartTooltip />} />
                            <Bar dataKey="avgViews" name="Avg. views" fill="#DC143C" radius={[4, 4, 0, 0]} maxBarSize={38} />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartPanel>
            </div>

            <ChartPanel title="Visitors through the day">
                <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={timeData} margin={{ top: 4, right: 4, bottom: 0, left: -18 }}>
                        <defs>
                            <linearGradient id="mk-visitors" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#DC143C" stopOpacity={0.28} />
                                <stop offset="100%" stopColor="#DC143C" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid stroke={GRID} vertical={false} />
                        <XAxis dataKey="hour" tick={AXIS} tickLine={false} axisLine={false} />
                        <YAxis tick={AXIS} tickLine={false} axisLine={false} />
                        <Tooltip content={<ChartTooltip />} />
                        <Area
                            type="monotone"
                            dataKey="visitors"
                            name="Visitors"
                            stroke="#DC143C"
                            strokeWidth={2}
                            fill="url(#mk-visitors)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </ChartPanel>
        </div>
    );
}
