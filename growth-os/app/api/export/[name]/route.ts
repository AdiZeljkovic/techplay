import { getBacklog, getCalendar, getCampaigns, getContent, getCopy, getExperiments, getKpis, getSeedTasks } from "@/lib/data";
import { toCSV } from "@/lib/csv";

const SETS: Record<string, () => object[]> = {
  campaigns: getCampaigns,
  "calendar-items": () => getCalendar().flatMap((d) => d.items.map((i) => ({ ...i, raw: undefined, theme: d.theme, objective: d.objective }))),
  "calendar-days": () => getCalendar().map(({ items, ...d }) => ({ ...d, items: items.length })),
  tasks: getSeedTasks,
  experiments: getExperiments,
  content: getContent,
  copy: getCopy,
  kpis: getKpis,
  backlog: getBacklog,
};

export async function GET(req: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const get = SETS[name];
  if (!get) return new Response(`Unknown dataset. Available: ${Object.keys(SETS).join(", ")}`, { status: 404 });
  const format = new URL(req.url).searchParams.get("format") === "json" ? "json" : "csv";
  const rows = get();
  const body = format === "json" ? JSON.stringify(rows, null, 2) : toCSV(rows);
  return new Response(body, {
    headers: {
      "Content-Type": format === "json" ? "application/json" : "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="growth-os-${name}.${format}"`,
    },
  });
}
