"use client";

import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import axios from "@/lib/axios";
import toast from "react-hot-toast";
import Link from "next/link";
import { Check, Loader2, PenLine, Globe2, Users, BarChart3 } from "lucide-react";

/**
 * When Sony stops producing physical discs for new PlayStation games.
 *
 * Announced for January 2028; the first of the month is the earliest date the
 * announcement can mean, so the clock counts to that rather than to a day
 * nobody has given.
 */
const DEADLINE = "2028-01-01T00:00:00Z";

const CHOICE_LABELS: Record<string, string> = {
    keep: "Yes, keep physical games",
    digital_only: "I don't mind digital-only",
    unsure: "Not sure",
};

interface Payload {
    stats: {
        signatures: number;
        anonymous: number;
        countries: number;
        recent: { name: string; country: string | null; signed_at: string }[];
    };
    poll: { total: number; options: { choice: string; votes: number; percent: number }[] };
    signed: boolean;
    voted: boolean;
}

const fetcher = (url: string) => axios.get(url).then((r) => r.data?.data as Payload);

/* ── the clock ────────────────────────────────────────────────────────── */

function useCountdown(iso: string) {
    const target = useMemo(() => new Date(iso).getTime(), [iso]);
    const [left, setLeft] = useState<{ d: number; h: number; m: number; s: number } | null>(null);

    useEffect(() => {
        const tick = () => {
            const ms = target - Date.now();

            setLeft(ms <= 0 ? null : {
                d: Math.floor(ms / 86_400_000),
                h: Math.floor((ms / 3_600_000) % 24),
                m: Math.floor((ms / 60_000) % 60),
                s: Math.floor((ms / 1000) % 60),
            });
        };

        const raf = requestAnimationFrame(tick);
        const id = setInterval(tick, 1000);

        return () => { cancelAnimationFrame(raf); clearInterval(id); };
    }, [target]);

    return left;
}

/** One digit of the clock, rendered as separate glyph cells. */
function Digits({ value, label }: { value: number | null; label: string }) {
    const text = value === null ? "––" : String(value).padStart(2, "0");

    return (
        <span className="text-center">
            <span className="flex items-center gap-1.5 justify-center">
                {text.split("").map((ch, i) => (
                    <span
                        key={i}
                        className="w-[38px] sm:w-[46px] py-2.5 rounded-[6px] bg-white/[0.05] border border-white/[0.08] font-display text-[26px] sm:text-[32px] font-black tabular-nums leading-none text-white"
                    >
                        {ch}
                    </span>
                ))}
            </span>
            <span className="mt-2 block font-display text-[8.5px] font-bold uppercase tracking-[0.18em] text-white/35">
                {label}
            </span>
        </span>
    );
}

/* ── the page's live half ─────────────────────────────────────────────── */

