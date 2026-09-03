import { Metadata } from "next";
import Link from "next/link";
import {
    ArrowRight,
    ArrowUpRight,
    BookOpen,
    Gamepad2,
    LifeBuoy,
    MessagesSquare,
    Newspaper,
    Wrench,
} from "lucide-react";
import { getServerApiUrl, serverHeaders } from "@/lib/api";
import { generatePageMetadata } from "@/lib/seo";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
    return generatePageMetadata("/about", {
        title: "About Us",
        description:
            "TechPlay is an independent gaming and hardware publication from Sarajevo, built around a catalogue of over 330,000 games and a library that assembles itself from Steam, Xbox, PlayStation, GOG and Epic.",
    });
}

interface TeamMember {
    name: string;
    username: string;
    slug: string;
    avatar_url: string | null;
    tagline: string | null;
    role: string | null;
    articles: number;
}

interface AboutPayload {
    team: TeamMember[];
    figures: { games: number; studios: number; articles: number; answers: number };
}

/**
 * Everything stated on this page is counted, not remembered.
 *
 * The version this replaces printed "141,000 games" in three places. The
 * catalogue passed two hundred thousand in August 2026 and is over three
 * hundred thousand now — so for months the page understated the one thing it
 * was proudest of by more than half, and nothing could catch it, because a
 * number typed into a paragraph has nothing to go wrong.
 */
async function getAbout(): Promise<AboutPayload | null> {
    try {
        const res = await fetch(`${getServerApiUrl()}/staff`, {
            headers: serverHeaders(),
            next: { revalidate: 3600 },
        });

        if (!res.ok) return null;

        return (await res.json()) as AboutPayload;
    } catch {
        return null;
    }
}

const nf = new Intl.NumberFormat("en-GB");

/**
 * The three things, in the order they depend on each other.
 *
 * Numbered because the sequence is real and not decoration: the catalogue is
 * the ground, the library is built on it, and the profile is a reading of the
 * library. Take away the first and neither of the others can exist, which is
 * the argument this page is making and the reason it is worth making in order.
 */
const BUILT = [
    {
        n: "01",
        title: "A catalogue big enough to be the floor",
        body: "Every game we can find, assembled from what the stores publish rather than typed in by hand — with release dates, platforms, genres, cover art and the studios behind them. It is not the pitch. It exists so that everything after it has something to stand on.",
        links: [
            { label: "Browse the catalogue", href: "/games" },
            { label: "Release calendar", href: "/calendar" },
            { label: "Studios", href: "/studios" },
        ],
    },
    {
        n: "02",
        title: "One library, five platforms",
        body: "Steam shows you Steam. PlayStation shows you PlayStation. Connect Steam, Xbox, PlayStation, GOG and Epic and your shelf assembles itself in one place — the games, the hours where the platform will give them, the ones you finished — and anything they miss you add yourself.",
        links: [
            { label: "How linking works", href: "https://help.techplay.gg/connected-accounts", external: true },
            { label: "What we import", href: "https://help.techplay.gg/connected-accounts/what-we-import-from-each-platform", external: true },
        ],
    },
    {
        n: "03",
        title: "A profile that reads it back",
        body: "From that shelf the site can describe your taste in figures you can check, tell you how close it sits to another player's, and suggest what to start tonight out of what you already own. Everything it says about you is derived from your own library — never from a model you cannot inspect.",
        links: [
            { label: "Backlog Advisor", href: "/backlog-advisor" },
            { label: "Leaderboard", href: "/leaderboard" },
            { label: "How XP works", href: "https://help.techplay.gg/xp-and-levels/how-xp-and-the-daily-cap-work", external: true },
        ],
    },
];

const AROUND = [
    {
        icon: Newspaper,
        title: "The publication",
        body: "News, reviews against a published scale, hardware and guides. The part that has been running longest.",
        href: "/news",
        cta: "Read the latest",
    },
    {
        icon: MessagesSquare,
        title: "The community",
        body: "A forum, direct and group chat, and a Discord bot that knows your shelf and your rank.",
        href: "/forum",
        cta: "Open the forum",
    },
    {
        icon: Wrench,
        title: "The tools",
        body: "A WoW character readiness check, a backlog advisor that shows its arithmetic, and lists you can publish.",
        href: "/tools",
        cta: "See the tools",
    },
    {
        icon: LifeBuoy,
        title: "The help centre",
        body: "Written answers to what goes wrong most, on its own hostname, and none of it behind a ticket form.",
        href: "https://help.techplay.gg",
        cta: "Get help",
        external: true,
    },
];

