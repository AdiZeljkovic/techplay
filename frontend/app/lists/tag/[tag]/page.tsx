import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Tag as TagIcon } from "lucide-react";
import { getApiUrl } from "@/lib/api";
import { fetchContent } from "@/lib/fetchContent";
import type { GameListPreview } from "@/lib/types/profile";
import ListsClient from "../../ListsClient";

type Props = { params: Promise<{ tag: string }> };

/** Tags arrive lowercase-ish and URL-encoded; this is what the reader sees. */
const pretty = (tag: string) => decodeURIComponent(tag).replace(/-/g, " ");

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { tag } = await params;
    const label = pretty(tag);

    return {
        // No layout between here and the root, so the root template appends
        // "| TechPlay" on its own. Writing it here as well doubled it.
        title: `${label} game lists`,
        description: `Rankings and tier lists tagged ${label}, made by the TechPlay community.`,
        alternates: { canonical: `/lists/tag/${tag}` },
        openGraph: {
            title: `${label} game lists`,
            description: `Rankings and tier lists tagged ${label}.`,
        },
    };
}

/**
 * One tag, and every published list wearing it.
 *
 * The field has existed since lists were expanded and one list of seven
 * bothered to fill it in — because a tag led nowhere. A tag that leads nowhere
 * is decoration; a tag with a page behind it is navigation, which is what it
 * does on every site where lists actually work.
 *
 * Indexed on purpose. These are the pages a search for "best horror games
 * ranked" should be able to land on, and until now the site offered nothing
 * between a single list and the whole directory.
 */
export const revalidate = 600;

export default async function ListsByTagPage({ params }: Props) {
    const { tag } = await params;

    const listing = await fetchContent<{ data: GameListPreview[] }>(
        `${getApiUrl()}/game-lists/discover?limit=20&tag=${encodeURIComponent(decodeURIComponent(tag))}`,
        { next: { revalidate: 600 } },
    ).catch(() => null);

    const lists = listing?.data ?? [];

    // A tag nobody uses has no page. Better a 404 than a handsome empty room
    // that a crawler will index and a reader will bounce off.
    if (lists.length === 0) notFound();

    return (
        <>
            <div className="container-page pt-6">
                <div className="flex flex-wrap items-center gap-3">
                    <Link
                        href="/lists"
                        className="inline-flex items-center gap-1.5 font-display text-[10px] font-bold uppercase tracking-[0.14em] text-white/40 hover:text-[var(--accent)] transition-colors"
                    >
                        <ArrowLeft className="w-3.5 h-3.5" /> All lists
                    </Link>
                    <span className="inline-flex items-center gap-1.5 h-[22px] px-2.5 rounded-full bg-[var(--accent-soft)] border border-[color-mix(in_srgb,var(--accent)_35%,transparent)] font-display text-[10px] font-black uppercase tracking-[0.1em] text-[var(--accent)]">
                        <TagIcon className="w-3 h-3" /> {pretty(tag)}
                    </span>
                    <span className="font-display text-[10px] font-bold uppercase tracking-[0.12em] tabular-nums text-white/30">
                        {lists.length} {lists.length === 1 ? "list" : "lists"}
                    </span>
                </div>
            </div>

            <ListsClient
                initialLists={lists}
                heading={pretty(tag)}
                blurb={`Every published ranking tagged ${pretty(tag)}.`}
            />
        </>
    );
}
