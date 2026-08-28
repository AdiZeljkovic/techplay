import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Gamepad2, ListChecks, Star } from "lucide-react";
import { getApiUrl } from "@/lib/api";
import { fetchContent } from "@/lib/fetchContent";
import ListSocialBar from "@/components/profile/ListSocialBar";
import type { GameListDetail } from "@/lib/types/profile";
import TierBoard from "@/components/profile/TierBoard";

type Props = { params: Promise<{ username: string; slug: string }> };

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://techplay.gg";

/** Gold, silver, bronze — the only three colours a podium is allowed. */
const MEDAL = ["#ffd700", "#d4d9e0", "#cd7f32"];

const TYPE_LABEL: Record<string, string> = {
    top10: "Top 10",
    top25: "Top 25",
    top100: "Top 100",
    genre: "Genre List",
    custom: "Ranking",
    tier: "Tier List",
};

async function fetchList(username: string, slug: string): Promise<GameListDetail | null> {
    const json = await fetchContent<{ data?: GameListDetail }>(
        `${getApiUrl()}/users/${encodeURIComponent(username)}/lists/${encodeURIComponent(slug)}`,
        { next: { revalidate: 300 } },
    );

    return json?.data ?? null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { username, slug } = await params;
    const list = await fetchList(username, slug);
    if (!list) return { title: "Game List", robots: { index: false, follow: false } };

    const owner = list.user?.display_name || list.user?.username || username;
    const description = list.description
        || `${list.items_count} games hand-picked by ${owner} on TechPlay.`;

    // A card that shows the arrangement and signs it. This used to hand the
    // network the list's first cover — a game's key art, with nothing on it to
    // say whose list it was or what it argued for.
    const ogImage = `${APP_URL}/og/list?username=${encodeURIComponent(username)}&slug=${encodeURIComponent(slug)}`;

    return {
        // The root layout's template appends "| TechPlay"; writing it here too
        // produced "… | TechPlay | TechPlay".
        title: `${list.name} — a game list by ${owner}`,
        description,
        alternates: { canonical: `${APP_URL}/lists/${username}/${slug}` },
        openGraph: {
            title: `${list.name} — game list by ${owner}`,
            description,
            images: [{ url: ogImage, width: 1200, height: 630, alt: `${list.name}, a game list by ${owner}` }],
        },
        twitter: {
            card: "summary_large_image",
            title: `${list.name} — game list by ${owner}`,
            description,
            images: [ogImage],
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

    // A genre list is a set, not a ranking — giving its first three a podium
    // would invent a claim its author never made. And a podium needs a list
    // under it: three cards over two rows is a podium that ate the list.
    const isTier = list.list_type === "tier";

    // Neither a genre list nor a tier list is a running order: one is a set,
    // the other groups equals. A podium on either invents a claim its author
    // never made.
    const ranked = list.list_type !== "genre" && !isTier;
    const podium = ranked && items.length >= 6 ? items.slice(0, 3) : [];
    const rest = items.slice(podium.length);

    return (
        <main className="min-h-screen bg-[var(--surface-0)]">
            {/* ── hero ──
                A published list is something somebody made and wants read, so
                the top of the page is given to the thing they made it about.

                Two backdrops, in order of what the author actually said:

                Their own artwork runs sharp and full-bleed. It used to be that
                the first game's cover was blurred to a quarter opacity behind
                everything — which made every list on the site look like the same
                list with a different name on it, and threw away the one picture
                the author chose.

                With no artwork, the game covers tile edge to edge instead. Six
                covers say "this is a list of games" at a glance; one cover
                blurred into mush says nothing at all. */}
            <div className="relative overflow-hidden border-b border-white/[0.07]">
                {list.cover_image ? (
                    <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={list.cover_image}
                            alt=""
                            aria-hidden
                            className="absolute inset-0 w-full h-full object-cover"
                        />
                        {/* Two stops rather than one: the text sits at the foot
                            of the block, so that end goes nearly solid while the
                            top keeps enough of the picture to be worth having. */}
                        <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-[var(--surface-0)] via-[var(--surface-0)]/88 to-[var(--surface-0)]/35" />
                        <span aria-hidden className="absolute inset-0 bg-[radial-gradient(120%_100%_at_50%_0%,transparent_35%,rgba(5,7,10,0.55))]" />
                    </>
                ) : (list.covers?.length ?? 0) > 0 ? (
                    <>
                        <span aria-hidden className="absolute inset-0 flex opacity-[0.22]">
                            {[...list.covers, ...list.covers, ...list.covers].slice(0, 8).map((src, i) => (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img key={i} src={src} alt="" className="h-full flex-1 min-w-0 object-cover" />
                            ))}
                        </span>
                        <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-[var(--surface-0)] via-[var(--surface-0)]/90 to-[var(--surface-0)]/60" />
                    </>
                ) : null}

                {/* The house rule, drawn across the seam. */}
                <span aria-hidden className="absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-transparent via-[var(--accent)] to-transparent opacity-60" />

                <div className="relative z-10 container-page py-14 md:py-20">
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                        <p className="inline-flex items-center gap-2 font-display text-[10.5px] font-bold uppercase tracking-[0.16em] text-[var(--accent)]">
                            <ListChecks className="w-4 h-4" /> Game List
                        </p>
                        {typeLabel && list.list_type !== "custom" && (
                            <span className="inline-flex items-center h-[20px] px-2 rounded-[4px] bg-[var(--accent)] font-display text-[8.5px] font-black uppercase tracking-[0.12em] text-white">
                                {typeLabel}
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
                        <span className="font-display text-[11px] font-bold uppercase tracking-[0.12em] tabular-nums text-white/55">
                            {list.items_count} {list.items_count === 1 ? "game" : "games"}
                        </span>
                        {(list.tags?.length ?? 0) > 0 && (
                            <span className="flex flex-wrap gap-1.5">
                                {/* A tag that leads nowhere is decoration. Each
                                    one is a door to every other list wearing
                                    it, which is what the field was for. */}
                                {list.tags!.map((t) => (
                                    <Link
                                        key={t}
                                        href={`/lists/tag/${encodeURIComponent(t)}`}
                                        className="inline-flex items-center h-[20px] px-2.5 rounded-full bg-white/[0.05] hover:bg-[var(--accent-soft)] border border-transparent hover:border-[color-mix(in_srgb,var(--accent)_35%,transparent)] text-[10px] font-bold text-white/45 hover:text-[var(--accent)] transition-colors"
                                    >
                                        {t}
                                    </Link>
                                ))}
                            </span>
                        )}
                    </div>

                    <ListSocialBar
                        listId={list.id}
                        ownerUsername={owner?.username ?? username}
                        slug={slug}
                        initialLikes={list.likes_count ?? 0}
                        allowComments={list.allow_comments ?? true}
                    />
                </div>
            </div>

            {/* ── the ranking ── */}
            <div className="container-page py-10 space-y-8">
                {items.length === 0 ? (
                    <div className="flex flex-col items-center gap-3 py-20 text-white/40">
                        <Gamepad2 className="w-10 h-10" />
                        <p className="text-[14px]">This list is empty — for now.</p>
                    </div>
                ) : isTier ? (
                    <TierBoard items={items} />
                ) : (
                    <>
                        {/* The top of a ranking is the whole argument. It was
                            drawn as row one of forty-seven with a slightly
                            larger number on it, so a list's headline pick had
                            the same weight as its also-rans. Three podium
                            cards, then the rest as the list they are.

                            Not on a genre list: that one is a set, and giving
                            its first three a podium would invent a claim its
                            author never made. */}
                        {podium.length > 0 && (
                            <section>
                                <h2 className="flex items-center gap-3 mb-4">
                                    <span className="font-display text-[10px] font-black uppercase tracking-[0.16em] text-white/50">The top {podium.length}</span>
                                    <span aria-hidden className="flex-1 h-px bg-white/[0.07]" />
                                </h2>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-stretch">
                                    {podium.map((it, i) => (
                                        <Link
                                            key={it.id}
                                            href={`/games/${it.game!.slug}`}
                                            prefetch={false}
                                            className="group relative flex flex-col rounded-[14px] overflow-hidden border bg-[var(--surface-1)] transition-colors duration-300"
                                            style={{ borderColor: `color-mix(in srgb, ${MEDAL[i]} 35%, transparent)` }}
                                        >
                                            <span className="relative block aspect-[16/10] overflow-hidden bg-white/[0.04]">
                                                {it.game!.cover_url ? (
                                                    // eslint-disable-next-line @next/next/no-img-element
                                                    <img
                                                        src={it.game!.cover_url}
                                                        alt={it.game!.name}
                                                        className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-700"
                                                    />
                                                ) : (
                                                    <span className="w-full h-full flex items-center justify-center text-white/15"><Gamepad2 className="w-8 h-8" /></span>
                                                )}
                                                <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

                                                <span
                                                    className="absolute top-3 left-3 flex items-center justify-center w-[38px] h-[38px] rounded-full font-display text-[19px] font-black tabular-nums leading-none text-black"
                                                    style={{ background: MEDAL[i], boxShadow: `0 4px 18px color-mix(in srgb, ${MEDAL[i]} 45%, transparent)` }}
                                                >
                                                    {i + 1}
                                                </span>

                                                {it.score != null && (
                                                    <span className="absolute top-3 right-3 flex flex-col items-center justify-center w-[52px] h-[42px] rounded-[9px] bg-black/60 backdrop-blur-md border border-white/[0.12]">
                                                        <span className="font-display text-[16px] font-black tabular-nums leading-none text-white">
                                                            {Number(it.score).toFixed(1)}
                                                        </span>
                                                        <span className="mt-0.5 font-display text-[7px] font-bold uppercase tracking-[0.14em] text-white/55">Score</span>
                                                    </span>
                                                )}
                                            </span>

                                            <span className="flex-1 flex flex-col p-4">
                                                <span className="flex items-baseline gap-2.5 min-w-0">
                                                    <span className="font-display text-[16px] font-black text-white leading-tight line-clamp-1 group-hover:text-[var(--accent)] transition-colors">
                                                        {it.game!.name}
                                                    </span>
                                                    <span className="shrink-0 font-display text-[10px] font-bold uppercase tracking-[0.12em] tabular-nums text-white/45">
                                                        {it.game!.released ? it.game!.released.slice(0, 4) : "TBA"}
                                                    </span>
                                                </span>
                                                {it.game!.rating > 0 && (
                                                    <span className="mt-1.5 inline-flex items-center gap-1 font-display text-[11px] font-bold tabular-nums text-amber-400/80">
                                                        <Star className="w-3 h-3 fill-current" /> {Number(it.game!.rating).toFixed(1)}
                                                    </span>
                                                )}
                                                {it.note && (
                                                    <span className="mt-2.5 text-[12.5px] text-white/55 leading-snug line-clamp-4">{it.note}</span>
                                                )}
                                            </span>
                                        </Link>
                                    ))}
                                </div>
                            </section>
                        )}

                        {rest.length > 0 && (
                            <section>
                                {podium.length > 0 && (
                                    <h2 className="flex items-center gap-3 mb-4">
                                        <span className="font-display text-[10px] font-black uppercase tracking-[0.16em] text-white/50">
                                            {podium.length + 1}–{items.length}
                                        </span>
                                        <span aria-hidden className="flex-1 h-px bg-white/[0.07]" />
                                    </h2>
                                )}
                                <div className="space-y-2.5">
                                    {rest.map((it, idx) => {
                                        const rank = podium.length + idx + 1;

                                        return (
                                            <Link
                                                key={it.id}
                                                href={`/games/${it.game!.slug}`}
                                                prefetch={false}
                                                className="group flex items-center gap-4 p-3 rounded-[12px] border border-white/[0.07] bg-white/[0.02] hover:border-[color-mix(in_srgb,var(--accent)_45%,transparent)] transition-colors duration-300"
                                            >
                                                <span className="shrink-0 w-10 text-center font-display text-[20px] font-black tabular-nums leading-none text-white/50">
                                                    {rank}
                                                </span>

                                                {/* 3:4, the shape a game wears everywhere
                                                    else on this site. A 112×64 letterbox
                                                    crops key art to a strip of sky. */}
                                                <span className="relative w-[56px] shrink-0 aspect-[3/4] rounded-[8px] overflow-hidden bg-white/[0.04] border border-white/[0.06]">
                                                    {it.game!.cover_url ? (
                                                        // eslint-disable-next-line @next/next/no-img-element
                                                        <img
                                                            src={it.game!.cover_url}
                                                            alt={it.game!.name}
                                                            loading={idx < 6 ? "eager" : "lazy"}
                                                            className="w-full h-full object-cover group-hover:scale-[1.05] transition-transform duration-500"
                                                        />
                                                    ) : (
                                                        <span className="w-full h-full flex items-center justify-center text-white/15"><Gamepad2 className="w-5 h-5" /></span>
                                                    )}
                                                </span>

                                                <span className="min-w-0 flex-1">
                                                    <span className="flex items-center gap-2.5 min-w-0">
                                                        <span className="font-display text-[15px] font-bold text-white truncate group-hover:text-[var(--accent)] transition-colors">
                                                            {it.game!.name}
                                                        </span>
                                                        <span className="shrink-0 font-display text-[10px] font-bold uppercase tracking-[0.12em] tabular-nums text-white/45">
                                                            {it.game!.released ? it.game!.released.slice(0, 4) : "TBA"}
                                                        </span>
                                                        {it.game!.rating > 0 && (
                                                            <span className="shrink-0 inline-flex items-center gap-1 text-[11px] tabular-nums text-white/50">
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
                                                        <span className="mt-0.5 font-display text-[7.5px] font-bold uppercase tracking-[0.14em] text-white/50">
                                                            Score
                                                        </span>
                                                    </span>
                                                )}
                                            </Link>
                                        );
                                    })}
                                </div>
                            </section>
                        )}

                        {owner && (
                            <p className="pt-2 text-center">
                                <Link
                                    href={`/profile/${owner.username}?tab=lists`}
                                    className="inline-flex items-center gap-2 h-10 px-5 rounded-[8px] bg-white/[0.04] hover:bg-white/[0.09] border border-white/[0.12] font-display text-[10.5px] font-bold uppercase tracking-[0.1em] text-white transition-colors"
                                >
                                    <ListChecks className="w-3.5 h-3.5" />
                                    More lists by {owner.display_name || owner.username}
                                </Link>
                            </p>
                        )}
                    </>
                )}
            </div>

            {/* A ranked list is the textbook ItemList, and this one had no
                structured data at all — on a site whose game database exists
                for search reach. */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "ItemList",
                        name: list.name,
                        description: list.description ?? undefined,
                        url: `${APP_URL}/lists/${username}/${slug}`,
                        numberOfItems: items.length,
                        itemListOrder: "https://schema.org/ItemListOrderDescending",
                        author: owner ? { "@type": "Person", name: owner.display_name || owner.username } : undefined,
                        itemListElement: items.slice(0, 100).map((it, i) => ({
                            "@type": "ListItem",
                            position: i + 1,
                            url: `${APP_URL}/games/${it.game!.slug}`,
                            name: it.game!.name,
                        })),
                    }),
                }}
            />
        </main>
    );
}