/**
 * Principles, not slogans.
 *
 * What stood here before this page's last rewrite was written in the voice of
 * a message board — "No Sponsored Bullshit", "our writers grind ranked" — which
 * read as an attempt to sound like the audience rather than as anything the
 * audience could hold us to.
 *
 * Each of these is a rule the code already follows, which is the only kind
 * worth printing.
 */
const PRINCIPLES = [
    {
        title: "Every number shows its working",
        body: "Taste matching publishes its weights. The backlog advisor scores against a fixed total, so its match percentage is a real percentage. If a figure cannot be explained, it does not go on the page.",
    },
    {
        title: "Derived, not guessed",
        body: "What your profile says about you is read from your collection and your playtime. Nothing is inferred from a model you cannot inspect, and nothing is invented to fill a gap.",
    },
    {
        title: "Nothing is logged without you",
        body: "Playtime read from Steam becomes a proposed session, never a recorded one, and the switch that shelves a game because we saw you playing it is one you can turn off. A diary you did not write is not a diary.",
    },
    {
        title: "Reviews are independent",
        body: "Games and hardware are covered on their merits. Supporting the site buys an ad-free page and a say in what we look at next — never in what we conclude.",
    },
    {
        title: "Corrections are visible",
        body: "When we get something wrong we change it and say so, rather than editing quietly and hoping. The help centre says which of its own claims turned out to be wrong.",
    },
    {
        title: "We would rather say the awkward thing",
        body: "Where a platform's own privacy setting is the reason your library is empty, we name it. Where a duplicate in your shelf is one we will not merge automatically, we explain why not.",
    },
];

function Figure({ value, label }: { value: string; label: string }) {
    return (
        <div className="flex flex-col gap-1.5">
            <span className="font-display text-[26px] md:text-[34px] font-black leading-none tabular-nums text-[var(--ink-hi)]">
                {value}
            </span>
            <span className="font-display text-[10px] font-black uppercase tracking-[0.14em] text-[var(--ink-faint)]">
                {label}
            </span>
        </div>
    );
}

function SectionTitle({ children, sub }: { children: React.ReactNode; sub?: string }) {
    return (
        <div className="mb-7">
            <h2 className="flex items-center gap-2.5 font-display text-[15px] font-bold uppercase tracking-[0.12em] text-[var(--ink-hi)]">
                <span aria-hidden className="h-[14px] w-[3px] rounded-full bg-[var(--accent)]" />
                {children}
            </h2>
            {sub && <p className="mt-2.5 max-w-2xl text-[13.5px] leading-relaxed text-[var(--ink-low)]">{sub}</p>}
        </div>
    );
}

