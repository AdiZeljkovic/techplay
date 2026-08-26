"use client";

import Link from "next/link";
import { Heart, MessageSquare, ListOrdered, Plus } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import type { GameListPreview, ListType } from "@/lib/types/profile";

/** The badge on a list that declares its shape. Custom rankings wear nothing. */
const TYPE_LABEL: Partial<Record<ListType, string>> = {
    top10: "Top 10",
    top25: "Top 25",
    top100: "Top 100",
    genre: "Genre",
    // The badge that tells a browser this one is a board, not a running order.
    tier: "Tier list",
};

/**
 * Four covers, or as many as the list has.
 *
 * A list is a ranking, so the covers are laid in rank order left to right and
 * the first one is given the room — that is the pick the list is arguing for.
 */
function CoverStrip({ cover, covers, name }: { cover?: string | null; covers: string[]; name: string }) {
    // The author's own artwork outranks a mosaic of what is inside. It is the
    // one picture that says which list this is rather than what is in it.
    if (cover) {
        return (
            <span className="relative block w-full h-[104px] rounded-[8px] overflow-hidden bg-white/[0.04]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={cover} alt={name} loading="lazy" className="w-full h-full object-cover" />
            </span>
        );
    }

    const shown = (covers ?? []).slice(0, 4);

    if (shown.length === 0) {
        return (
            <span className="flex items-center justify-center w-full h-[104px] rounded-[8px] bg-white/[0.03] border border-white/[0.06]">
                <ListOrdered className="w-5 h-5 text-white/15" />
            </span>
        );
    }

    return (
        <span className="flex items-stretch gap-1 h-[104px]">
            {shown.map((src, i) => (
                <span
                    key={src + i}
                    className={`relative overflow-hidden rounded-[8px] bg-white/[0.04] ${i === 0 ? "flex-[1.6]" : "flex-1"}`}
                >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={src}
                        alt={i === 0 ? `Top pick in ${name}` : ""}
                        aria-hidden={i > 0}
                        loading="lazy"
                        className="w-full h-full object-cover"
                    />
                </span>
            ))}
        </span>
    );
}

function ListCard({ list }: { list: GameListPreview }) {
    const author = list.user?.username;
    const badge = list.list_type ? TYPE_LABEL[list.list_type] : undefined;

    return (
        <Link
            href={`/lists/${author}/${list.slug}`}
            className="group flex flex-col gap-3 p-3 rounded-[var(--radius-card)] border border-[var(--line)] bg-[var(--surface-1)] hover:border-[color-mix(in_srgb,var(--accent)_45%,transparent)] transition-colors duration-300"
        >
            <CoverStrip cover={list.cover_image} covers={list.covers} name={list.name} />

            <span className="flex items-start justify-between gap-2.5">
                <span className="min-w-0">
                    <span className="block font-display text-[14px] font-black text-white leading-snug line-clamp-2 group-hover:text-[var(--accent)] transition-colors duration-300">
                        {list.name}
                    </span>
                    {author && (
                        <span className="mt-1 block text-[11.5px] font-semibold text-white/35">@{author}</span>
                    )}
                </span>

                {badge && (
                    <span className="shrink-0 inline-flex items-center h-[18px] px-1.5 rounded-[4px] bg-[var(--accent)] font-display text-[8px] font-black uppercase tracking-[0.1em] text-white">
                        {badge}
                    </span>
                )}
            </span>

            <span className="flex items-center gap-3.5 font-display text-[9.5px] font-bold uppercase tracking-[0.12em] tabular-nums text-white/30">
                <span>{list.items_count} {list.items_count === 1 ? "game" : "games"}</span>
                <span className="inline-flex items-center gap-1"><Heart className="w-3 h-3" /> {list.likes_count ?? 0}</span>
                <span className="inline-flex items-center gap-1"><MessageSquare className="w-3 h-3" /> {list.comments_count ?? 0}</span>
            </span>
        </Link>
    );
}

export default function ListsClient({
    initialLists,
    heading,
    blurb,
}: {
    initialLists: GameListPreview[];
    /** A tag page reuses this shell and says which tag it is showing. */
    heading?: string;
    blurb?: string;
}) {
    const { user } = useAuth();
    const lists = initialLists;

    // Your own lists live on your profile, not here — this page is what other
    // people made. Signed out, the same button is the reason to sign in.
    const mineHref = user?.username ? `/profile/${user.username}?tab=lists` : "/login";

    return (
        <main className="min-h-screen bg-[var(--surface-0)] bg-hud-grid">
            <section className="relative overflow-hidden border-b border-white/[0.07]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src="/images/page-hero.webp"
                    alt=""
                    aria-hidden
                    className="absolute inset-0 w-full h-full object-cover object-center"
                />
                <span aria-hidden className="absolute inset-0 bg-[radial-gradient(58%_120%_at_50%_45%,rgba(5,7,10,0.82),rgba(5,7,10,0.55)_72%)]" />
                <span aria-hidden className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[var(--surface-0)] to-transparent" />

                <div className="relative z-10 container-page py-5 md:py-12 text-center">
                    <h1 className="font-display font-black tracking-tight text-[28px] md:text-[58px] leading-none uppercase">
                        {heading ? (
                            <span className="text-[var(--accent)]">{heading}</span>
                        ) : (
                            <>
                                <span className="text-white">GAME </span>
                                <span className="text-[var(--accent)]">LISTS</span>
                            </>
                        )}
                    </h1>

                    <p className="hidden md:block mt-3 max-w-[680px] mx-auto text-[13px] text-white/45">
                        {blurb ?? "Rankings people made — Top 10s, Top 100s and genre lists, with the games in the order somebody put them."}
                    </p>

                    <Link
                        href={mineHref}
                        className="mt-5 inline-flex items-center justify-center gap-2 h-10 px-4 rounded-[8px] bg-[var(--accent)] font-display text-[11.5px] font-bold uppercase tracking-[0.08em] text-white hover:brightness-110 transition-[filter] duration-300"
                    >
                        <Plus className="w-3.5 h-3.5" /> {user ? "Your lists" : "Sign in to make one"}
                    </Link>
                </div>
            </section>

            <div className="container-page py-8">
                {lists.length === 0 ? (
                    <div className="flex flex-col items-center text-center py-16">
                        <ListOrdered className="w-7 h-7 text-white/15" />
                        <p className="mt-4 font-display text-[13px] font-black uppercase tracking-[0.14em] text-white">
                            No public lists yet
                        </p>
                        <p className="mt-2 max-w-[420px] text-[12.5px] text-white/40">
                            A list shows up here once its author publishes it. Yours can be the first.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
                        {lists.map((list) => (
                            <ListCard key={list.id} list={list} />
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}
