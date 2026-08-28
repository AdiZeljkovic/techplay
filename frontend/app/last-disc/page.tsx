import type { Metadata } from "next";
import Link from "next/link";
import {
    Disc3, ShieldCheck, Library, Users2, HandCoins, Repeat2, Scale, MessageSquare, ArrowRight, PenLine,
} from "lucide-react";
import { getServerApiUrl, serverHeaders } from "@/lib/api";
import LastDiscClient from "./LastDiscClient";
import ShareRow from "./ShareRow";

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
        images: [{ url: "https://techplay.gg/images/last-disc/last-disc-hero.webp", width: 1983, height: 793, alt: "A shattering PlayStation disc" }],
    },
    twitter: {
        card: "summary_large_image",
        title: "The Last Disc — keep physical PlayStation games alive",
        description: "An open letter from players asking Sony to keep physical PlayStation games beyond 2028.",
        images: ["https://techplay.gg/images/last-disc/last-disc-hero.webp"],
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
            headers: serverHeaders(),
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
            {/* ══ hero ══
                The disc sits in the left third of the art and shatters to the
                right, so everything the page says is set over the right two
                thirds and the break reads as the subject rather than as
                decoration behind it.

                The four words sit inside the frame, on the art, under the
                sentence they qualify. Below the fold they were four labels;
                here they are the terms of the argument. */}
            <section
                className="relative overflow-hidden border-b border-white/[0.07] min-h-[440px] lg:min-h-[540px] flex items-center"
                style={{
                    backgroundImage:
                        "linear-gradient(270deg, rgba(5,7,10,0.82) 0%, rgba(5,7,10,0.58) 32%, rgba(5,7,10,0.10) 60%, transparent 76%), url('/images/last-disc/last-disc-hero.webp')",
                    backgroundSize: "cover, cover",
                    backgroundPosition: "center, center left",
                    backgroundRepeat: "no-repeat, no-repeat",
                    backgroundColor: "#05070A",
                }}
            >
                <span aria-hidden className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[var(--surface-0)] to-transparent" />

                <div className="relative z-10 w-full container-page py-12 lg:py-14">
                    <div className="lg:ml-auto lg:w-[68%] text-center">
                        <h1 className="font-display font-black uppercase leading-[0.86] tracking-tight text-[44px] sm:text-[62px] lg:text-[78px]">
                            <span className="text-white">The Last </span>
                            <span className="text-[var(--accent)]">Disc</span>
                        </h1>

                        <p className="mt-4 mx-auto max-w-[520px] text-[14px] sm:text-[15.5px] leading-relaxed text-white/60">
                            An open letter from players around the world asking Sony to keep physical PlayStation
                            games alive.
                        </p>

                        {/* the terms of the argument */}
                        <div className="mt-9 flex flex-wrap justify-center items-center gap-y-6">
                            {BANNER.map(({ icon: Icon, title, body }, i) => (
                                <div
                                    key={title}
                                    className={`flex items-center gap-3 px-4 sm:px-6 ${
                                        i > 0 ? "sm:border-l sm:border-white/[0.12]" : ""
                                    }`}
                                >
                                    <span className="w-9 h-9 shrink-0 rounded-full border border-[color-mix(in_srgb,var(--accent)_55%,transparent)] flex items-center justify-center">
                                        <Icon className="w-[15px] h-[15px] text-[var(--accent)]" strokeWidth={1.9} />
                                    </span>
                                    <span className="text-left">
                                        <span className="block font-display text-[10.5px] font-black uppercase tracking-[0.14em] text-white">
                                            {title}
                                        </span>
                                        <span className="mt-0.5 block text-[11px] text-white/55">{body}</span>
                                    </span>
                                </div>
                            ))}
                        </div>
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
                            className="group rounded-[var(--radius-panel)] border border-white/[0.07] bg-[var(--surface-1)] p-5 text-center hover:border-[color-mix(in_srgb,var(--accent)_35%,transparent)] transition-colors"
                        >
                            <Icon
                                className="w-8 h-8 mx-auto text-[var(--accent)] group-hover:scale-110 transition-transform duration-300"
                                strokeWidth={1.4}
                            />
                            <p className="mt-4 font-display text-[11.5px] font-black uppercase tracking-[0.12em] text-white">
                                {title}
                            </p>
                            <p className="mt-2 text-[12px] leading-snug text-white/55">{body}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ══ coverage + the forum ══ */}
            <section className="container-page mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
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

                {/* Stretches to whatever the coverage list is: two panels side
                    by side that stop at different heights read as one of them
                    having failed to load. */}
                <div className={`flex flex-col rounded-[var(--radius-panel)] border border-white/[0.07] bg-[var(--surface-1)] p-6 ${coverage.length > 0 ? "" : "lg:col-span-2"}`}>
                    <MessageSquare className="w-6 h-6 text-[var(--accent)]" strokeWidth={1.5} />
                    <h2 className="mt-4 font-display text-[16px] font-black text-white">
                        Argue it out on the forum
                    </h2>
                    <p className="mt-2.5 max-w-[440px] text-[12.5px] leading-relaxed text-white/45">
                        A signature is a number. A thread is a case. Tell the rest of us why physical still matters to
                        you — or why you think the disc has had its run.
                    </p>
                    <Link
                        href="/forum"
                        className="btn-command mt-auto pt-0 self-start inline-flex items-center gap-2 h-10 px-5 bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] font-display text-[10px] font-black uppercase tracking-[0.12em] text-white transition-colors"
                    >
                        Join the discussion <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                </div>
            </section>

            {/* ══ the closing line ══
                The art is a boy holding a disc up against a sunset, and he is
                on the right of the frame — so the words take the left and the
                image finishes the sentence. */}
            <section className="container-page mt-4">
                <div
                    className="relative overflow-hidden rounded-[var(--radius-panel)] border border-white/[0.09] min-h-[300px] lg:min-h-[280px] flex items-center"
                    style={{
                        backgroundImage:
                            "linear-gradient(90deg, rgba(5,7,10,0.94) 0%, rgba(5,7,10,0.86) 34%, rgba(5,7,10,0.42) 56%, transparent 74%), url('/images/last-disc/last-disc-cta.webp')",
                        backgroundSize: "cover, cover",
                        backgroundPosition: "center, center right",
                        backgroundRepeat: "no-repeat, no-repeat",
                        backgroundColor: "#05070A",
                    }}
                >
                    {/* Everything stays on the left half. The figure is the
                        right half of the frame, and a button over his arm reads
                        as something that landed there by accident. */}
                    <div className="relative z-10 w-full p-7 lg:p-10 max-w-[560px]">
                        <p className="font-display text-[20px] lg:text-[24px] font-black text-white leading-tight">
                            This is our moment.
                            <br />
                            Our games. Our choice. Our future.
                        </p>
                        <p className="mt-3.5 max-w-[420px] text-[12.5px] leading-relaxed text-white/50">
                            The more voices we have, the stronger our message. Let&apos;s show Sony that physical
                            games still have a powerful place in the PlayStation future.
                        </p>

                        <div className="mt-6 flex flex-wrap items-end gap-x-8 gap-y-5">
                            <a
                                href="#sign"
                                className="btn-command inline-flex items-center gap-2 h-12 px-7 bg-[var(--accent)] hover:brightness-110 font-display text-[12px] font-black uppercase tracking-[0.14em] text-white transition-[filter]"
                            >
                                <PenLine className="w-4 h-4" /> Add your voice
                            </a>

                            <ShareRow />
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
}
