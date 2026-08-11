"use client";

import { useState, useMemo } from "react";
import { Calculator, Mail, TrendingUp } from "lucide-react";

/**
 * What a budget buys, at our rates.
 *
 * Restyled onto the panel and ink vocabulary — it was a rounded-3xl card on an
 * accent-to-blue gradient with green, orange and purple result tiles, in a page
 * that is otherwise one accent.
 *
 * The arithmetic is unchanged. Worth being clear about what it is: the CPMs and
 * click-through rates below are our published rates and assumptions, and the
 * conversion rate and order value are the visitor's own. It projects; it does
 * not report. The output says so.
 */

const AD_FORMATS = [
    { id: "leaderboard", name: "Desktop Leaderboard", cpm: 1.0, avgCTR: 2.8 },
    { id: "billboard", name: "Desktop Billboard", cpm: 1.5, avgCTR: 3.2 },
    { id: "rectangle", name: "Medium Rectangle", cpm: 1.2, avgCTR: 2.5 },
    { id: "halfpage", name: "Half Page", cpm: 2.0, avgCTR: 3.5 },
    { id: "native", name: "In-Article Native", cpm: 2.0, avgCTR: 4.2 },
];

const LABEL = "block mb-2 text-[11px] font-bold uppercase tracking-wider text-[var(--ink-faint)]";
const INPUT =
    "w-full h-11 rounded-[var(--radius-inner)] bg-[var(--surface-0)] border border-[var(--line)] " +
    "px-3 text-[13px] text-[var(--ink-hi)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]";

const int = new Intl.NumberFormat("en-US");
const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });

export default function ROICalculator() {
    const [budget, setBudget] = useState(2000);
    const [formatId, setFormatId] = useState(AD_FORMATS[0].id);
    const [conversionRate, setConversionRate] = useState(2.0);
    const [avgOrderValue, setAvgOrderValue] = useState(120);

    const format = AD_FORMATS.find((f) => f.id === formatId) ?? AD_FORMATS[0];

    const result = useMemo(() => {
        const impressions = (budget / format.cpm) * 1000;
        const clicks = impressions * (format.avgCTR / 100);
        const conversions = clicks * (conversionRate / 100);
        const revenue = conversions * avgOrderValue;

        return {
            impressions: Math.round(impressions),
            clicks: Math.round(clicks),
            conversions: Math.round(conversions),
            revenue,
            roi: budget > 0 ? ((revenue - budget) / budget) * 100 : 0,
            costPerClick: clicks > 0 ? budget / clicks : 0,
            costPerConversion: conversions > 0 ? budget / conversions : 0,
        };
    }, [budget, format, conversionRate, avgOrderValue]);

    return (
        <div className="rounded-[var(--radius-card)] bg-[var(--surface-1)] border border-[var(--line)] p-6 md:p-8">
            <div className="mb-6 flex items-start gap-3">
                <span className="inline-flex w-10 h-10 shrink-0 rounded-[var(--radius-inner)] bg-[var(--fill-2)] text-[var(--accent)] items-center justify-center">
                    <Calculator className="w-[18px] h-[18px]" />
                </span>
                <div>
                    <h2 className="font-display text-[15px] font-bold uppercase tracking-[0.12em] text-[var(--ink-hi)]">
                        What your budget buys
                    </h2>
                    <p className="mt-1.5 text-[13px] text-[var(--ink-low)] leading-relaxed">
                        Our rates and average click-through, your conversion rate and order value.
                    </p>
                </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <div>
                        <label htmlFor="roi-budget" className={LABEL}>Campaign budget (EUR)</label>
                        <input
                            id="roi-budget"
                            type="number"
                            min={0}
                            step={100}
                            value={budget}
                            onChange={(e) => setBudget(Math.max(0, Number(e.target.value) || 0))}
                            className={INPUT}
                        />
                        <input
                            aria-label="Campaign budget slider"
                            type="range"
                            min={250}
                            max={20000}
                            step={250}
                            value={Math.min(budget, 20000)}
                            onChange={(e) => setBudget(Number(e.target.value))}
                            className="mt-3 w-full accent-[var(--accent)]"
                        />
                    </div>

                    <div>
                        <label htmlFor="roi-format" className={LABEL}>Ad format</label>
                        <select
                            id="roi-format"
                            value={formatId}
                            onChange={(e) => setFormatId(e.target.value)}
                            className={INPUT}
                        >
                            {AD_FORMATS.map((f) => (
                                <option key={f.id} value={f.id}>
                                    {f.name} — €{f.cpm.toFixed(2)} CPM, {f.avgCTR}% CTR
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="roi-conv" className={LABEL}>Conversion rate (%)</label>
                            <input
                                id="roi-conv"
                                type="number"
                                min={0}
                                step={0.1}
                                value={conversionRate}
                                onChange={(e) => setConversionRate(Math.max(0, Number(e.target.value) || 0))}
                                className={INPUT}
                            />
                        </div>
                        <div>
                            <label htmlFor="roi-aov" className={LABEL}>Avg. order value (EUR)</label>
                            <input
                                id="roi-aov"
                                type="number"
                                min={0}
                                step={10}
                                value={avgOrderValue}
                                onChange={(e) => setAvgOrderValue(Math.max(0, Number(e.target.value) || 0))}
                                className={INPUT}
                            />
                        </div>
                    </div>
                </div>

                <div className="rounded-[var(--radius-card)] bg-[var(--surface-2)] border border-[var(--line)] p-5">
                    <div className="flex items-baseline justify-between gap-4 pb-4 border-b border-[var(--line)]">
                        <span className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-[var(--ink-faint)]">
                            <TrendingUp className="w-3.5 h-3.5 text-[var(--accent)]" />
                            Projected return
                        </span>
                        <span className="font-display text-[26px] font-black tabular-nums leading-none text-[var(--accent)]">
                            {result.roi > 0 ? "+" : ""}{Math.round(result.roi)}%
                        </span>
                    </div>

                    <dl>
                        {[
                            ["Impressions", int.format(result.impressions)],
                            ["Clicks", int.format(result.clicks)],
                            ["Conversions", int.format(result.conversions)],
                            ["Revenue", money.format(result.revenue)],
                            ["Cost per click", `€${result.costPerClick.toFixed(2)}`],
                            ["Cost per conversion", `€${result.costPerConversion.toFixed(2)}`],
                        ].map(([label, value]) => (
                            <div key={label} className="flex items-baseline justify-between gap-4 border-b border-[var(--line)] py-2.5 last:border-0">
                                <dt className="text-[12.5px] text-[var(--ink-low)]">{label}</dt>
                                <dd className="font-display text-[14px] font-bold tabular-nums text-[var(--ink-hi)]">{value}</dd>
                            </div>
                        ))}
                    </dl>

                    <p className="mt-4 text-[11px] text-[var(--ink-faint)] leading-snug">
                        A projection from our published rates and your own figures — not a measured result or a
                        guarantee.
                    </p>

                    <a
                        href="mailto:marketing@techplay.gg?subject=Campaign%20enquiry"
                        className="btn-command mt-5 inline-flex w-full items-center justify-center gap-2 h-11 px-6 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-display text-[13px] font-bold uppercase tracking-wider transition-colors duration-300"
                    >
                        <Mail className="w-4 h-4" />
                        Start a campaign
                    </a>
                </div>
            </div>
        </div>
    );
}
