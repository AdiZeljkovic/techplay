"use client";
// Generic filter + table + export. Every list screen uses it, so filters are
// real (they narrow the rows) and every table can be exported as it is shown.
import { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Download, Search, X } from "lucide-react";
import { download, toCSV } from "@/lib/csv";
import { cx, Empty } from "./ui";

export interface Column<T> {
  key: string;
  label: string;
  render?: (row: T) => React.ReactNode;
  value?: (row: T) => string | number;
  width?: string;
  className?: string;
  sortable?: boolean;
  hideOnMobile?: boolean;
}

export interface Filter<T> {
  key: string;
  label: string;
  value: (row: T) => string | string[];
  options?: string[];
}

function valOf<T>(c: Column<T>, r: T): string | number {
  if (c.value) return c.value(r);
  const v = (r as Record<string, unknown>)[c.key];
  return Array.isArray(v) ? v.join(", ") : (v as string | number) ?? "";
}

export function useFiltered<T>(rows: T[], filters: Filter<T>[], text: (r: T) => string, initial?: { q?: string; sel?: Record<string, string> }) {
  const [q, setQ] = useState(initial?.q ?? "");
  const [sel, setSel] = useState<Record<string, string>>(initial?.sel ?? {});
  const options = useMemo(() => Object.fromEntries(filters.map((f) => {
    if (f.options) return [f.key, f.options];
    const set = new Set<string>();
    rows.forEach((r) => { const v = f.value(r); (Array.isArray(v) ? v : [v]).forEach((x) => x && set.add(x)); });
    return [f.key, [...set].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))];
  })), [rows, filters]);
  const out = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter((r) => {
      for (const f of filters) {
        const want = sel[f.key];
        if (!want) continue;
        const v = f.value(r);
        if (Array.isArray(v) ? !v.includes(want) : v !== want) return false;
      }
      return !needle || text(r).toLowerCase().includes(needle);
    });
  }, [rows, filters, sel, q, text]);
  return { q, setQ, sel, setSel, options, rows: out };
}

export function FilterBar<T>({ filters, state, total, shown, extra }: {
  filters: Filter<T>[];
  state: ReturnType<typeof useFiltered<T>>;
  total: number;
  shown: number;
  extra?: React.ReactNode;
}) {
  const active = Object.values(state.sel).filter(Boolean).length + (state.q ? 1 : 0);
  return (
    <div className="filterbar">
      <label className="search-input">
        <Search size={14} />
        <input value={state.q} onChange={(e) => state.setQ(e.target.value)} placeholder="Filter…" aria-label="Filter text" />
      </label>
      {filters.map((f) => (
        <select
          key={f.key}
          aria-label={f.label}
          className={cx("filter-select", state.sel[f.key] && "is-set")}
          value={state.sel[f.key] || ""}
          onChange={(e) => state.setSel({ ...state.sel, [f.key]: e.target.value })}
        >
          <option value="">{f.label}: all</option>
          {state.options[f.key]?.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      ))}
      {extra}
      {active > 0 && (
        <button className="btn btn-ghost btn-sm" onClick={() => { state.setQ(""); state.setSel({}); }}>
          <X size={13} /> Clear
        </button>
      )}
      <span className="muted small filter-count">{shown === total ? `${total}` : `${shown} of ${total}`}</span>
    </div>
  );
}

export function DataTable<T>({ rows, columns, rowKey, onRowClick, exportName, empty = "Nothing matches these filters", initialSort }: {
  rows: T[];
  columns: Column<T>[];
  rowKey: (r: T) => string;
  onRowClick?: (r: T) => void;
  exportName?: string;
  empty?: string;
  initialSort?: { key: string; dir: 1 | -1 };
}) {
  const [sort, setSort] = useState<{ key: string; dir: 1 | -1 } | null>(initialSort ?? null);
  const sorted = useMemo(() => {
    if (!sort) return rows;
    const c = columns.find((x) => x.key === sort.key);
    if (!c) return rows;
    return [...rows].sort((a, b) => {
      const va = valOf(c, a), vb = valOf(c, b);
      return (typeof va === "number" && typeof vb === "number" ? va - vb : String(va).localeCompare(String(vb), undefined, { numeric: true })) * sort.dir;
    });
  }, [rows, sort, columns]);
  return (
    <div className="table-wrap">
      {exportName && (
        <div className="table-tools">
          <button className="btn btn-ghost btn-sm" onClick={() => download(`${exportName}.csv`, toCSV(sorted.map((r) => Object.fromEntries(columns.map((c) => [c.label, valOf(c, r)])))))}>
            <Download size={13} /> CSV
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => download(`${exportName}.json`, JSON.stringify(sorted, null, 2), "application/json")}>
            <Download size={13} /> JSON
          </button>
        </div>
      )}
      {sorted.length === 0 ? <Empty title={empty} /> : (
        <table className="table">
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c.key} style={{ width: c.width }} className={cx(c.hideOnMobile && "hide-sm", c.className)}>
                  {c.sortable === false ? c.label : (
                    <button className="th-sort" onClick={() => setSort(sort?.key === c.key ? { key: c.key, dir: (sort.dir * -1) as 1 | -1 } : { key: c.key, dir: 1 })}>
                      {c.label}
                      {sort?.key === c.key && (sort.dir === 1 ? <ArrowUp size={11} /> : <ArrowDown size={11} />)}
                    </button>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((r) => (
              <tr key={rowKey(r)} onClick={onRowClick ? () => onRowClick(r) : undefined} className={cx(onRowClick && "clickable")}>
                {columns.map((c) => (
                  <td key={c.key} className={cx(c.hideOnMobile && "hide-sm", c.className)}>{c.render ? c.render(r) : String(valOf(c, r))}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export function Drawer({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: React.ReactNode; children: React.ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <aside className={cx("drawer", wide && "drawer-wide")} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="drawer-head">
          <div className="drawer-title">{title}</div>
          <button className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Close"><X size={16} /></button>
        </div>
        <div className="drawer-body">{children}</div>
      </aside>
    </div>
  );
}
