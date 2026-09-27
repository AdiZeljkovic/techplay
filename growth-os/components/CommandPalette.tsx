"use client";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";
import { useGrowth } from "@/lib/state/client";
import { NAV } from "./nav";
import type { SearchHit } from "@/lib/search";

export function CommandPalette({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [idx, setIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const { state } = useGrowth();

  useEffect(() => { inputRef.current?.focus(); }, []);
  useEffect(() => {
    const needle = q.trim();
    if (needle.length < 2) return;
    const ctrl = new AbortController();
    const t = setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(needle)}`, { signal: ctrl.signal })
        .then((r) => r.json())
        .then((d: { hits: SearchHit[] }) => { setHits(d.hits); setIdx(0); })
        .catch(() => {});
    }, 120);
    return () => { clearTimeout(t); ctrl.abort(); };
  }, [q]);

  const pages = useMemo(() => {
    const n = q.trim().toLowerCase();
    return NAV.flatMap((g) => g.items).filter((i) => n && i.label.toLowerCase().includes(n)).map((i) => ({ kind: "Page", id: i.href, title: i.label, sub: "", href: i.href }));
  }, [q]);
  const myTasks = useMemo(() => {
    const n = q.trim().toLowerCase();
    if (n.length < 2) return [];
    return state.tasks.filter((t) => `${t.title} ${t.description}`.toLowerCase().includes(n)).slice(0, 5)
      .map((t) => ({ kind: "Task", id: t.id, title: t.title, sub: `Custom task · ${t.owner}`, href: `/tasks?focus=${encodeURIComponent(t.id)}` }));
  }, [q, state.tasks]);
  const all = [...pages, ...myTasks, ...(q.trim().length < 2 ? [] : hits)];

  const go = (href: string) => { onClose(); router.push(href); };

  return (
    <div className="palette-backdrop" onClick={onClose}>
      <div className="palette" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Search">
        <div className="palette-input">
          <Search size={16} />
          <input
            ref={inputRef}
            value={q}
            placeholder="Search campaigns, copy, tasks, content, experiments, opportunities…"
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") onClose();
              if (e.key === "ArrowDown") { e.preventDefault(); setIdx((i) => Math.min(i + 1, all.length - 1)); }
              if (e.key === "ArrowUp") { e.preventDefault(); setIdx((i) => Math.max(i - 1, 0)); }
              if (e.key === "Enter" && all[idx]) go(all[idx].href);
            }}
          />
          <kbd>Esc</kbd>
        </div>
        <ul className="palette-list">
          {q.trim().length < 2 && <li className="muted small palette-hint">Type at least two letters. Tip: press / anywhere to search.</li>}
          {q.trim().length >= 2 && all.length === 0 && <li className="muted small palette-hint">No matches.</li>}
          {all.map((h, i) => (
            <li key={`${h.kind}:${h.id}`}>
              <button className={i === idx ? "is-active" : ""} onMouseEnter={() => setIdx(i)} onClick={() => go(h.href)}>
                <span className="palette-kind">{h.kind}</span>
                <span className="palette-title">{h.title}</span>
                {h.sub && <span className="palette-sub">{h.sub}</span>}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
