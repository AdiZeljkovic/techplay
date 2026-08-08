"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import axios from "@/lib/axios";
import { Heart, Bell, BellRing, Check, Loader2, ExternalLink, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import Panel from "@/components/ui/Panel";
import TrailerPlayer from "@/components/games/TrailerPlayer";
import type { Release } from "./page";

/** Store buttons carry the storefront's own colour, which is how people find them. */
const STORE_TINTS: Record<string, string> = {
    steam: "#1b7fd4",
    playstation: "#2f6fe4",
    xbox: "#22a05a",
    nintendo: "#e4404a" };

export default function ReleaseClient({ release }: { release: Release }) {
    const { user } = useAuth();

    const [wishlisted, setWishlisted] = useState(release.wishlisted);
    const [reminder, setReminder] = useState(release.reminder);
    const [wishlists, setWishlists] = useState(release.wishlists);
    const [busy, setBusy] = useState<"wishlist" | "reminder" | null>(null);
    const [lightbox, setLightbox] = useState<string | null>(null);

    const act = async (kind: "wishlist" | "reminder") => {
        if (!user) return toast.error("Sign in to track releases.");
        setBusy(kind);

        try {
            if (kind === "wishlist") {
                await axios.put(`/collection/games/${release.slug}`, { status: "wishlist" });
                setWishlisted(true);
                setWishlists((n) => n + 1);
                toast.success(`${release.name} wishlisted.`);
            } else {
                const res = await axios.post(`/calendar/${release.slug}/reminder`);
                setReminder(Boolean(res.data?.data?.reminder));
                if (res.data?.data?.wishlisted && !wishlisted) {
                    setWishlisted(true);
                    setWishlists((n) => n + 1);
                }
                toast.success(res.data?.message ?? "Reminder updated.");
            }
        } catch (e: unknown) {
            const message = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
            toast.error(message ?? "That didn't work.");
        } finally {
            setBusy(null);
        }
    };

    return (
        <>
            <div className="container-page py-6 grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
                <div className="xl:col-span-8 min-w-0 space-y-5">
                    {/* ── trailer, if a studio cut one ── */}
                    {release.trailers.length > 0 && (
                        <Panel title="Trailer" padding="none">
                            <TrailerPlayer src={release.trailers[0]} poster={release.cover_url} />
                        </Panel>
                    )}

                    {release.description && (
                        <Panel title="About">
                            <p className="text-[13.5px] leading-relaxed text-white/65 whitespace-pre-line">
                                {release.description}
                            </p>
                        </Panel>
                    )}

                    {release.screenshots.length > 0 && (
                        <Panel title={`Screenshots (${release.screenshots.length})`}>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {release.screenshots.map((shot) => (
                                    <button
                                        key={shot}
                                        onClick={() => setLightbox(shot)}
                                        className="relative block aspect-video rounded-[8px] overflow-hidden border border-white/[0.07] hover:border-[color-mix(in_srgb,var(--accent)_45%,transparent)] transition-colors"
                                    >
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={shot} alt="" loading="lazy" className="w-full h-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        </Panel>
                    )}
                </div>

                {/* ── sidebar ── */}
                <div className="xl:col-span-4 min-w-0 space-y-5">
                    <Panel title="Track this release">
                        <div className="space-y-2.5">
                            <button
                                onClick={() => act("wishlist")}
                                disabled={busy !== null || wishlisted}
                                className={`btn-command w-full inline-flex items-center justify-center gap-2 h-10 font-display text-[11px] font-black uppercase tracking-[0.1em] transition-colors ${
                                    wishlisted
                                        ? "bg-[var(--accent)]/15 text-[var(--accent)]"
                                        : "bg-[var(--accent)] hover:brightness-110 text-white"
                                }`}
                            >
                                {busy === "wishlist" ? <Loader2 className="w-4 h-4 animate-spin" />
                                    : wishlisted ? <Check className="w-4 h-4" />
                                    : <Heart className="w-4 h-4" />}
                                {wishlisted ? "Wishlisted" : "Add to wishlist"}
                            </button>

                            <button
                                onClick={() => act("reminder")}
                                disabled={busy !== null}
                                className={`btn-command btn-command-quiet w-full inline-flex items-center justify-center gap-2 h-10 font-display text-[11px] font-black uppercase tracking-[0.1em] transition-colors ${
                                    reminder
                                        ? "bg-[var(--accent)]/12 text-[var(--accent)]"
                                        : "bg-white/[0.05] text-white/55 hover:text-white"
                                }`}
                            >
                                {busy === "reminder" ? <Loader2 className="w-4 h-4 animate-spin" />
                                    : reminder ? <BellRing className="w-4 h-4" />
                                    : <Bell className="w-4 h-4" />}
                                {reminder ? "We'll tell you" : "Remind me on release day"}
                            </button>

                            {wishlists > 0 && (
                                <p className="pt-1 text-center text-[11.5px] text-white/35">
                                    {wishlists === 1 ? "1 person here is waiting" : `${wishlists} people here are waiting`}
                                </p>
                            )}
                        </div>
                    </Panel>

                    {/* The one thing this page has that a games database page
                        does not: where the thing will actually be sold. */}
                    {release.stores.length > 0 && (
                        <Panel title="Where to get it">
                            <div className="space-y-2">
                                {release.stores.map((store) => (
                                    <a
                                        key={store.store}
                                        href={store.url}
                                        target="_blank"
                                        rel="noopener noreferrer nofollow"
                                        className="flex items-center justify-between gap-3 h-10 px-3 rounded-[8px] border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06] transition-colors group"
                                    >
                                        <span className="flex items-center gap-2.5">
                                            <span
                                                aria-hidden
                                                className="w-1.5 h-1.5 rounded-full"
                                                style={{ background: STORE_TINTS[store.store] ?? "var(--accent)" }}
                                            />
                                            <span className="font-display text-[11.5px] font-bold text-white/80 group-hover:text-white">
                                                {store.label}
                                            </span>
                                        </span>
                                        <ExternalLink className="w-3.5 h-3.5 text-white/25 group-hover:text-[var(--accent)]" />
                                    </a>
                                ))}
                            </div>
                        </Panel>
                    )}

                    {release.genres.length > 0 && (
                        <Panel title="Genres">
                            <div className="flex flex-wrap gap-1.5">
                                {release.genres.map((genre) => (
                                    <span
                                        key={genre}
                                        className="inline-flex items-center h-[26px] px-2.5 rounded-[6px] bg-white/[0.05] border border-white/[0.07] text-[11.5px] text-white/60"
                                    >
                                        {genre}
                                    </span>
                                ))}
                            </div>
                        </Panel>
                    )}
                </div>
            </div>

            {/* ── screenshot lightbox ── */}
            {lightbox && (
                <div
                    className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-6"
                    onClick={() => setLightbox(null)}
                    role="presentation"
                >
                    <button
                        onClick={() => setLightbox(null)}
                        aria-label="Close"
                        className="absolute top-5 right-5 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
                    >
                        <X className="w-4 h-4" />
                    </button>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={lightbox} alt="" className="max-w-full max-h-full rounded-[10px]" />
                </div>
            )}
        </>
    );
}
