// Server-side access to the synced strategy data. Every page reads through
// here, so swapping the JSON files for a database later touches one module.
import fs from "node:fs";
import path from "node:path";
import type {
  Asset, BacklogItem, Brief, CalendarDay, Campaign, Channel, ContentItem, CopyEntry, DocFile, Experiment, KeyDate, Kpi,
  Meta, Opportunity, PaidCampaign, SeedTask, Section,
} from "./types";

const DIR = path.join(process.cwd(), "data", "generated");
const cache = new Map<string, unknown>();

function load<T>(name: string): T {
  if (process.env.NODE_ENV === "production" && cache.has(name)) return cache.get(name) as T;
  const file = path.join(DIR, `${name}.json`);
  if (!fs.existsSync(file)) {
    throw new Error(`Growth OS data file missing: data/generated/${name}.json. Run \`npm run sync-data\`.`);
  }
  const v = JSON.parse(fs.readFileSync(file, "utf8")) as T;
  cache.set(name, v);
  return v;
}

export const getMeta = () => load<Meta>("meta");
export const getCalendar = () => load<CalendarDay[]>("calendar");
export const getDay = (date: string) => getCalendar().find((d) => d.date === date) ?? null;
export const getCampaigns = () => load<Campaign[]>("campaigns");
export const getCampaign = (id: string) => getCampaigns().find((c) => c.id.toLowerCase() === id.toLowerCase()) ?? null;
export const getBriefs = () => load<Record<string, Brief>>("briefs");
export const getPaid = () => load<PaidCampaign[]>("paid");
export const getExperiments = () => load<Experiment[]>("experiments");
export const getKpis = () => load<Kpi[]>("kpis");
export const getChannels = () => load<Channel[]>("channels");
export const getBacklog = () => load<BacklogItem[]>("backlog");
export const getContent = () => load<ContentItem[]>("content");
export const getOpportunities = () => load<{ items: Opportunity[]; keyDates: KeyDate[] }>("opportunities");
export const getSeo = () => load<{ queries: Record<string, string>[]; plumbing: Record<string, string>[]; titleRewrites: Record<string, string>[]; hubs: Section[]; tools: Record<string, string>[]; discover: Section[] }>("seo");
export const getVideo = () => load<{ ideas: { id: string; title: string; format: string; length: string; source: string; target: string; window: string; date: string | null; cta: string; slot: string }[]; shows: Record<string, string>[]; pilots: Section[]; workflow: Section[] }>("video");
export const getEmail = () => load<{ sends: { id: string; date: string | null; dateLabel: string; product: string; subject: string; preview: string }[]; products: Record<string, string>[]; lifecycle: (Record<string, string> & { body: string; title: string })[]; saveFileSections: Record<string, string>[]; editions: Section[]; placements: Section[] }>("email");
export const getPr = () => load<{ id: string; spine: string; name: string; publishLabel: string; date: string | null; data: string; effort: string; tier: string; owner: string; card: string; pitch: string }[]>("pr");
export const getPartners = () => load<{ messages: Section[]; creatorTemplates: Section[]; types: Section[]; pipeline: { id: string; name: string; kind: string; template: string }[] }>("partners");
export const getCommunity = () => load<{ rituals: Record<string, string>[]; events: Record<string, string>[]; polls: Record<string, string>[]; channels: { category: string; rows: Record<string, string>[] }[]; rhythms: Section[]; redditCalendar: Record<string, string>[]; redditAnswers: Record<string, string>[]; redditRoles: Record<string, string>[]; giveaways: Section[] }>("community");
export const getSocial = () => load<{ franchises: Section[] }>("social");
export const getSeedTasks = () => load<SeedTask[]>("tasks");
export const getAssets = () => load<Asset[]>("assets");
export const getCopy = () => load<CopyEntry[]>("copy");
export const getDocs = () => load<DocFile[]>("docs");
export const getDoc = (slug: string) => getDocs().find((d) => d.slug === slug) ?? null;
