// The working state Growth OS adds on top of the (read-only) strategy data.
// Everything a person changes lives here and nowhere else.

export interface CustomTask {
  id: string;
  title: string;
  description: string;
  due: string | null;
  campaign: string;
  channel: string;
  owner: string;
  priority: string;
  createdAt: string;
}

export interface MetricValue { id: string; metric: string; date: string; value: number; note?: string; source?: string }

export interface PaidEntry {
  id: string; campaign: string; date: string; spend: number; impressions: number; clicks: number; registrations: number; note?: string;
}

export interface PipelineRecord {
  id: string; name: string; kind: "partner" | "creator"; contact: string; stage: string; nextStep: string; due: string | null;
  template: string; notes: string; createdAt: string;
}

export interface FeedbackNote { id: string; date: string; source: string; text: string }

export interface GrowthState {
  version: 1;
  updatedAt: string;
  status: Record<string, string>;
  fields: Record<string, Record<string, string>>;
  tasks: CustomTask[];
  metrics: MetricValue[];
  paid: PaidEntry[];
  pipeline: PipelineRecord[];
  feedback: FeedbackNote[];
  settings: { viewAs: string; budgetLevel: string };
}

export type StateOp =
  | { op: "setStatus"; id: string; status: string | null }
  | { op: "setField"; id: string; key: string; value: string }
  | { op: "upsertTask"; task: CustomTask }
  | { op: "deleteTask"; id: string }
  | { op: "addMetric"; value: MetricValue }
  | { op: "addMetrics"; values: MetricValue[] }
  | { op: "deleteMetric"; id: string }
  | { op: "addPaid"; entry: PaidEntry }
  | { op: "deletePaid"; id: string }
  | { op: "upsertPipeline"; record: PipelineRecord }
  | { op: "deletePipeline"; id: string }
  | { op: "addFeedback"; note: FeedbackNote }
  | { op: "deleteFeedback"; id: string }
  | { op: "setSetting"; key: keyof GrowthState["settings"]; value: string }
  | { op: "replace"; state: GrowthState };

export function emptyState(): GrowthState {
  return {
    version: 1,
    updatedAt: new Date(0).toISOString(),
    status: {},
    fields: {},
    tasks: [],
    metrics: [],
    paid: [],
    pipeline: [],
    feedback: [],
    settings: { viewAs: "ALL", budgetLevel: "LEAN" },
  };
}
