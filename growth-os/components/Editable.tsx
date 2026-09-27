"use client";
import { useState } from "react";
import { useGrowth } from "@/lib/state/client";

/** A persisted free-text field (notes, results, links) attached to any entity id. */
export function EditableField({ id, field, label, placeholder, multiline = true }: { id: string; field: string; label: string; placeholder?: string; multiline?: boolean }) {
  const { state, dispatch } = useGrowth();
  const saved = state.fields[id]?.[field] ?? "";
  const [draft, setDraft] = useState<string | null>(null);
  const v = draft ?? saved;
  const setV = (x: string) => setDraft(x);
  const commit = () => { if (draft !== null && draft !== saved) dispatch({ op: "setField", id, key: field, value: draft }); setDraft(null); };
  return (
    <label className="field">
      <span>{label}{v !== saved && <em className="muted"> · unsaved</em>}</span>
      {multiline
        ? <textarea className="textarea" value={v} placeholder={placeholder} onChange={(e) => setV(e.target.value)} onBlur={commit} />
        : <input className="input" value={v} placeholder={placeholder} onChange={(e) => setV(e.target.value)} onBlur={commit} onKeyDown={(e) => e.key === "Enter" && commit()} />}
    </label>
  );
}

export function useField(id: string, field: string): string {
  const { state } = useGrowth();
  return state.fields[id]?.[field] ?? "";
}
