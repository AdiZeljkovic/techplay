"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import axios from "@/lib/axios";
import toast from "react-hot-toast";
import { ChevronDown, Flag, Loader2, Check } from "lucide-react";

/**
 * When Frontiers opens.
 *
 * PLACEHOLDER — set this to the real date and the countdown follows it. Until
 * then it is a date roughly a month out so the page reads the way it will on
 * the day, rather than showing zeroes or nothing at all.
 */
const LAUNCH_AT = "2026-09-13T18:00:00+02:00";

type Remaining = { days: number; hours: number; minutes: number; seconds: number } | null;

function remainingFrom(target: number): Remaining {
    const ms = target - Date.now();

    if (ms <= 0) return null;

    return {
        days: Math.floor(ms / 86_400_000),
        hours: Math.floor((ms / 3_600_000) % 24),
        minutes: Math.floor((ms / 60_000) % 60),
        seconds: Math.floor((ms / 1000) % 60),
    };
}

/**
 * The clock only starts on the client.
 *
 * Rendering a live figure during SSR means the server's second and the
 * browser's second disagree on the first paint, which React reports as a
 * hydration mismatch. Null until the first frame after mount — the markup
 * shows dashes — and it ticks from there.
 */
function useCountdown(iso: string): Remaining {
    const target = useMemo(() => new Date(iso).getTime(), [iso]);
    const [left, setLeft] = useState<Remaining>(null);

    useEffect(() => {
        // The first value is written by the same tick that schedules the rest,
        // rather than set synchronously on mount — one render path, no cascade.
        const tick = () => setLeft(remainingFrom(target));

        const raf = requestAnimationFrame(tick);
        const id = setInterval(tick, 1000);

        return () => {
            cancelAnimationFrame(raf);
            clearInterval(id);
        };
    }, [target]);

    return left;
}

/* ── the notify form, one real action ─────────────────────────────────── */

function NotifyForm({ open, inputRef }: { open: boolean; inputRef: React.RefObject<HTMLInputElement | null> }) {
    const [email, setEmail] = useState("");
    const [busy, setBusy] = useState(false);
    const [done, setDone] = useState(false);

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email.trim()) return;

        setBusy(true);

        try {
            await axios.post("/newsletter/subscribe", { email: email.trim() });
            setDone(true);
            toast.success("Provjeri inbox da potvrdiš prijavu.");
        } catch (err: unknown) {
            const status = (err as { response?: { status?: number } })?.response?.status;

            // Already on the list is not a failure — it is the outcome asked for.
            if (status === 409) {
                setDone(true);
                toast.success("Već si na listi.");
            } else {
                toast.error("Prijava nije prošla. Pokušaj ponovo za koji trenutak.");
            }
        } finally {
            setBusy(false);
        }
    };

    if (!open) return null;

    if (done) {
        return (
            <p className="mt-3 inline-flex items-center gap-2 text-[12.5px] text-emerald-400">
                <Check className="w-4 h-4" /> Na listi si. Javljamo se kad Frontiers krene.
            </p>
        );
    }

    return (
        <form onSubmit={submit} className="mt-3 flex flex-col sm:flex-row gap-2 max-w-[420px]">
            <input
                ref={inputRef}
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                aria-label="Email za Frontiers novosti"
                className="flex-1 h-11 px-4 rounded-[var(--radius-card)] bg-[var(--surface-2)] border border-[var(--line-strong)] text-[13.5px] text-white placeholder:text-[var(--ink-faint)] outline-none focus:border-[color-mix(in_srgb,var(--accent)_60%,transparent)] focus:ring-1 focus:ring-[var(--accent-soft)] transition-all"
            />
            <button
                type="submit"
                disabled={busy}
                className="h-11 px-5 rounded-[var(--radius-card)] bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.12] font-display text-[10px] font-black uppercase tracking-[0.12em] text-white transition-colors disabled:opacity-50"
            >
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : "Obavijesti me"}
            </button>
        </form>
    );
}

/* ── the page's interactive half ──────────────────────────────────────── */

export default function FrontiersClient() {
    const left = useCountdown(LAUNCH_AT);
    const [notifyOpen, setNotifyOpen] = useState(false);
    const inputRef = useRef<HTMLInputElement | null>(null);

    const openNotify = () => {
        setNotifyOpen(true);
        // The input only exists once the form is open, so focus on the next frame.
        requestAnimationFrame(() => inputRef.current?.focus());
    };

    const units: [string, number | null][] = [
        ["Dana", left?.days ?? null],
        ["Sati", left?.hours ?? null],
        ["Minuta", left?.minutes ?? null],
        ["Sekundi", left?.seconds ?? null],
    ];

    return (
        <>
            {/* ── the clock ── */}
            <div className="mt-8 inline-flex items-stretch rounded-[var(--radius-panel)] border border-[color-mix(in_srgb,var(--accent)_28%,transparent)] bg-black/40 backdrop-blur-sm">
                {units.map(([label, value], i) => (
                    <span
                        key={label}
                        className={`px-5 sm:px-7 py-3.5 text-center ${
                            i > 0 ? "border-l border-[color-mix(in_srgb,var(--accent)_18%,transparent)]" : ""
                        }`}
                    >
                        <span className="block font-display text-[28px] sm:text-[34px] font-black tabular-nums leading-none text-[var(--accent)]">
                            {value === null ? "––" : String(value).padStart(2, "0")}
                        </span>
                        <span className="mt-1.5 block font-display text-[8.5px] font-bold uppercase tracking-[0.18em] text-white/40">
                            {label}
                        </span>
                    </span>
                ))}
            </div>

            {/* ── the ask ── */}
            <div className="mt-7">
                <button
                    onClick={openNotify}
                    className="group relative inline-flex items-center justify-center gap-3 h-[54px] w-full max-w-[420px] rounded-[var(--radius-card)] bg-[var(--accent)] hover:brightness-110 font-display text-[13px] font-black uppercase tracking-[0.14em] text-white transition-[filter,transform] duration-200 active:scale-[0.99]"
                >
                    <Flag className="w-4 h-4" />
                    Stavi na listu želja
                </button>

                <button
                    onClick={() => (notifyOpen ? setNotifyOpen(false) : openNotify())}
                    aria-expanded={notifyOpen}
                    className="mt-3.5 inline-flex items-center gap-1.5 font-display text-[10px] font-bold uppercase tracking-[0.16em] text-white/40 hover:text-white transition-colors"
                >
                    Prati novosti
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${notifyOpen ? "rotate-180" : ""}`} />
                </button>

                <NotifyForm open={notifyOpen} inputRef={inputRef} />
            </div>
        </>
    );
}
