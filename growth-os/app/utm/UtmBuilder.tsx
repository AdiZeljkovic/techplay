"use client";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useGrowth } from "@/lib/state/client";
import { UTM_MEDIUMS, UTM_SOURCES, buildUtm } from "@/lib/utm";
import { CopyBlock, PageHeader, Section } from "@/components/ui";
import { download, toCSV } from "@/lib/csv";

type C = { id: string; name: string; example: string; landing: string };

export function UtmBuilder({ campaigns }: { campaigns: C[] }) {
  const { state, dispatch } = useGrowth();
  const initial = useSearchParams().get("campaign") ?? "";
  const [v, setV] = useState(() => ({
    url: (initial && campaigns.find((x) => x.example === initial && /^https:\/\/techplay\.gg/.test(x.landing))?.landing) || "https://techplay.gg/calendar",
    utm_source: "instagram", utm_medium: "organic-social", utm_campaign: initial, utm_content: "", utm_term: "",
  }));
  const res = useMemo(() => buildUtm({ ...v, date: new Date().toISOString().slice(0, 10) }), [v]);
  const err = (k: string) => res.errors.filter((e) => e.field === k).map((e) => e.message).join("; ");
  const log = Object.entries(state.fields["utm-log"] || {}).map(([k, url]) => ({ at: k, url })).sort((a, b) => b.at.localeCompare(a.at));
  const field = (k: keyof typeof v, lbl: string, input: React.ReactNode) => (
    <label className="field"><span>{lbl}</span>{input}{err(k) && <span className="field-error">{err(k)}</span>}</label>
  );
  return (
    <div>
      <PageHeader title="UTM Builder" sub="Enforces the TechPlay convention from 30-ANALYTICS §7: lower-case, hyphens, allowed sources and mediums, c01–c71 campaign ids, cross-field rules. UTMs go on links that leave our control only." />
      <div className="grid split-wide">
        <Section title="Build a link">
          <div className="stack">
            {field("url", "Destination URL (techplay.gg, no existing UTMs)", <input className="input mono" value={v.url} onChange={(e) => setV({ ...v, url: e.target.value })} />)}
            <div className="form-grid">
              {field("utm_source", "Source", <>
                <input className="input" list="utm-sources" value={v.utm_source} onChange={(e) => setV({ ...v, utm_source: e.target.value })} />
                <datalist id="utm-sources">{UTM_SOURCES.map((s) => <option key={s} value={s} />)}<option value="creator-" /><option value="partner-" /><option value="pr-" /></datalist>
              </>)}
              {field("utm_medium", "Medium", <select className="select" value={v.utm_medium} onChange={(e) => setV({ ...v, utm_medium: e.target.value })}>{UTM_MEDIUMS.map((m) => <option key={m}>{m}</option>)}</select>)}
              {field("utm_campaign", "Campaign (c01–c71-slug)", <>
                <input className="input mono" list="utm-campaigns" value={v.utm_campaign} onChange={(e) => setV({ ...v, utm_campaign: e.target.value })} placeholder="c06-gta6-countdown" />
                <datalist id="utm-campaigns">{campaigns.filter((c) => c.example).map((c) => <option key={c.id} value={c.example}>{c.id} {c.name}</option>)}</datalist>
              </>)}
              {field("utm_content", "Content (franchise/asset-variant)", <input className="input mono" value={v.utm_content} onChange={(e) => setV({ ...v, utm_content: e.target.value })} placeholder="f01-carousel-a" />)}
              {field("utm_term", "Term (paid and Reddit only)", <input className="input mono" value={v.utm_term} onChange={(e) => setV({ ...v, utm_term: e.target.value })} placeholder="gta6" />)}
            </div>
            {res.url ? (
              <>
                <CopyBlock text={res.url} meta="Valid" />
                <div><button className="btn btn-sm" onClick={() => dispatch({ op: "setField", id: "utm-log", key: new Date().toISOString(), value: res.url! })}>Save to link log</button></div>
              </>
            ) : <p className="field-error">{res.errors.filter((e) => e.field === "url").map((e) => e.message).join("; ") || "Fix the fields marked above."}</p>}
          </div>
        </Section>
        <Section title="Link log" count={log.length} actions={log.length ? <button className="btn btn-ghost btn-sm" onClick={() => download("utm-log.csv", toCSV(log))}>CSV</button> : null}>
          {log.length === 0 ? <p className="muted small">Every URL used in a post should be logged (30-ANALYTICS rule 7).</p> : (
            <ul className="list">{log.slice(0, 50).map((l) => <li key={l.at}><div className="list-main"><div className="small muted mono">{l.at.slice(0, 16).replace("T", " ")}</div><code className="small mono" style={{ wordBreak: "break-all" }}>{l.url}</code></div></li>)}</ul>
          )}
        </Section>
      </div>
    </div>
  );
}
