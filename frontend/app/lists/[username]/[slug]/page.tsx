import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Gamepad2, ListChecks, Star, AlertTriangle } from "lucide-react";
import { getApiUrl } from "@/lib/api";
import ListSocialBar from "@/components/profile/ListSocialBar";
import type { GameListDetail } from "@/lib/types/profile";

type Props = { params: Promise<{ username: string; slug: string }> };

const TYPE_LABEL: Record<string, string> = {
    top10: "Top 10",
    top25: "Top 25",
    top100: "Top 100",
    genre: "Genre List",
    custom: "Ranking",
};

async function fetchList(username: string, slug: string): Promise<GameListDetail | null> {
    try {
        const res = await fetch(
            `${getApiUrl()}/users/${encodeURIComponent(username)}/lists/${encodeURIComponent(slug)}`,
            { next: { revalidate: 300 } }
        );
        if (!res.ok) return null;
        const json = await res.json();
        return json.data ?? null;
    } catch {
        return null;
    }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { username, slug } = await params;
    const list = await fetchList(username, slug);
    if (!list) return { title: "Game List — TechPlay" };

    const owner = list.user?.display_name || list.user?.username || username;
    const description = list.description
        || `${list.items_count} games hand-picked by ${owner} on TechPlay.`;

    return {
        title: `${list.name} — a game list by ${owner} | TechPlay`,
        description,
        openGraph: {
            title: `${list.name} — game list by ${owner}`,
            description,
            images: list.covers?.[0] ? [{ url: list.covers[0] }] : undefined,
        },
    };
}

