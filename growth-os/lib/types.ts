// Shapes of the data written by scripts/sync-data.mjs.

export type Priority = "P0" | "P1" | "P2" | "P3";

export interface CalendarItem {
  id: string;
  date: string;
  channel: string;
  channelLabel: string;
  group: "editorial" | "social" | "video" | "community" | "email" | "outreach" | "paid" | "ops";
  paid: boolean;
  instruction: string;
  copy: string[];
  campaigns: string[];
  franchises: string[];
  devItems: string[];
  links: string[];
  owner: string;
  priority: string;
  sizes: string[];
  raw: string;
}

export interface CalendarDay {
  date: string;
  weekday: string;
  week: string;
  theme: string;
  objective: string;
  audience: string;
  cta: string;
  landing: string;
  creative: string;
  owner: string;
  effort: number;
  priority: string;
  kpi: string;
  tracking: string;
  status: string;
  items: CalendarItem[];
}

export interface Campaign {
  id: string;
  name: string;
  type: string;
  secondary_type?: string;
  priority?: string;
  goal: string;
  kpi: string;
  target: string;
  audience: string[];
  channels: string[];
  start: string;
  end: string;
  key_dates: string[];
  message: string;
  proof?: string;
  copy: Record<string, string>;
  extra_copy: Record<string, unknown>;
  creative: { size: string; concept: string }[];
  cta: string;
  landing_page: string;
  utm_example: string;
  owner: string;
  effort_hours?: string;
  budget_usd: number;
  budget_note?: string;
  tracking_events: string[];
  tracking_notes?: string[];
  follow_up: string;
  dependencies: string[];
  acceptance_criteria?: string[];
  risks?: string;
  delivery_status?: string;
  status: string;
}

export interface Brief { title: string; body: string }

export interface PaidCampaign { id: string; name: string; platform: string; section: string; fields: Record<string, string>; budget: string }

export interface Experiment {
  id: string; name: string; area: string; hypothesis: string; audience: string; change: string; metric: string;
  effort: string; expected_learning: string; duration_days: number; success_threshold: string;
  dependencies: string[]; priority: string; design?: string; status: string;
}

export interface Kpi {
  id: string; name: string; category: string; definition: string; formula: string; source: string;
  baseline: { value: string; date: string; note?: string };
  targets: Record<string, string>; owner: string; cadence: string; events: string[];
}

export interface Channel {
  id: string; name: string; parent: string; priority: string; role: string; audiences: string[]; formats: string[];
  frequency_per_week: number | string; owner: string; voice: string; primary_cta: string; success_metric: string;
  kpi_event: string; workflow: string; do_not: string; weekly_hours_estimate: number;
}

export interface BacklogItem {
  id: string; title: string; problem: string; acceptance_criteria: string[]; files: string[]; priority: string;
  effort: string; hours_estimate: number; growth_impact: string; unlocks: string[]; dependencies: string[];
  owner: string; target_week: string; status: string;
}

export interface ContentItem {
  id: string; title: string; query: string; secondary?: string; intent: string; audience: string; game: string;
  platform: string; topic: string; format: string; kind: string; priority: string; score: number; note?: string;
  lifespan?: string; freshness?: string; competition?: string; conversion?: string; window?: string; source: string;
}

export interface Opportunity {
  id: string; type: string; title: string; source_file: string; total: number; rank: number; note: string; priority: string;
  [k: string]: string | number;
}

export interface KeyDate {
  id: string; date: string | null; date_or_window: string; event: string; game_or_company: string; type: string;
  expected_interest_1to5: string; confidence: string; source_url: string; prepare_before: string;
  publish_before: string; publish_during: string; publish_after: string;
}

export interface SeedTask {
  id: string; title: string; description: string; expected?: string; doneWhen?: string; due: string | null;
  owner: string; time?: string; priority: string; campaign: string; channel: string; source: string;
}

export interface Asset {
  id: string; campaign: string; campaignName: string; channel: string; format: string; dimensions: string;
  headline: string; copy: string; brief: string; due: string | null; owner: string; hasBrief: boolean;
}

export interface CopyEntry {
  id: string; channel: string; text: string; label: string; date: string | null; campaigns: string[]; source: string;
}

export interface Section { id?: string; title: string; body: string; parent?: string }

export interface DocFile { slug: string; file: string; title: string; body: string }

export interface Meta {
  generatedAt: string; docsDir: string; planStart: string; planEnd: string; counts: Record<string, number>;
  copyChannelKeys: Record<string, string>;
}
