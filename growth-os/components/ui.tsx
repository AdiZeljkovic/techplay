"use client";
import Link from "next/link";
import { useState } from "react";
import { Check, Copy, ExternalLink } from "lucide-react";
import { useToast } from "./Toast";
import { label, tone } from "@/lib/status";

export function cx(...xs: (string | false | null | undefined)[]) {
  return xs.filter(Boolean).join(" ");
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for http:// on a LAN address, where the Clipboard API is blocked.
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    ta.remove();
    return ok;
  }
}

/** Copies only the public-facing text passed in — never labels or metadata. */
export function CopyButton({ text, label: lbl = "Copy", small }: { text: string; label?: string; small?: boolean }) {
  const toast = useToast();
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className={cx("btn btn-copy", small && "btn-sm", done && "is-done")}
      onClick={async () => {
        const ok = await copyText(text);
        toast(ok ? `Copied ${text.length} characters` : "Copy failed: select the text manually", ok ? "good" : "bad");
        if (ok) { setDone(true); setTimeout(() => setDone(false), 1400); }
      }}
      aria-label={`${lbl} text to clipboard`}
    >
      {done ? <Check size={14} /> : <Copy size={14} />}
      <span>{done ? "Copied" : lbl}</span>
    </button>
  );
}

export function CopyBlock({ text, meta }: { text: string; meta?: string }) {
  return (
    <div className="copy-block">
      <pre className="copy-text">{text}</pre>
      <div className="copy-actions">
        {meta && <span className="muted small">{meta}</span>}
        <span className="muted small">{text.length} chars</span>
        <CopyButton text={text} small />
      </div>
    </div>
  );
}

export function Chip({ children, tone: t = "neutral", title }: { children: React.ReactNode; tone?: string; title?: string }) {
  return <span className={`chip chip-${t}`} title={title}>{children}</span>;
}

export function StatusChip({ status }: { status: string }) {
  return <Chip tone={tone(status)}>{label(status)}</Chip>;
}

export function PriorityChip({ p }: { p: string }) {
  return <span className={`prio prio-${p.toLowerCase()}`} title={`Priority ${p}`}>{p}</span>;
}

export function OwnerChip({ owner }: { owner: string }) {
  return <span className="owner" title="Owner">{owner}</span>;
}

export function StatusSelect({ value, options, onChange, ariaLabel }: { value: string; options: readonly string[]; onChange: (v: string) => void; ariaLabel?: string }) {
  return (
    <select className={`status-select st-${tone(value)}`} value={value} onChange={(e) => onChange(e.target.value)} aria-label={ariaLabel || "Status"}>
      {options.map((o) => <option key={o} value={o}>{label(o)}</option>)}
    </select>
  );
}

export function ExtLink({ href, children }: { href: string; children?: React.ReactNode }) {
  return (
    <a className="ext" href={href} target="_blank" rel="noreferrer noopener">
      {children ?? href.replace(/^https?:\/\//, "").replace(/\?.*$/, "")}
      <ExternalLink size={12} />
    </a>
  );
}

export function CampaignLink({ id }: { id: string }) {
  const base = id.slice(0, 3);
  return <Link className="chip chip-link" href={`/campaigns/${base}`} title="View campaign">{id}</Link>;
}

export function Empty({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="empty">
      <p className="empty-title">{title}</p>
      {hint && <p className="muted small">{hint}</p>}
    </div>
  );
}

export function PageHeader({ title, sub, actions }: { title: string; sub?: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <header className="page-head">
      <div>
        <h1>{title}</h1>
        {sub && <p className="muted">{sub}</p>}
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </header>
  );
}

export function Section({ title, count, children, actions, id }: { title: string; count?: number | string; children: React.ReactNode; actions?: React.ReactNode; id?: string }) {
  return (
    <section className="panel" id={id}>
      <div className="panel-head">
        <h2>{title}{count !== undefined && <span className="count">{count}</span>}</h2>
        {actions}
      </div>
      <div className="panel-body">{children}</div>
    </section>
  );
}

export function Tabs<T extends string>({ tabs, value, onChange }: { tabs: { id: T; label: string; count?: number }[]; value: T; onChange: (t: T) => void }) {
  return (
    <div className="tabs" role="tablist">
      {tabs.map((t) => (
        <button key={t.id} role="tab" aria-selected={t.id === value} className={cx("tab", t.id === value && "is-active")} onClick={() => onChange(t.id)}>
          {t.label}{t.count !== undefined && <span className="count">{t.count}</span>}
        </button>
      ))}
    </div>
  );
}

export function Progress({ done, total, label: lbl }: { done: number; total: number; label?: string }) {
  const pct = total ? Math.round((done / total) * 100) : 0;
  return (
    <div className="progress" title={`${done} of ${total}`}>
      <div className="progress-top"><span>{lbl}</span><span className="num">{done}/{total} · {pct}%</span></div>
      <div className="progress-bar"><div style={{ width: `${pct}%` }} /></div>
    </div>
  );
}
