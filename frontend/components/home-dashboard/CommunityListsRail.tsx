"use client";

import Link from "next/link";
import useSWR from "swr";
import axios from "@/lib/axios";
import { ListOrdered, ArrowRight, Heart, Gamepad2 } from "lucide-react";
import Panel from "@/components/ui/Panel";
import type { GameListPreview } from "@/lib/types/profile";

const fetcher = (url: string) => axios.get(url).then((r) => r.data);

/**
 * What other people ranked.
 *
 * The community directory has existed since June and was linked from nowhere:
 * two members of fifty-four had ever made a list, and four of the seven that
 * existed were empty. Nobody writes for a page nobody can reach.
 *
 * This is the rail that was meant to sit on a logged-in homepage. There is no
 * such page — `/` is the same editorial front for everyone, and the comment on
 * the profile page claiming otherwise was wrong — so it sits where a member
 * actually lands, which is their own Overview.
 *
 * Its own endpoint rather than a field on /me/dashboard: the same pattern the
 * streak and quest widgets use, and this one is about other people, so it has
 * no business in a payload built from your account.
 */
export default function CommunityListsRail() {
    const { data } = useSWR<{ data: GameListPreview[] }>(
        "/game-lists/discover?limit=6",
        fetcher,
        { revalidateOnFocus: false },
    );

    const lists = data?.data ?? [];

    // A rail with nothing in it says the site is broken; a missing rail says
    // nothing at all, which is the truth while the directory is this young.
    if (lists.length === 0) return null;

    return (
        <Panel
            title="Ranked by the community"
            meta={
                <Link
                    href="/lists"
                    className="inline-flex items-center gap-1 font-display text-[9.5px] font-bold uppercase tracking-[0.12em] text-white/35 hover:text-[var(--accent)] transition-colors"
                >
                    All lists <ArrowRight className="w-3 h-3" />
                </Link>
            }
            bodyClassName="p-4"
        >
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {lists.map((l) => {
                    const art = l.cover_image ?? l.covers?.[0] ?? null;

                    return (
                        <Link
                            key={`${l.user?.username}/${l.slug}`}
                            href={`/lists/${l.user?.username}/${l.slug}`}
                            prefetch={false}
                            className="group flex flex-col rounded-[10px] overflow-hidden border border-white/[0.07] bg-white/[0.02] hover:border-[color-mix(in_srgb,var(--accent)_45%,transparent)] transition-colors"
                        >
                            <span className="relative block h-[74px] bg-white/[0.04]">
                                {art ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={art} alt="" aria-hidden loading="lazy" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="w-full h-full flex items-center justify-center text-white/12">
                                        <Gamepad2 className="w-5 h-5" />
                                    </span>
                                )}
                                <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-[var(--surface-1)] via-transparent to-transparent" />

                                {l.list_type === "tier" && (
                                    <span className="absolute top-1.5 left-1.5 inline-flex items-center h-[16px] px-1.5 rounded-[4px] bg-[var(--accent)] font-display text-[7.5px] font-black uppercase tracking-[0.1em] text-white">
                                        Tier
                                    </span>
                                )}
                            </span>

                            <span className="flex-1 flex flex-col p-2.5">
                                <span className="font-display text-[12px] font-bold text-white/85 leading-snug line-clamp-2 group-hover:text-[var(--accent)] transition-colors">
                                    {l.name}
                                </span>
                                <span className="mt-auto pt-2 flex items-center gap-2.5 font-display text-[9px] font-bold uppercase tracking-[0.1em] tabular-nums text-white/30">
                                    <span className="truncate">{l.user?.display_name || l.user?.username}</span>
                                    <span className="ml-auto inline-flex items-center gap-2 shrink-0">
                                        <span>{l.items_count}</span>
                                        {(l.likes_count ?? 0) > 0 && (
                                            <span className="inline-flex items-center gap-0.5">
                                                <Heart className="w-2.5 h-2.5" /> {l.likes_count}
                                            </span>
                                        )}
                                    </span>
                                </span>
                            </span>
                        </Link>
                    );
                })}
            </div>

            <Link
                href="/lists"
                className="mt-3 flex items-center justify-center gap-2 h-10 rounded-[8px] bg-white/[0.04] border border-white/[0.08] font-display text-[9.5px] font-black uppercase tracking-[0.12em] text-white/55 hover:text-white hover:bg-white/[0.08] transition-colors"
            >
                <ListOrdered className="w-3.5 h-3.5" /> Browse every list
            </Link>
        </Panel>
    );
}
