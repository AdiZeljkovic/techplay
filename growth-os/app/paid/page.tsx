import type { Metadata } from "next";
import { getCampaigns, getDoc, getPaid } from "@/lib/data";
import { sectionsOf } from "@/lib/md";
import { PaidView } from "./PaidView";

export const metadata: Metadata = { title: "Paid media" };

export default function PaidPage() {
  const doc = getDoc("26-PAID-MEDIA")?.body ?? "";
  const s2 = sectionsOf(doc, 2);
  const budgets = s2.find((s) => /Budget plans/.test(s.title))?.body ?? "";
  const gates = s2.find((s) => /^2\. Gates/.test(s.title))?.body ?? "";
  const notWorth = s2.find((s) => /not worth/.test(s.title))?.body ?? "";
  const parents = Object.fromEntries(getCampaigns().filter((c) => ["C56", "C57", "C58"].includes(c.id)).map((c) => [c.id, { name: c.name, start: c.start, end: c.end, delivery: c.delivery_status || "" }]));
  return <PaidView campaigns={getPaid()} parents={parents} budgets={budgets} gates={gates} notWorth={notWorth} />;
}
