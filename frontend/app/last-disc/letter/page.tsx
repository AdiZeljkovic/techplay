import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, PenLine } from "lucide-react";

export const metadata: Metadata = {
    title: "Open Letter to Sony Interactive Entertainment",
    description:
        "Digital is only bad when it's the only option. The TechPlay community's open letter asking Sony to keep physical PlayStation games available alongside digital.",
    alternates: { canonical: "https://techplay.gg/last-disc/letter" },
    openGraph: {
        title: "Open Letter to Sony: digital is only bad when it's the only option",
        description:
            "We are not asking Sony to abandon digital distribution. We are asking that physical copies remain an option for those who want them.",
        url: "https://techplay.gg/last-disc/letter",
        type: "article",
        siteName: "TechPlay",
    },
    twitter: {
        card: "summary_large_image",
        title: "Open Letter to Sony: digital is only bad when it's the only option",
        description: "The TechPlay community's open letter on physical PlayStation games.",
    },
};

/**
 * The letter, in full.
 *
 * Its own page rather than a block on the campaign: twelve hundred words above
 * a signature form buries the form, and a document people are asked to put
 * their name to should have an address of its own to link and to quote.
 */
const SECTIONS: { heading?: string; paragraphs: string[] }[] = [
    {
        paragraphs: [
            "Dear representatives of Sony Interactive Entertainment,",
            "We are writing to you on behalf of the TechPlay community — our team, players, collectors, and all long-time users of Sony's PlayStation platform — regarding the recent announcement that, starting in 2028, the production of physical copies of new games will be completely discontinued, and that going forward, the only way to obtain games will be exclusively in digital format.",
            "We want to emphasize that we understand your decision and that it follows a broader trend in this industry, and that digital sales in today's world make up the vast majority of your revenue related to game sales. Our goal is not to dispute your right to follow market trends; rather, what we are asking for is that physical copies remain available as an option for those who want them — in other words, simply that they remain a parallel form of distribution alongside the digital offering.",
            "We firmly believe that this decision, if it remains unchanged, carries consequences on several levels in the long run, and we want to explain why.",
        ],
    },
    {
        heading: "Why physical copies still matter",
        paragraphs: [],
    },
    {
        heading: "Genuine ownership of a purchased game",
        paragraphs: [
            "Although this hasn't been the practice for some time now, at least for single-player games it should hold true that if we buy a physical item — a disc, in this case — we are buying something that physically belongs to us, not a license that can be revoked, altered, or shut down at the discretion of the publisher or platform. It should be noted that this is one of the ways in which the popularity of modern consoles was built. If nothing else, for this reason alone, players deserve to be treated a little better and to at least have that choice.",
        ],
    },
    {
        heading: "Collecting",
        paragraphs: [
            "For many members of this community, as well as many others, buying physical copies isn't just a way to play games — it's also an object of sentimental and collectible value. An empty box with a code for the game holds no value at all; what has value are the manual, the map, the disc, and occasionally some unique bonus item for a specific edition or game. This culture of collecting has existed for decades and is part of the identity of the gaming community, and discontinuing it would irreversibly impoverish that culture.",
        ],
    },
    {
        heading: "Preserving gaming history",
        paragraphs: [
            "It should be noted that physical media, strictly speaking from a historical standpoint, are one of the more reliable ways of preserving software compared to digital servers, which depend entirely on whether the company that issues them continues to exist and for how long it chooses to keep its services running. Discontinuing physical copies risks the loss of parts of gaming history.",
        ],
    },
    {
        heading: "Lending, gifting, and trading games",
        paragraphs: [
            "Generations of gamers grew up buying discs, sharing them with family and friends, selling them, and buying new ones. The ability to give someone a tangible gift in physical form for a birthday is part of a social experience that digital distribution cannot deliver on the same level. Thousands of pixels on a screen don't carry the same weight as holding a physical, tangible object in your hands, especially when that gift is meant for younger generations who are just entering the world of the gaming industry.",
        ],
    },
    {
        heading: "The secondhand market and more affordable prices",
        paragraphs: [
            "Gaming is an industry of connection, closeness, and experiencing things in a different way, which should be accessible to everyone who wants it. Used games have been, for many, the only or the most affordable ticket into gaming — especially for younger people and those with limited budgets. We shouldn't forget the businesses of smaller, local stores that have been part of the community for decades and that have, if nothing else, hundreds of satisfied regular customers. Discontinuing the production of physical discs cuts off the supply to this market, which will inevitably cause it to disappear over time — with direct consequences for small businesses and for the affordability of games in general.",
        ],
    },
    {
        heading: "Our appeal",
        paragraphs: [
            "Once again, we want to emphasize that we are not asking Sony to abandon digital distribution, nor to slow it down in any way. What we are asking is simply that physical copies remain an option for those who want them — just as has been the case until now. Discontinuing physical copies offers no improvement in service, nor any quality-of-life change; it represents nothing but a loss of choice, which we believe will not be good for either side in the long run.",
        ],
    },
];

