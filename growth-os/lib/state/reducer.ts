import { emptyState, type GrowthState, type StateOp } from "./types";

const upsert = <T extends { id: string }>(list: T[], item: T): T[] =>
  list.some((x) => x.id === item.id) ? list.map((x) => (x.id === item.id ? item : x)) : [...list, item];

/** Pure state transition. Server and client both run it, so they never disagree. */
export function applyOp(state: GrowthState, op: StateOp): GrowthState {
  const s: GrowthState = { ...state };
  switch (op.op) {
    case "setStatus": {
      const status = { ...s.status };
      if (op.status === null) delete status[op.id];
      else status[op.id] = op.status;
      s.status = status;
      break;
    }
    case "setField": {
      const cur = { ...(s.fields[op.id] || {}) };
      if (op.value === "") delete cur[op.key];
      else cur[op.key] = op.value;
      s.fields = { ...s.fields, [op.id]: cur };
      break;
    }
    case "upsertTask": s.tasks = upsert(s.tasks, op.task); break;
    case "deleteTask": s.tasks = s.tasks.filter((t) => t.id !== op.id); break;
    case "addMetric": s.metrics = upsert(s.metrics, op.value); break;
    case "addMetrics": s.metrics = op.values.reduce((acc, v) => upsert(acc, v), s.metrics); break;
    case "deleteMetric": s.metrics = s.metrics.filter((m) => m.id !== op.id); break;
    case "addPaid": s.paid = upsert(s.paid, op.entry); break;
    case "deletePaid": s.paid = s.paid.filter((p) => p.id !== op.id); break;
    case "upsertPipeline": s.pipeline = upsert(s.pipeline, op.record); break;
    case "deletePipeline": s.pipeline = s.pipeline.filter((p) => p.id !== op.id); break;
    case "addFeedback": s.feedback = upsert(s.feedback, op.note); break;
    case "deleteFeedback": s.feedback = s.feedback.filter((f) => f.id !== op.id); break;
    case "setSetting": s.settings = { ...s.settings, [op.key]: op.value }; break;
    case "replace": return normaliseState(op.state);
    default: return state;
  }
  s.updatedAt = new Date().toISOString();
  return s;
}

/** Accept any older or partial state file and fill in what is missing. */
export function normaliseState(input: unknown): GrowthState {
  const base = emptyState();
  if (!input || typeof input !== "object") return base;
  const i = input as Partial<GrowthState>;
  return {
    ...base,
    ...i,
    version: 1,
    status: { ...(i.status || {}) },
    fields: { ...(i.fields || {}) },
    tasks: Array.isArray(i.tasks) ? i.tasks : [],
    metrics: Array.isArray(i.metrics) ? i.metrics : [],
    paid: Array.isArray(i.paid) ? i.paid : [],
    pipeline: Array.isArray(i.pipeline) ? i.pipeline : [],
    feedback: Array.isArray(i.feedback) ? i.feedback : [],
    settings: { ...base.settings, ...(i.settings || {}) },
  };
}

const VALID_OPS = new Set(["setStatus", "setField", "upsertTask", "deleteTask", "addMetric", "addMetrics", "deleteMetric", "addPaid", "deletePaid", "upsertPipeline", "deletePipeline", "addFeedback", "deleteFeedback", "setSetting", "replace"]);

export function isStateOp(x: unknown): x is StateOp {
  return Boolean(x && typeof x === "object" && VALID_OPS.has((x as { op?: string }).op || ""));
}
