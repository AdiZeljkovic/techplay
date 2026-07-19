import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Gamepad2, ListChecks, Star } from "lucide-react";
import { getApiUrl } from "@/lib/api";
import type { GameListDetail } from "@/lib/types/profile";

type Props = { params: Promise<{ username: string; slug: string }> };

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

    return (
        <main className="min-h-screen">
            {/* Hero */}
            <div className="relative overflow-hidden border-b border-[var(--border)]">
                {list.covers?.[0] && (
                    <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={list.covers[0]} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20 blur-sm scale-105" />
                        <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-primary)] via-[var(--bg-primary)]/80 to-[var(--bg-primary)]/50" />
                    </>
                )}
                <div className="relative z-10 max-w-[1320px] mx-auto px-4 xl:px-0 py-14 md:py-20">
                    <p className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.16em] text-[var(--accent)] mb-3">
                        <ListChecks className="w-4 h-4" /> Game List
                    </p>
                    <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight mb-4">{list.name}</h1>
                    {list.description && (
                        <p className="text-[15px] text-white/60 leading-relaxed max-w-2xl mb-5">{list.description}</p>
                    )}
                    <div className="flex items-center gap-4 flex-wrap">
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
                        <span className="text-[12px] font-bold uppercase tracking-wider text-white/40">
                            {list.items_count} {list.items_count === 1 ? "game" : "games"}
                        </span>
                    </div>
                </div>
            </div>

            {/* Games */}
            <div className="max-w-[1320px] mx-auto px-4 xl:px-0 py-10">
                {items.length === 0 ? (
                    <div className="flex flex-col items-center gap-3 py-20 text-white/40">
                        <Gamepad2 className="w-10 h-10" />
                        <p className="text-[14px]">This list is empty — for now.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {items.map((it, i) => (
                            <Link
                                key={it.id}
                                href={`/games/${it.game!.slug}`}
                                prefetch={false}
                                className="group rounded-xl overflow-hidden bg-[var(--bg-card)] border border-[var(--border)] hover:border-[var(--accent)]/50 transition-all"
                            >
                                <div className="relative aspect-[3/4] overflow-hidden bg-[var(--bg-elevated)]">
                                    {it.game!.background_image ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            src={it.game!.background_image}
                                            alt={it.game!.name}
                                            loading={i < 6 ? "eager" : "lazy"}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <Gamepad2 className="w-8 h-8 text-white/10" />
                                        </div>
                                    )}
                                    <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded-md bg-black/70 text-[10px] font-black text-white/70 tabular-nums">
                                        #{i + 1}
                                    </span>
                                </div>
                                <div className="p-3">
                                    <p className="text-[12.5px] font-bold text-white line-clamp-1 group-hover:text-[var(--accent)] transition-colors">
                                        {it.game!.name}
                                    </p>
                                    <div className="flex items-center justify-between mt-1 text-[11px] text-white/35">
                                        <span>{it.game!.released ? it.game!.released.slice(0, 4) : "TBA"}</span>
                                        {it.game!.rating > 0 && (
                                            <span className="flex items-center gap-1">
                                                <Star className="w-3 h-3 text-amber-400 fill-amber-400" /> {Number(it.game!.rating).toFixed(1)}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}