/** The three asks, numbered because they are a list of demands, not a flourish. */
const ASKS = [
    "Reconsider withdrawing or postponing the decision to fully discontinue the production of physical discs.",
    "Give publishers the choice to continue releasing physical editions of titles for which there is market interest, instead of a uniform digital-only rule for all.",
    "Openly communicate with the community about plans for the long-term support of already-purchased physical and digital titles.",
];

export default function LetterPage() {
    return (
        <main className="min-h-screen bg-[var(--surface-0)] pb-16">
            <div className="container-page pt-8 max-w-[760px]">
                <Link
                    href="/last-disc"
                    className="inline-flex items-center gap-2 font-display text-[10px] font-black uppercase tracking-[0.12em] text-white/35 hover:text-[var(--accent)] transition-colors"
                >
                    <ArrowLeft className="w-3.5 h-3.5" /> The Last Disc
                </Link>

                <p className="mt-7 font-display text-[9.5px] font-black uppercase tracking-[0.2em] text-[var(--accent)]">
                    Open letter to Sony Interactive Entertainment
                </p>

                <h1 className="mt-3 font-display text-[30px] sm:text-[40px] font-black text-white leading-[1.05] tracking-tight">
                    Digital is only bad when it&apos;s the only option
                </h1>

                {/* The document proper. Reading measure is deliberately narrow —
                    this is twelve hundred words of argument, not a landing page. */}
                <article className="mt-9 space-y-7">
                    {SECTIONS.map((section, i) => (
                        <section key={section.heading ?? `intro-${i}`}>
                            {section.heading && (
                                <h2
                                    className={
                                        section.paragraphs.length === 0
                                            ? "mt-4 pb-3 border-b border-white/[0.09] font-display text-[13px] font-black uppercase tracking-[0.16em] text-white/55"
                                            : "font-display text-[17px] font-black text-white leading-snug"
                                    }
                                >
                                    {section.heading}
                                </h2>
                            )}

                            {section.paragraphs.map((paragraph, j) => (
                                <p
                                    key={j}
                                    className={`text-[14.5px] leading-[1.75] text-white/60 ${
                                        section.heading && j === 0 ? "mt-3" : j > 0 ? "mt-4" : ""
                                    }`}
                                >
                                    {paragraph}
                                </p>
                            ))}
                        </section>
                    ))}

                    <section>
                        <h2 className="font-display text-[17px] font-black text-white leading-snug">We call on Sony to:</h2>

                        <ol className="mt-4 space-y-3.5">
                            {ASKS.map((ask, i) => (
                                <li key={i} className="flex gap-4">
                                    <span className="shrink-0 w-7 font-display text-[15px] font-black tabular-nums text-[var(--accent)]">
                                        {i + 1}.
                                    </span>
                                    <span className="text-[14.5px] leading-[1.75] text-white/60">{ask}</span>
                                </li>
                            ))}
                        </ol>
                    </section>

                    <section>
                        <p className="text-[14.5px] leading-[1.75] text-white/60">
                            Physical copies don&apos;t need to make up the majority of the market for their preservation
                            to matter a great deal. As we said, we are asking for the option to choose, not an obligation
                            to choose only one option.
                        </p>
                        <p className="mt-4 text-[14.5px] leading-[1.75] text-white/60">
                            Thank you for your attention, and we hope for an open dialogue.
                        </p>
                    </section>

                    <section className="pt-6 border-t border-white/[0.09]">
                        <p className="text-[14.5px] leading-[1.75] text-white/60">Sincerely,</p>
                        <p className="mt-1 font-display text-[15px] font-black uppercase tracking-[0.12em] text-white">
                            The TechPlay Community
                        </p>
                    </section>
                </article>

                <div className="mt-10 rounded-[var(--radius-panel)] border border-[color-mix(in_srgb,var(--accent)_25%,transparent)] bg-[var(--accent-soft)] p-6 text-center">
                    <p className="font-display text-[15px] font-black text-white">Read it. Now put your name to it.</p>
                    <p className="mt-2 mx-auto max-w-[420px] text-[12.5px] leading-relaxed text-white/50">
                        A letter with one signature is an opinion. With ten thousand it is a constituency.
                    </p>
                    <Link
                        href="/last-disc#sign"
                        className="btn-command mt-5 inline-flex items-center gap-2 h-11 px-6 bg-[var(--accent)] hover:brightness-110 font-display text-[11px] font-black uppercase tracking-[0.14em] text-white transition-[filter]"
                    >
                        <PenLine className="w-4 h-4" /> Sign the open letter
                    </Link>
                </div>
            </div>
        </main>
    );
}
