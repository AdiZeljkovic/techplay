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
            toast.success("Check your inbox to confirm.");
        } catch (err: unknown) {
            const status = (err as { response?: { status?: number } })?.response?.status;

            // Already on the list is not a failure — it is the outcome asked for.
            if (status === 409) {
                setDone(true);
                toast.success("You're already on the list.");
            } else {
                toast.error("That didn't go through. Try again in a moment.");
            }
        } finally {
            setBusy(false);
        }
    };

    if (!open) return null;

    if (done) {
        return (
            <p className="mt-3 inline-flex items-center gap-2 text-[12.5px] text-emerald-400">
                <Check className="w-4 h-4" /> You&apos;re on the list. We&apos;ll write when Frontiers opens.
            </p>
        );
    }

    return (
        <form onSubmit={submit} className="mt-3 flex flex-col sm:flex-row gap-2">
            <input
                ref={inputRef}
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                aria-label="Email for Frontiers updates"
                className="flex-1 h-11 px-4 bg-black/60 border border-[var(--line-strong)] text-[13.5px] text-white placeholder:text-[var(--ink-faint)] outline-none focus:border-[color-mix(in_srgb,var(--accent)_60%,transparent)] transition-colors"
            />
            <button
                type="submit"
                disabled={busy}
                className="btn-command h-11 px-5 bg-white/[0.07] hover:bg-white/[0.14] border border-white/[0.14] font-display text-[10px] font-black uppercase tracking-[0.12em] text-white transition-colors disabled:opacity-50"
            >
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : "Notify me"}
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
        ["Days", left?.days ?? null],
        ["Hours", left?.hours ?? null],
        ["Minutes", left?.minutes ?? null],
        ["Seconds", left?.seconds ?? null],
    ];

    return (
        <div className="max-w-[440px]">
            {/* ── the clock ──
                Corner ticks rather than a rounded box: the same bracket the
                tagline wears, so the two read as one instrument. */}
            <div className="relative mt-8 flex items-stretch border border-[color-mix(in_srgb,var(--accent)_38%,transparent)] bg-black/55 backdrop-blur-sm">
                {([
                    "-top-px -left-px border-t-2 border-l-2",
                    "-top-px -right-px border-t-2 border-r-2",
                    "-bottom-px -left-px border-b-2 border-l-2",
                    "-bottom-px -right-px border-b-2 border-r-2",
                ] as const).map((corner) => (
                    <span key={corner} aria-hidden className={`absolute w-3 h-3 border-[var(--accent)] ${corner}`} />
                ))}

                {units.map(([label, value], i) => (
                    <span
                        key={label}
                        className={`flex-1 px-2 sm:px-4 py-3.5 text-center ${
                            i > 0 ? "border-l border-[color-mix(in_srgb,var(--accent)_20%,transparent)]" : ""
                        }`}
                    >
                        <span className="block font-display text-[28px] sm:text-[32px] font-black tabular-nums leading-none text-[var(--accent)]">
                            {value === null ? "––" : String(value).padStart(2, "0")}
                        </span>
                        <span className="mt-1.5 block font-display text-[8px] font-bold uppercase tracking-[0.18em] text-white/45">
                            {label}
                        </span>
                    </span>
                ))}
            </div>

            {/* ── the ask ── */}
            <div className="mt-6">
                <button
                    onClick={openNotify}
                    className="btn-command flex w-full items-center justify-center gap-3 h-[54px] bg-[var(--accent)] hover:brightness-110 border border-[color-mix(in_srgb,#ffffff_24%,transparent)] font-display text-[13px] font-black uppercase tracking-[0.14em] text-white transition-[filter,transform] duration-200 active:scale-[0.99]"
                >
                    <Flag className="w-4 h-4" />
                    Add to wishlist
                </button>

                {/* Its own line, centred under the button. Both controls were
                    inline-flex before, so this sat beside the button rather
                    than beneath it. */}
                <div className="mt-3 flex justify-center">
                    <button
                        onClick={() => (notifyOpen ? setNotifyOpen(false) : openNotify())}
                        aria-expanded={notifyOpen}
                        className="inline-flex items-center gap-1.5 font-display text-[10px] font-bold uppercase tracking-[0.16em] text-white/45 hover:text-white transition-colors"
                    >
                        Follow the news
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${notifyOpen ? "rotate-180" : ""}`} />
                    </button>
                </div>

                <NotifyForm open={notifyOpen} inputRef={inputRef} />
            </div>
        </div>
    );
}
