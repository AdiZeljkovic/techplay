import type { Metadata } from "next";
import Link from "next/link";
import {
    Disc3, ShieldCheck, Library, Users2, HandCoins, Repeat2, Scale, MessageSquare, ArrowRight,
} from "lucide-react";
import { getServerApiUrl } from "@/lib/api";
import LastDiscClient from "./LastDiscClient";

export const revalidate = 900;

export const metadata: Metadata = {
    title: "The Last Disc",
    description:
        "An open letter from players around the world asking Sony to keep physical PlayStation games alive beyond 2028. Sign it, and see where the count stands.",
    alternates: { canonical: "https://techplay.gg/last-disc" },
    openGraph: {
        title: "The Last Disc — keep physical PlayStation games alive",
        description: "An open letter from players asking Sony to keep physical PlayStation games beyond 2028.",
        url: "https://techplay.gg/last-disc",
        type: "website",
        siteName: "TechPlay",
    },
    twitter: {
        card: "summary_large_image",
        title: "The Last Disc — keep physical PlayStation games alive",
        description: "An open letter from players asking Sony to keep physical PlayStation games beyond 2028.",
    },
};

/** What the campaign is about, in four words and four lines. */
const BANNER = [
    { icon: Scale, title: "Player choice", body: "Keep the option to own" },
    { icon: ShieldCheck, title: "Preservation", body: "Protect gaming history" },
    { icon: Library, title: "Collecting", body: "Keep physical alive" },
    { icon: Users2, title: "Community", body: "Our voices, together" },
];

/** The argument, five ways. */
const REASONS = [
    { icon: Disc3, title: "Ownership", body: "When you buy a disc, you own the game." },
    { icon: ShieldCheck, title: "Preservation", body: "Physical games help protect gaming history for future generations." },
    { icon: HandCoins, title: "Affordability", body: "Used games and local markets make gaming more accessible." },
    { icon: Repeat2, title: "Sharing", body: "Lend, trade and play together with friends and family." },
    { icon: Scale, title: "Choice", body: "Digital is great. But choice makes the industry stronger, not weaker." },
];

interface Coverage {
    id: number;
    title: string;
    slug: string;
    type?: string;
    image?: string | null;
    url?: string;
}

/**
 * What we have written about this.
 *
 * A search rather than a hand-kept list: the section fills itself as the desk
 * covers the story, and shows nothing at all until there is something to show.
 * An empty "Latest coverage" heading is worse than no heading.
 */
async function getCoverage(): Promise<Coverage[]> {
    try {
        const res = await fetch(`${getServerApiUrl()}/search/articles?q=physical`, {
            next: { revalidate: 900 },
        });

        if (!res.ok) return [];

        const data = await res.json();

        return (data?.results ?? []).slice(0, 4);
    } catch {
        return [];
    }
}