export default async function GameListPage({ params }: Props) {
    const { username, slug } = await params;
    const list = await fetchList(username, slug);
    if (!list) notFound();

    const owner = list.user;
    const items = (list.items ?? []).filter((it) => it.game);
    const typeLabel = list.list_type ? TYPE_LABEL[list.list_type] : null;

    return (
        <main className="min-h-screen bg-[var(--surface-0)]">
            {/* ── hero ── */}
            <div className="relative overflow-hidden border-b border-white/[0.07]">
                {list.covers?.[0] && (
                    <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={list.covers[0]} alt="" className="absolute inset-0 w-full h-full object-cover opacity-25 blur-sm scale-105" />
                        <div className="absolute inset-0 bg-gradient-to-t from-[var(--surface-0)] via-[var(--surface-0)]/85 to-[var(--surface-0)]/55" />
                    </>
                )}

                <div className="relative z-10 max-w-[1320px] mx-auto px-4 xl:px-0 py-14 md:py-20">
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                        <p className="inline-flex items-center gap-2 font-display text-[10.5px] font-bold uppercase tracking-[0.16em] text-[var(--accent)]">
                            <ListChecks className="w-4 h-4" /> Game List
                        </p>
                        {typeLabel && list.list_type !== "custom" && (
                            <span className="inline-flex items-center h-[20px] px-2 rounded-[4px] bg-[var(--accent)] font-display text-[8.5px] font-black uppercase tracking-[0.12em] text-white">
                                {typeLabel}
                            </span>
                        )}
                        {list.has_spoilers && (
                            <span className="inline-flex items-center gap-1 h-[20px] px-2 rounded-[4px] bg-amber-500/20 border border-amber-500/40 font-display text-[8.5px] font-black uppercase tracking-[0.12em] text-amber-400">
                                <AlertTriangle className="w-2.5 h-2.5" /> Contains spoilers
                            </span>
                        )}
                    </div>

                    <h1 className="font-display text-3xl md:text-5xl font-black text-white tracking-tight mb-4">{list.name}</h1>

                    {list.description && (
                        <p className="text-[15px] text-white/60 leading-relaxed max-w-2xl mb-5">{list.description}</p>
                    )}

                    <div className="flex items-center gap-4 flex-wrap mb-6">
                        {owner && (
                            <Link href={`/profile/${owner.username}`} className="group flex items-center gap-2.5">
                                <span className="w-9 h-9 rounded-full overflow-hidden bg-white/[0.06] border border-white/10 flex items-center justify-center shrink-0">
                                    {owner.avatar_url ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={owner.avatar_url} alt={owner.username} className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-[13px] font-black text-[var(--accent)]">{owner.username.charAt(0).toUpperCase()}</span>
                                    )}
                                </span>
                                <span className="text-[13px] font-bold text-white/80 group-hover:text-[var(--accent)] transition-colors">
                                    {owner.display_name || owner.username}
                                </span>
                            </Link>
                        )}
                        <span className="font-display text-[11px] font-bold uppercase tracking-[0.12em] tabular-nums text-white/40">
                            {list.items_count} {list.items_count === 1 ? "game" : "games"}
                        </span>
                        {(list.tags?.length ?? 0) > 0 && (
                            <span className="flex flex-wrap gap-1.5">
                                {list.tags!.map((t) => (
                                    <span key={t} className="inline-flex items-center h-[20px] px-2.5 rounded-full bg-white/[0.05] text-[10px] font-bold text-white/45">
                                        {t}
                                    </span>
                                ))}
                            </span>
                        )}
                    </div>

                    <ListSocialBar
                        listId={list.id}
                        ownerUsername={owner?.username ?? username}
                        initialLikes={list.likes_count ?? 0}
                        allowComments={list.allow_comments ?? true}
                    />
                </div>
            </div>

            {/* ── the ranking ── */}
            <div className="max-w-[1320px] mx-auto px-4 xl:px-0 py-10">
                {items.length === 0 ? (
                    <div className="flex flex-col items-center gap-3 py-20 text-white/40">
                        <Gamepad2 className="w-10 h-10" />
                        <p className="text-[14px]">This list is empty — for now.</p>
                    </div>
                ) : (
                    <div className="space-y-2.5">
                        {items.map((it, i) => (
                            <Link
                                key={it.id}
                                href={`/games/${it.game!.slug}`}
                                prefetch={false}
                                className="group flex items-center gap-4 p-3 rounded-[12px] border border-white/[0.07] bg-white/[0.02] hover:border-[color-mix(in_srgb,var(--accent)_45%,transparent)] transition-colors duration-300"
                            >
                                {/* the rank is the point of a ranked list */}
                                <span className={`shrink-0 w-10 text-center font-display font-black tabular-nums leading-none ${
                                    i < 3 ? "text-[26px] text-[var(--accent)]" : "text-[20px] text-white/30"
                                }`}>
                                    {i + 1}
                                </span>

                                <span className="relative w-[112px] h-[64px] shrink-0 rounded-[8px] overflow-hidden bg-white/[0.04]">
                                    {it.game!.background_image ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            src={it.game!.background_image}
                                            alt={it.game!.name}
                                            loading={i < 6 ? "eager" : "lazy"}
                                            className="w-full h-full object-cover group-hover:scale-[1.05] transition-transform duration-500"
                                        />
                                    ) : (
                                        <span className="w-full h-full flex items-center justify-center text-white/15"><Gamepad2 className="w-6 h-6" /></span>
                                    )}
                                </span>

                                <span className="min-w-0 flex-1">
                                    <span className="flex items-center gap-2.5 min-w-0">
                                        <span className="font-display text-[15px] font-bold text-white truncate group-hover:text-[var(--accent)] transition-colors">
                                            {it.game!.name}
                                        </span>
                                        <span className="shrink-0 font-display text-[10px] font-bold uppercase tracking-[0.12em] tabular-nums text-white/25">
                                            {it.game!.released ? it.game!.released.slice(0, 4) : "TBA"}
                                        </span>
                                        {it.game!.rating > 0 && (
                                            <span className="shrink-0 inline-flex items-center gap-1 text-[11px] tabular-nums text-white/35">
                                                <Star className="w-3 h-3 text-amber-400 fill-amber-400" /> {Number(it.game!.rating).toFixed(1)}
                                            </span>
                                        )}
                                    </span>

                                    {/* the argument for the rank — the whole reason
                                        this is a list and not a folder */}
                                    {it.note && (
                                        <span className="block mt-1.5 text-[12.5px] text-white/50 leading-snug line-clamp-2">{it.note}</span>
                                    )}
                                </span>

                                {it.score != null && (
                                    <span className="shrink-0 flex flex-col items-center justify-center w-[58px] h-[46px] rounded-[8px] bg-[var(--accent-soft)] border border-[color-mix(in_srgb,var(--accent)_30%,transparent)]">
                                        <span className="font-display text-[17px] font-black tabular-nums leading-none text-[var(--accent)]">
                                            {Number(it.score).toFixed(1)}
                                        </span>
                                        <span className="mt-0.5 font-display text-[7.5px] font-bold uppercase tracking-[0.14em] text-white/30">
                                            Score
                                        </span>
                                    </span>
                                )}
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}
