import type { Metadata } from "next";
import { getContent, getOpportunities, getSocial } from "@/lib/data";
import type { ContentItem } from "@/lib/types";
import { ContentView } from "./ContentView";

export const metadata: Metadata = { title: "Content" };

export default function ContentPage() {
  const trend: ContentItem[] = getOpportunities().keyDates.map((k) => ({
    id: k.id, title: k.event, query: "", intent: "news", audience: "", game: k.game_or_company, platform: "", topic: k.type,
    format: "news + before/during/after coverage", kind: "trend", priority: Number(k.expected_interest_1to5) >= 5 ? "P0" : Number(k.expected_interest_1to5) >= 4 ? "P1" : "P2",
    score: Number(k.expected_interest_1to5) || 0, note: `Before: ${k.publish_before} · During: ${k.publish_during} · After: ${k.publish_after}`, window: k.date_or_window, source: "research/opportunities.json (calendar)",
  }));
  const social: ContentItem[] = getSocial().franchises.map((f) => ({
    id: f.id!, title: f.title, query: "", intent: "social", audience: "", game: "", platform: "", topic: "Recurring franchise", format: "social franchise",
    kind: "social", priority: "P1", score: 0, note: f.body.slice(0, 400), source: "strategy/05-SOCIAL-MEDIA.md",
  }));
  return <ContentView rows={[...getContent(), ...trend, ...social]} />;
}