export default async function LastDiscPage() {
    const coverage = await getCoverage();

    return (
        <main className="min-h-screen bg-[var(--surface-0)] pb-14">
            {/* ══ hero ══ */}
            <section className="relative overflow-hidden border-b border-white/[0.07]">
                <span
                    aria-hidden
                    className="absolute inset-0"
                    style={{
                        background:
                            "radial-gradient(90% 120% at 22% 45%, color-mix(in srgb, var(--accent) 20%, transparent), transparent 62%), radial-gradient(80% 100% at 80% 20%, rgba(37,99,235,0.14), transparent 60%)",
                    }}
                />
                <span aria-hidden className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[var(--surface-0)] to-transparent" />

                <div className="relative z-10 container-page py-14 lg:py-20 text-center">
                    <h1 className="font-display font-black uppercase leading-[0.86] tracking-tight text-[46px] sm:text-[68px] lg:text-[86px]">
                        <span className="text-white">The Last </span>
                        <span className="text-[var(--accent)]">Disc</span>
                    </h1>

                    <p className="mt-5 mx-auto max-w-[620px] text-[14px] sm:text-[15px] leading-relaxed text-white/55">
                        An open letter from players around the world asking Sony to keep physical PlayStation games alive.
                    </p>

                    {/* the four words, on one rule */}
                    <div className="mt-9 mx-auto max-w-[900px] grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-5 border-t border-white/[0.09] pt-6">
                        {BANNER.map(({ icon: Icon, title, body }, i) => (
                            <div
                                key={title}
                                className={`flex items-center gap-3 justify-center ${
                                    i > 0 ? "lg:border-l lg:border-white/[0.07] lg:pl-6" : ""
                                }`}
                            >
                                <Icon className="w-5 h-5 shrink-0 text-[var(--accent)]" strokeWidth={1.6} />
                                <span className="text-left">
                                    <span className="block font-display text-[10.5px] font-black uppercase tracking-[0.14em] text-white">
                                        {title}
                                    </span>
                                    <span className="mt-0.5 block text-[11px] text-white/35">{body}</span>
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* countdown, poll and the letter are all live */}
            <div className="mt-5">
                <LastDiscClient />
            </div>

            {/* ══ why it matters ══ */}
            <section className="container-page mt-10">
                <h2 className="text-center font-display text-[12px] font-black uppercase tracking-[0.2em] text-white/45">
                    Why physical games still matter
                </h2>

                <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                    {REASONS.map(({ icon: Icon, title, body }) => (
                        <div
                            key={title}
                            className="rounded-[var(--radius-panel)] border border-white/[0.07] bg-[var(--surface-1)] p-4 hover:border-[color-mix(in_srgb,var(--accent)_35%,transparent)] transition-colors"
                        >
                            <Icon className="w-5 h-5 text-[var(--accent)]" strokeWidth={1.6} />
                            <p className="mt-3.5 font-display text-[11.5px] font-black uppercase tracking-[0.12em] text-white">
                                {title}
                            </p>
                            <p className="mt-1.5 text-[12px] leading-snug text-white/40">{body}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ══ coverage + the forum ══ */}
            <section className="container-page mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
                {coverage.length > 0 && (
                    <div className="rounded-[var(--radius-panel)] border border-white/[0.07] bg-[var(--surface-1)] p-5">
                        <div className="flex items-center justify-between gap-3 mb-4">
                            <h2 className="font-display text-[11px] font-black uppercase tracking-[0.16em] text-white/55">
                                Latest coverage
                            </h2>
                            <Link href="/news" className="font-display text-[10px] font-black uppercase tracking-[0.12em] text-[var(--accent)] hover:brightness-125 transition-[filter]">
                                All articles →
                            </Link>
                        </div>

                        <div className="divide-y divide-white/[0.05]">
                            {coverage.map((item) => (
                                <Link
                                    key={item.id}
                                    href={item.url ?? `/news/${item.slug}`}
                                    className="group flex items-center gap-3 py-3 first:pt-0"
                                >
                                    {item.image ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={item.image} alt="" aria-hidden loading="lazy" className="w-[86px] h-[54px] shrink-0 rounded-[7px] object-cover" />
                                    ) : (
                                        <span className="w-[86px] h-[54px] shrink-0 rounded-[7px] bg-white/[0.04]" />
                                    )}
                                    <span className="min-w-0 flex-1 text-[13px] font-bold text-white leading-snug line-clamp-2 group-hover:text-[var(--accent)] transition-colors">
                                        {item.title}
                                    </span>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                <div className={`rounded-[var(--radius-panel)] border border-white/[0.07] bg-[var(--surface-1)] p-6 ${coverage.length > 0 ? "" : "lg:col-span-2"}`}>
                    <MessageSquare className="w-5 h-5 text-[var(--accent)]" strokeWidth={1.6} />
                    <h2 className="mt-3.5 font-display text-[16px] font-black text-white">
                        Argue it out on the forum
                    </h2>
                    <p className="mt-2 max-w-[440px] text-[12.5px] leading-relaxed text-white/45">
                        A signature is a number. A thread is a case. Tell the rest of us why physical still matters to
                        you — or why you think the disc has had its run.
                    </p>
                    <Link
                        href="/forum"
                        className="btn-command mt-5 inline-flex items-center gap-2 h-10 px-5 bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] font-display text-[10px] font-black uppercase tracking-[0.12em] text-white transition-colors"
                    >
                        Join the discussion <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                </div>
            </section>

            {/* ══ the closing line ══ */}
            <section className="container-page mt-4">
                <div className="relative overflow-hidden rounded-[var(--radius-panel)] border border-[color-mix(in_srgb,var(--accent)_25%,transparent)] bg-[var(--surface-1)] p-7 lg:p-9">
                    <span
                        aria-hidden
                        className="absolute inset-0"
                        style={{ background: "radial-gradient(70% 140% at 88% 50%, color-mix(in srgb, var(--accent) 16%, transparent), transparent 60%)" }}
                    />
                    <div className="relative z-10 max-w-[560px]">
                        <p className="font-display text-[20px] lg:text-[24px] font-black text-white leading-tight">
                            This is our moment.
                            <br />
                            Our games. Our choice. Our future.
                        </p>
                        <p className="mt-3 text-[12.5px] leading-relaxed text-white/45">
                            The more voices we have, the stronger the message. Let&apos;s show Sony that physical games
                            still have a place in the PlayStation future.
                        </p>
                    </div>
                </div>
            </section>
        </main>
    );
}