export default async function AboutPage() {
    const data = await getAbout();
    const team = data?.team ?? [];
    const figures = data?.figures;

    return (
        <main className="min-h-screen bg-[var(--surface-0)]">
            {/* ───────────────────────────────────────────────── the thesis */}
            <section className="relative overflow-hidden border-b" style={{ borderColor: "var(--line)" }}>
                <span
                    aria-hidden
                    className="pointer-events-none absolute inset-0"
                    style={{
                        background:
                            "radial-gradient(58% 120% at 18% -10%, color-mix(in srgb, var(--accent) 15%, transparent), transparent 66%)",
                    }}
                />

                <div className="relative container-page py-14 md:py-20">
                    <p className="font-display text-[10.5px] font-black uppercase tracking-[0.2em] text-[var(--accent)]">
                        Independent · Sarajevo
                    </p>

                    <h1 className="mt-5 max-w-3xl font-display text-[30px] md:text-[46px] font-black leading-[1.06] tracking-tight text-[var(--ink-hi)]">
                        Everyone writes about games. We also keep the record of yours.
                    </h1>

                    <div className="mt-6 max-w-2xl space-y-4 text-[15px] leading-relaxed text-[var(--ink-mid)]">
                        <p>
                            TechPlay is a gaming and hardware publication with a games database
                            underneath it and a library on top. Six of us write here. There is no
                            publisher behind us, which is why the reviews answer to readers.
                        </p>
                        <p>
                            The publishing has been running since 2021. The rest exists because of a
                            second problem: everybody covers games, and nobody keeps a usable record of
                            the ones you have actually played. Your hours sit in one launcher, your
                            finished titles in another, and your own taste is something you would have
                            to work out by hand.
                        </p>
                    </div>
                </div>
            </section>

            {/* ─────────────────────────────────────────────── the figures */}
            {figures && (
                <section className="border-b" style={{ borderColor: "var(--line)", background: "var(--surface-1)" }}>
                    <div className="container-page grid grid-cols-2 gap-8 py-8 md:grid-cols-4 md:py-9">
                        <Figure value={nf.format(figures.games)} label="Games catalogued" />
                        <Figure value={nf.format(figures.studios)} label="Studios" />
                        <Figure value={nf.format(figures.articles)} label="Pieces published" />
                        <Figure value="5" label="Platforms your library reads" />
                    </div>
                </section>
            )}

            <div className="container-page space-y-14 py-12 md:space-y-20 md:py-16">
                {/* ──────────────────────────────────────────── what we built */}
                <section className="tp-fade-up tp-d1">
                    <SectionTitle sub="Three things, and the order is the argument: the catalogue is the ground, the library is built on it, and the profile is a reading of the library.">
                        What we built
                    </SectionTitle>

                    <div className="space-y-px">
                        {BUILT.map((block) => (
                            <div
                                key={block.n}
                                className="grid gap-4 border-t py-7 md:grid-cols-[64px_1fr] md:gap-8"
                                style={{ borderColor: "var(--line)" }}
                            >
                                <span
                                    aria-hidden
                                    className="font-display text-[26px] font-black leading-none tabular-nums"
                                    style={{ color: "color-mix(in srgb, var(--accent) 55%, transparent)" }}
                                >
                                    {block.n}
                                </span>

                                <div className="max-w-2xl">
                                    <h3 className="font-display text-[19px] md:text-[22px] font-bold leading-snug text-[var(--ink-hi)]">
                                        {block.title}
                                    </h3>
                                    <p className="mt-3 text-[14.5px] leading-relaxed text-[var(--ink-mid)]">{block.body}</p>

                                    <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
                                        {block.links.map((link) =>
                                            link.external ? (
                                                <a
                                                    key={link.href}
                                                    href={link.href}
                                                    className="inline-flex items-center gap-1.5 font-display text-[11px] font-black uppercase tracking-[0.12em] text-[var(--accent)] transition-colors hover:text-[var(--accent-hover)]"
                                                >
                                                    {link.label}
                                                    <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
                                                </a>
                                            ) : (
                                                <Link
                                                    key={link.href}
                                                    href={link.href}
                                                    className="inline-flex items-center gap-1.5 font-display text-[11px] font-black uppercase tracking-[0.12em] text-[var(--accent)] transition-colors hover:text-[var(--accent-hover)]"
                                                >
                                                    {link.label}
                                                    <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                                                </Link>
                                            ),
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ───────────────────────────────────────────────── around it */}
                <section className="tp-fade-up tp-d2">
                    <SectionTitle>And the rest of it</SectionTitle>

                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        {AROUND.map((item) => {
                            const inner = (
                                <>
                                    <item.icon
                                        className="h-[26px] w-[26px] text-[var(--accent)] transition-transform duration-300 group-hover:scale-110"
                                        strokeWidth={1.4}
                                        aria-hidden
                                    />
                                    <h3 className="mt-4 font-display text-[13px] font-black uppercase tracking-[0.1em] text-[var(--ink-hi)]">
                                        {item.title}
                                    </h3>
                                    <p className="mt-2 flex-1 text-[13px] leading-relaxed text-[var(--ink-low)]">{item.body}</p>
                                    <span className="mt-4 inline-flex items-center gap-1.5 font-display text-[10.5px] font-black uppercase tracking-[0.12em] text-[var(--accent)]">
                                        {item.cta}
                                        <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                                    </span>
                                </>
                            );

                            const shell =
                                "group flex flex-col rounded-[var(--radius-panel)] border p-5 transition-colors hover:border-[color-mix(in_srgb,var(--accent)_40%,transparent)]";

                            return item.external ? (
                                <a
                                    key={item.title}
                                    href={item.href}
                                    className={shell}
                                    style={{ background: "var(--surface-1)", borderColor: "var(--line-strong)" }}
                                >
                                    {inner}
                                </a>
                            ) : (
                                <Link
                                    key={item.title}
                                    href={item.href}
                                    className={shell}
                                    style={{ background: "var(--surface-1)", borderColor: "var(--line-strong)" }}
                                >
                                    {inner}
                                </Link>
                            );
                        })}
                    </div>
                </section>

                {/* ────────────────────────────────────────────── how we work */}
                <section className="tp-fade-up tp-d3">
                    <SectionTitle sub="Six rules the code already follows. A principle nothing enforces is a slogan.">
                        How we work
                    </SectionTitle>

                    <div className="grid gap-x-10 md:grid-cols-2">
                        {PRINCIPLES.map((rule) => (
                            <div key={rule.title} className="border-t py-5" style={{ borderColor: "var(--line)" }}>
                                <h3 className="font-display text-[13.5px] font-bold text-[var(--ink-hi)]">{rule.title}</h3>
                                <p className="mt-2 text-[13.5px] leading-relaxed text-[var(--ink-low)]">{rule.body}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ──────────────────────────────────────────── who writes here */}
                {team.length > 0 && (
                    <section className="tp-fade-up tp-d4">
                        <SectionTitle sub="Everyone with a byline on the site. The counts are their published pieces.">
                            Who writes here
                        </SectionTitle>

                        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                            {team.map((person) => (
                                <Link
                                    key={person.slug}
                                    href={`/author/${person.slug}`}
                                    className="group flex items-start gap-4 rounded-[var(--radius-panel)] border p-4 transition-colors hover:border-[color-mix(in_srgb,var(--accent)_40%,transparent)]"
                                    style={{ background: "var(--surface-1)", borderColor: "var(--line)" }}
                                >
                                    {/* A plain img: an avatar can come from our own
                                        storage or from Discord's CDN, and this
                                        sidesteps having to keep a remote-pattern
                                        list in step with wherever people signed
                                        up from. */}
                                    {person.avatar_url ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            src={person.avatar_url}
                                            alt=""
                                            className="h-12 w-12 shrink-0 rounded-full object-cover"
                                            style={{ border: "1px solid var(--line-strong)" }}
                                        />
                                    ) : (
                                        <span
                                            aria-hidden
                                            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full font-display text-[15px] font-black text-[var(--ink-low)]"
                                            style={{ background: "var(--surface-2)", border: "1px solid var(--line-strong)" }}
                                        >
                                            {person.name.charAt(0)}
                                        </span>
                                    )}

                                    <span className="min-w-0 flex-1">
                                        <span className="block font-display text-[14px] font-bold leading-tight text-[var(--ink-hi)] transition-colors group-hover:text-[var(--accent)]">
                                            {person.name}
                                        </span>

                                        <span className="mt-1 block font-display text-[10px] font-black uppercase tracking-[0.12em] text-[var(--ink-faint)]">
                                            {person.role ?? "Contributor"} · {nf.format(person.articles)}{" "}
                                            {person.articles === 1 ? "piece" : "pieces"}
                                        </span>

                                        {person.tagline && (
                                            <span className="mt-2 block text-[12.5px] leading-snug text-[var(--ink-low)]">
                                                {person.tagline}
                                            </span>
                                        )}
                                    </span>
                                </Link>
                            ))}
                        </div>
                    </section>
                )}

                {/* ─────────────────────────────────────────────────── closing */}
                <section
                    className="tp-fade-up tp-d5 rounded-[var(--radius-panel)] border px-6 py-9 text-center md:px-10 md:py-11"
                    style={{
                        background: "var(--surface-1)",
                        borderColor: "var(--line-strong)",
                        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)",
                    }}
                >
                    <h2 className="font-display text-[18px] md:text-[22px] font-black uppercase tracking-[0.06em] text-[var(--ink-hi)]">
                        We are not the biggest gaming site
                    </h2>
                    <p className="mx-auto mt-3 max-w-xl text-[14px] leading-relaxed text-[var(--ink-low)]">
                        That is not the ambition. The ambition is to be the one that knows what you play —
                        and to be wrong about it out loud when we are. Something missing, broken or worth
                        covering? We would rather hear it.
                    </p>

                    <div className="mt-6 flex flex-col items-center justify-center gap-2.5 sm:flex-row">
                        <Link
                            href="/contact"
                            className="inline-flex h-11 items-center justify-center gap-2 rounded-[var(--radius-inner)] bg-[var(--accent)] px-5 font-display text-[11.5px] font-black uppercase tracking-[0.1em] text-white transition-colors hover:bg-[var(--accent-hover)]"
                        >
                            Contact us
                            <ArrowRight className="h-4 w-4" aria-hidden />
                        </Link>

                        <Link
                            href="/games"
                            className="inline-flex h-11 items-center justify-center gap-2 rounded-[var(--radius-inner)] border px-5 font-display text-[11.5px] font-black uppercase tracking-[0.1em] text-[var(--ink-mid)] transition-colors hover:text-[var(--ink-hi)]"
                            style={{ background: "var(--surface-2)", borderColor: "var(--line-strong)" }}
                        >
                            <Gamepad2 className="h-4 w-4" aria-hidden />
                            Browse the catalogue
                        </Link>

                        <Link
                            href="/rating-system"
                            className="inline-flex h-11 items-center justify-center gap-2 rounded-[var(--radius-inner)] border px-5 font-display text-[11.5px] font-black uppercase tracking-[0.1em] text-[var(--ink-mid)] transition-colors hover:text-[var(--ink-hi)]"
                            style={{ background: "var(--surface-2)", borderColor: "var(--line-strong)" }}
                        >
                            <BookOpen className="h-4 w-4" aria-hidden />
                            How we score
                        </Link>
                    </div>
                </section>
            </div>
        </main>
    );
}