export default function LastDiscClient() {
    const { data, mutate } = useSWR<Payload>("/last-disc", fetcher, { revalidateOnFocus: false });
    const left = useCountdown(DEADLINE);

    const stats = data?.stats;
    const poll = data?.poll;

    /* ── the poll ── */
    const [voting, setVoting] = useState<string | null>(null);

    const vote = async (choice: string) => {
        setVoting(choice);

        try {
            await axios.post("/last-disc/vote", { choice });
            toast.success("Vote counted.");
            mutate();
        } catch (e: unknown) {
            const status = (e as { response?: { status?: number } })?.response?.status;
            toast.error(status === 409 ? "You've already voted." : "Couldn't record that vote.");
            if (status === 409) mutate();
        } finally {
            setVoting(null);
        }
    };

    /* ── the letter ── */
    const [form, setForm] = useState({
        name: "", email: "", country: "", display: "name",
        message: "", consent: false, updates: false,
    });
    const [signing, setSigning] = useState(false);
    const [justSigned, setJustSigned] = useState(false);

    const sign = async (e: React.FormEvent) => {
        e.preventDefault();
        setSigning(true);

        try {
            await axios.post("/last-disc/sign", {
                email: form.email.trim(),
                name: form.name.trim() || null,
                country: form.country || null,
                display: form.display,
                message: form.message.trim() || null,
                wants_updates: form.updates,
                consent: form.consent,
            });

            setJustSigned(true);
            toast.success("Your name is on the letter.");
            mutate();
        } catch (err: unknown) {
            const status = (err as { response?: { status?: number } })?.response?.status;
            const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
            toast.error(status === 409 ? (message ?? "That address has already signed.") : "Couldn't add your signature.");
        } finally {
            setSigning(false);
        }
    };

    const signed = justSigned || Boolean(data?.signed);
    const voted = Boolean(data?.voted);

    const field =
        "w-full h-11 px-3.5 rounded-[var(--radius-card)] bg-[var(--surface-2)] border border-[var(--line-strong)] text-[13.5px] text-white placeholder:text-[var(--ink-faint)] outline-none focus:border-[color-mix(in_srgb,var(--accent)_60%,transparent)] transition-colors";
    const label = "block font-display text-[9px] font-black uppercase tracking-[0.16em] text-white/45 mb-1.5";

    return (
        <>
            {/* ══ countdown + poll ══ */}
            <div className="container-page grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4 items-start">
                <section className="rounded-[var(--radius-panel)] border border-white/[0.07] bg-[var(--surface-1)] p-6 text-center">
                    <p className="font-display text-[10px] font-black uppercase tracking-[0.2em] text-white/45">
                        Countdown to <span className="text-[var(--accent)]">January 2028</span>
                    </p>

                    <div className="mt-5 flex flex-wrap items-start justify-center gap-4 sm:gap-6">
                        <Digits value={left?.d ?? null} label="Days" />
                        <Digits value={left?.h ?? null} label="Hours" />
                        <Digits value={left?.m ?? null} label="Minutes" />
                        <Digits value={left?.s ?? null} label="Seconds" />
                    </div>

                    <p className="mt-6 mx-auto max-w-[440px] text-[12.5px] leading-relaxed text-white/40">
                        Sony plans to stop producing physical discs for new PlayStation games in January 2028.
                    </p>

                    <Link
                        href="/news"
                        className="mt-4 inline-flex items-center gap-1.5 font-display text-[10px] font-black uppercase tracking-[0.14em] text-[var(--accent)] hover:brightness-125 transition-[filter]"
                    >
                        Read our coverage →
                    </Link>
                </section>

                {/* ── the poll ── */}
                <section className="rounded-[var(--radius-panel)] border border-white/[0.07] bg-[var(--surface-1)] p-5">
                    <p className="font-display text-[9px] font-black uppercase tracking-[0.16em] text-white/40">
                        What do you think?
                    </p>
                    <h2 className="mt-2 font-display text-[15px] font-black text-white leading-snug">
                        Do you want Sony to keep physical games available?
                    </h2>

                    <div className="mt-4 space-y-3">
                        {(poll?.options ?? []).map((option) => (
                            <div key={option.choice}>
                                <button
                                    onClick={() => vote(option.choice)}
                                    disabled={voted || voting !== null}
                                    className="w-full flex items-baseline justify-between gap-3 text-left group disabled:cursor-default"
                                >
                                    <span className={`text-[12.5px] ${voted ? "text-white/60" : "text-white/70 group-hover:text-white"} transition-colors`}>
                                        {CHOICE_LABELS[option.choice] ?? option.choice}
                                    </span>
                                    <span className="shrink-0 font-display text-[11px] font-black tabular-nums text-white/45">
                                        {voting === option.choice ? <Loader2 className="w-3 h-3 animate-spin" /> : `${option.percent}%`}
                                    </span>
                                </button>
                                <span className="mt-1.5 block h-[6px] rounded-full bg-[var(--track)] overflow-hidden">
                                    <span
                                        className={`block h-full rounded-full transition-[width] duration-700 ${
                                            option.choice === "keep" ? "bg-[var(--accent)]" : "bg-white/20"
                                        }`}
                                        style={{ width: `${option.percent}%` }}
                                    />
                                </span>
                            </div>
                        ))}
                    </div>

                    <p className="mt-4 pt-3 border-t border-white/[0.07] font-display text-[10px] font-bold tabular-nums text-white/30">
                        {(poll?.total ?? 0).toLocaleString("en-US")} {poll?.total === 1 ? "vote" : "votes"}
                        {voted && <span className="ml-2 text-emerald-400/70">· you voted</span>}
                    </p>
                </section>
            </div>

            {/* ══ the letter ══ */}
            <div className="container-page mt-4">
                <div className="rounded-[var(--radius-panel)] border border-white/[0.07] bg-[var(--surface-1)] grid grid-cols-1 lg:grid-cols-2">
                    {/* ── the case ── */}
                    <div className="p-6 lg:p-8 lg:border-r border-white/[0.07]">
                        <p className="font-display text-[9.5px] font-black uppercase tracking-[0.18em] text-[var(--accent)]">
                            Sign the open letter
                        </p>
                        <h2 className="mt-2.5 font-display text-[22px] lg:text-[26px] font-black text-white leading-tight">
                            Add your voice to the players who want to keep physical games.
                        </h2>

                        <p className="mt-4 text-[13px] leading-relaxed text-white/50">
                            We are not against digital. We are <span className="text-[var(--accent)] font-semibold">for choice</span>.
                            Digital games should exist, but physical games should remain available for players who value
                            ownership, collecting, sharing and preservation.
                        </p>

                        <div className="mt-6 grid grid-cols-3 gap-4">
                            {([
                                [PenLine, stats?.signatures, "Signatures"],
                                [Globe2, stats?.countries, "Countries"],
                                [Users, stats?.anonymous, "Anonymous"],
                            ] as const).map(([Icon, value, caption]) => (
                                <span key={caption}>
                                    <Icon className="w-4 h-4 mb-2 text-[var(--accent)]" />
                                    <span className="block font-display text-[24px] font-black tabular-nums leading-none text-white">
                                        {value === undefined ? "—" : value.toLocaleString("en-US")}
                                    </span>
                                    <span className="mt-1.5 block font-display text-[8.5px] font-bold uppercase tracking-[0.16em] text-white/35">
                                        {caption}
                                    </span>
                                </span>
                            ))}
                        </div>

                        <blockquote className="mt-6 rounded-[var(--radius-card)] border border-[color-mix(in_srgb,var(--accent)_22%,transparent)] bg-[var(--accent-soft)] p-4">
                            <p className="font-display text-[9px] font-black uppercase tracking-[0.16em] text-[var(--accent)]">
                                An open letter to Sony Interactive Entertainment
                            </p>
                            <p className="mt-2.5 text-[12.5px] leading-relaxed text-white/55">
                                We are not asking Sony to abandon digital distribution, nor to slow it down in any way.
                                What we are asking is simply that physical copies remain an option for those who want
                                them — just as has been the case until now. Discontinuing them offers no improvement in
                                service and no quality-of-life change; it represents nothing but a loss of choice.
                            </p>
                            <Link
                                href="/last-disc/letter"
                                className="mt-3.5 inline-flex items-center gap-1.5 font-display text-[10px] font-black uppercase tracking-[0.14em] text-[var(--accent)] hover:brightness-125 transition-[filter]"
                            >
                                Read the full letter →
                            </Link>
                        </blockquote>

                        {(stats?.recent.length ?? 0) > 0 && (
                            <div className="mt-5">
                                <p className="font-display text-[8.5px] font-black uppercase tracking-[0.16em] text-white/30">
                                    Latest signatures
                                </p>
                                <p className="mt-2 text-[12px] leading-relaxed text-white/40">
                                    {stats!.recent.map((s) => s.name).join(" · ")}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* ── the form ── */}
                    <div className="p-6 lg:p-8">
                        {signed ? (
                            <div className="h-full flex flex-col items-center justify-center text-center py-10">
                                <span className="w-12 h-12 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
                                    <Check className="w-6 h-6 text-emerald-400" />
                                </span>
                                <p className="mt-4 font-display text-[16px] font-black text-white">Signed. Thank you.</p>
                                <p className="mt-2 max-w-[300px] text-[12.5px] text-white/45 leading-relaxed">
                                    Every name makes the letter harder to ignore. Share it and the number grows.
                                </p>
                            </div>
                        ) : (
                            <form onSubmit={sign} className="space-y-4">
                                <div>
                                    <label className={label} htmlFor="ld-name">Full name <span className="text-white/25">(optional)</span></label>
                                    <input
                                        id="ld-name"
                                        value={form.name}
                                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                                        placeholder="Your name"
                                        maxLength={80}
                                        className={field}
                                    />
                                </div>

                                <div>
                                    <label className={label} htmlFor="ld-email">Email address *</label>
                                    <input
                                        id="ld-email"
                                        type="email"
                                        required
                                        value={form.email}
                                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                                        placeholder="name@example.com"
                                        className={field}
                                    />
                                    <p className="mt-1.5 text-[10.5px] text-white/25">
                                        Used only to keep the count honest — one signature per address. Never shared with Sony.
                                    </p>
                                </div>

                                <div>
                                    <label className={label} htmlFor="ld-country">Country <span className="text-white/25">(optional)</span></label>
                                    <select
                                        id="ld-country"
                                        value={form.country}
                                        onChange={(e) => setForm({ ...form, country: e.target.value })}
                                        className={field}
                                    >
                                        <option value="" className="bg-[var(--surface-0)]">Select your country</option>
                                        {COUNTRIES.map(([code, name]) => (
                                            <option key={code} value={code} className="bg-[var(--surface-0)]">{name}</option>
                                        ))}
                                    </select>
                                </div>

                                <fieldset>
                                    <legend className={label}>How would you like to be shown?</legend>
                                    <div className="flex flex-wrap gap-4">
                                        {([["name", "Show my name"], ["anonymous", "Sign as anonymous"]] as const).map(([value, text]) => (
                                            <label key={value} className="inline-flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name="display"
                                                    checked={form.display === value}
                                                    onChange={() => setForm({ ...form, display: value })}
                                                    className="accent-[var(--accent)]"
                                                />
                                                <span className="text-[12.5px] text-white/65">{text}</span>
                                            </label>
                                        ))}
                                    </div>
                                </fieldset>

                                <div>
                                    <label className={label} htmlFor="ld-message">Why is this important to you? <span className="text-white/25">(optional)</span></label>
                                    <textarea
                                        id="ld-message"
                                        rows={3}
                                        maxLength={1000}
                                        value={form.message}
                                        onChange={(e) => setForm({ ...form, message: e.target.value })}
                                        placeholder="Share your thoughts…"
                                        className={`${field} h-auto py-2.5 resize-none`}
                                    />
                                </div>

                                <label className="flex items-start gap-2.5 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        required
                                        checked={form.consent}
                                        onChange={(e) => setForm({ ...form, consent: e.target.checked })}
                                        className="mt-0.5 accent-[var(--accent)]"
                                    />
                                    <span className="text-[11.5px] leading-snug text-white/45">
                                        I agree that TechPlay may count my signature and include my selected display name
                                        or anonymous signature in the open letter summary.
                                    </span>
                                </label>

                                <label className="flex items-start gap-2.5 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={form.updates}
                                        onChange={(e) => setForm({ ...form, updates: e.target.checked })}
                                        className="mt-0.5 accent-[var(--accent)]"
                                    />
                                    <span className="text-[11.5px] leading-snug text-white/45">
                                        I want to receive updates about The Last Disc campaign.
                                    </span>
                                </label>

                                <button
                                    type="submit"
                                    disabled={signing}
                                    className="btn-command w-full flex items-center justify-center gap-2 h-12 bg-[var(--accent)] hover:brightness-110 font-display text-[12px] font-black uppercase tracking-[0.14em] text-white transition-[filter] disabled:opacity-60"
                                >
                                    {signing ? <Loader2 className="w-4 h-4 animate-spin" /> : <PenLine className="w-4 h-4" />}
                                    Sign the open letter
                                </button>

                                <p className="flex items-center justify-center gap-1.5 text-[10.5px] text-white/25">
                                    <BarChart3 className="w-3 h-3" />
                                    We respect your privacy. Read our{" "}
                                    <Link href="/privacy" className="text-white/45 hover:text-white underline underline-offset-2">
                                        Privacy Policy
                                    </Link>.
                                </p>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}

/** The countries a signature is most likely to come from, then the rest by name. */
const COUNTRIES: [string, string][] = [
    ["BA", "Bosnia and Herzegovina"], ["HR", "Croatia"], ["RS", "Serbia"], ["SI", "Slovenia"],
    ["ME", "Montenegro"], ["MK", "North Macedonia"], ["US", "United States"], ["GB", "United Kingdom"],
    ["DE", "Germany"], ["FR", "France"], ["IT", "Italy"], ["ES", "Spain"], ["PT", "Portugal"],
    ["NL", "Netherlands"], ["BE", "Belgium"], ["AT", "Austria"], ["CH", "Switzerland"],
    ["PL", "Poland"], ["CZ", "Czechia"], ["SK", "Slovakia"], ["HU", "Hungary"], ["RO", "Romania"],
    ["BG", "Bulgaria"], ["GR", "Greece"], ["TR", "Türkiye"], ["SE", "Sweden"], ["NO", "Norway"],
    ["DK", "Denmark"], ["FI", "Finland"], ["IE", "Ireland"], ["CA", "Canada"], ["MX", "Mexico"],
    ["BR", "Brazil"], ["AR", "Argentina"], ["AU", "Australia"], ["NZ", "New Zealand"],
    ["JP", "Japan"], ["KR", "South Korea"], ["IN", "India"], ["ZA", "South Africa"],
];
