import type { Metadata } from "next";
import { getKpis } from "@/lib/data";
import { integrationStatus } from "@/lib/integrations";
import type { Kpi } from "@/lib/types";
import { AnalyticsView } from "./AnalyticsView";

export const metadata: Metadata = { title: "Analytics" };

// Metrics the brief asks for that kpis.json does not define as KPIs. Manual only.
const EXTRA: Kpi[] = [
  { id: "M-USERS", name: "Users (GA4, consented only)", category: "traffic", definition: "GA4 active users. EEA traffic without consent is not counted, and the first-party collector cannot count unique visitors (nightly salt).", formula: "GA4 activeUsers for the period", source: "GA4", baseline: { value: "UNKNOWN", date: "2026-09-27" }, targets: {}, owner: "EIC", cadence: "weekly", events: [] },
  { id: "M-PAGEVIEWS", name: "Pageviews", category: "traffic", definition: "Human pageviews from the first-party collector.", formula: "analytics_daily_breakdowns pageviews, bots excluded", source: "First-party collector", baseline: { value: "UNKNOWN", date: "2026-09-27" }, targets: {}, owner: "EIC", cadence: "weekly", events: [] },
];

export default function AnalyticsPage() {
  return <AnalyticsView kpis={[...getKpis(), ...EXTRA]} integrations={integrationStatus()} />;
}
