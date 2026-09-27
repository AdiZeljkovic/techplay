import type { Metadata } from "next";
import { getPartners } from "@/lib/data";
import { PartnersView } from "./PartnersView";

export const metadata: Metadata = { title: "Partnerships & creators" };

export default function PartnershipsPage() {
  const p = getPartners();
  const templates = Object.fromEntries([...p.messages, ...p.creatorTemplates].map((m) => [m.id!, { title: m.title, body: m.body }]));
  return <PartnersView seeds={p.pipeline} templates={templates} types={p.types} />;
}
