"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { CalendarDays, ListChecks, Menu, Megaphone, Copy, Search, Sun, X } from "lucide-react";
import { NAV } from "./nav";
import { CommandPalette } from "./CommandPalette";
import { useGrowth } from "@/lib/state/client";
import { OWNERS, OWNER_NAMES } from "@/lib/status";
import { cx } from "./ui";

export function Shell({ children, planDate, planLabel, notice }: { children: React.ReactNode; planDate: string; planLabel: { main: string; rest: string }; notice?: string }) {
  const path = usePathname();
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const menu = menuFor === path; // closes itself on navigation
  const setMenu = (open: boolean) => setMenuFor(open ? path : null);
  const [palette, setPalette] = useState(false);
  const { state, dispatch, offline } = useGrowth();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setPalette((v) => !v); }
      if (e.key === "/" && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement)) { e.preventDefault(); setPalette(true); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const isActive = (href: string) => (href === "/" ? path === "/" : path === href || path.startsWith(`${href}/`));

  return (
    <div className="app">
      <aside className={cx("sidebar", menu && "is-open")}>
        <div className="brand">
          <span className="brand-mark">TP</span>
          <div>
            <div className="brand-name">Growth OS</div>
            <div className="brand-sub">TechPlay · internal</div>
          </div>
          <button className="btn btn-ghost btn-sm only-sm" onClick={() => setMenu(false)} aria-label="Close menu"><X size={16} /></button>
        </div>
        <nav aria-label="Main">
          {NAV.map((g) => (
            <div key={g.group} className="nav-group">
              <div className="nav-group-label">{g.group}</div>
              {g.items.map((it) => {
                const Icon = it.icon;
                return (
                  <Link key={it.href} href={it.href} className={cx("nav-item", isActive(it.href) && "is-active")}>
                    <Icon size={15} />
                    <span>{it.label}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
        <div className="sidebar-foot muted small">
          {offline ? "Saving in this browser (server store unavailable)" : "Saving to data/state on this machine"}
        </div>
      </aside>
      {menu && <div className="scrim" onClick={() => setMenu(false)} />}
      <div className="main">
        <header className="topbar">
          <button className="btn btn-ghost btn-sm only-sm" onClick={() => setMenu(true)} aria-label="Open menu"><Menu size={18} /></button>
          <Link href="/today" className="plan-date" title="Plan date (change in Settings)">
            <span className="plan-date-main">{planLabel.main}<span className="hide-sm">{planLabel.rest}</span></span>
          </Link>
          <button className="search-trigger" onClick={() => setPalette(true)} aria-label="Search everything">
            <Search size={14} />
            <span className="hide-sm">Search campaigns, copy, tasks…</span>
            <kbd className="hide-sm">⌘K</kbd>
          </button>
          <label className="viewas">
            <span className="hide-sm muted small">Viewing as</span>
            <select value={state.settings.viewAs} onChange={(e) => dispatch({ op: "setSetting", key: "viewAs", value: e.target.value })} aria-label="Viewing as owner">
              <option value="ALL">Everyone</option>
              {OWNERS.map((o) => <option key={o} value={o}>{o} · {OWNER_NAMES[o]}</option>)}
            </select>
          </label>
        </header>
        {notice && <div className="notice">{notice}</div>}
        <main className="content" data-plan-date={planDate}>{children}</main>
        <nav className="tabbar only-sm" aria-label="Quick">
          {[
            { href: "/today", label: "Today", icon: Sun },
            { href: "/tasks", label: "Tasks", icon: ListChecks },
            { href: "/copy", label: "Copy", icon: Copy },
            { href: "/campaigns", label: "Campaigns", icon: Megaphone },
            { href: "/calendar", label: "Calendar", icon: CalendarDays },
          ].map((t) => {
            const Icon = t.icon;
            return <Link key={t.href} href={t.href} className={cx("tab-item", isActive(t.href) && "is-active")}><Icon size={18} /><span>{t.label}</span></Link>;
          })}
        </nav>
      </div>
      {palette && <CommandPalette onClose={() => setPalette(false)} />}
    </div>
  );
}
