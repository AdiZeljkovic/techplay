"use client";
// Client side of persistence: optimistic updates through the same reducer the
// server runs, POSTed to /api/state. If the API is unreachable (e.g. a static
// preview), state falls back to localStorage so nothing typed is lost.
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { applyOp, normaliseState } from "./reducer";
import { emptyState, type GrowthState, type StateOp } from "./types";
import { useToast } from "@/components/Toast";

const LS_KEY = "growth-os-state-v1";

interface Ctx {
  state: GrowthState;
  ready: boolean;
  offline: boolean;
  dispatch: (op: StateOp | StateOp[]) => void;
}

const StateCtx = createContext<Ctx | null>(null);

export function StateProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<GrowthState>(emptyState);
  const [ready, setReady] = useState(false);
  const [offline, setOffline] = useState(false);
  const toast = useToast();
  const stateRef = useRef(state);
  useEffect(() => { stateRef.current = state; }, [state]);

  useEffect(() => {
    let alive = true;
    fetch("/api/state", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((s) => { if (alive) { setState(normaliseState(s)); setReady(true); } })
      .catch(() => {
        if (!alive) return;
        try {
          const raw = localStorage.getItem(LS_KEY);
          if (raw) setState(normaliseState(JSON.parse(raw)));
        } catch { /* private mode: start empty */ }
        setOffline(true);
        setReady(true);
      });
    return () => { alive = false; };
  }, []);

  const dispatch = useCallback((input: StateOp | StateOp[]) => {
    const ops = Array.isArray(input) ? input : [input];
    let next = stateRef.current;
    for (const op of ops) next = applyOp(next, op);
    setState(next);
    stateRef.current = next;
    if (offline) {
      try { localStorage.setItem(LS_KEY, JSON.stringify(next)); } catch { /* ignore */ }
      return;
    }
    fetch("/api/state", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ops }) })
      .then((r) => { if (!r.ok) throw new Error(String(r.status)); })
      .catch(() => {
        toast("Could not save to the server; kept in this browser", "bad");
        try { localStorage.setItem(LS_KEY, JSON.stringify(stateRef.current)); } catch { /* ignore */ }
      });
  }, [offline, toast]);

  const value = useMemo(() => ({ state, ready, offline, dispatch }), [state, ready, offline, dispatch]);
  return <StateCtx.Provider value={value}>{children}</StateCtx.Provider>;
}

export function useGrowth(): Ctx {
  const ctx = useContext(StateCtx);
  if (!ctx) throw new Error("useGrowth outside StateProvider");
  return ctx;
}

export function useStatus(id: string, fallback: string): [string, (s: string) => void] {
  const { state, dispatch } = useGrowth();
  const cur = state.status[id] ?? fallback;
  const set = useCallback((s: string) => dispatch({ op: "setStatus", id, status: s === fallback ? null : s }), [dispatch, id, fallback]);
  return [cur, set];
}

export function uid(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}
