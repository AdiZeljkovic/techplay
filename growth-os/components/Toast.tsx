"use client";
import { createContext, useCallback, useContext, useState } from "react";

type Tone = "good" | "bad" | "info";
type ToastFn = (msg: string, tone?: Tone) => void;
const Ctx = createContext<ToastFn>(() => {});

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<{ id: number; msg: string; tone: Tone }[]>([]);
  const push = useCallback<ToastFn>((msg, tone = "good") => {
    const id = Date.now() + Math.random();
    setItems((xs) => [...xs.slice(-3), { id, msg, tone }]);
    setTimeout(() => setItems((xs) => xs.filter((x) => x.id !== id)), 2200);
  }, []);
  return (
    <Ctx.Provider value={push}>
      {children}
      <div className="toast-stack" role="status" aria-live="polite">
        {items.map((t) => (
          <div key={t.id} className={`toast toast-${t.tone}`}>{t.msg}</div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export const useToast = () => useContext(Ctx);
