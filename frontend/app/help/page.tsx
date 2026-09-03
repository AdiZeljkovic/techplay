import type { Metadata } from "next";
import Link from "next/link";
import { LifeBuoy, Mail, MessagesSquare } from "lucide-react";

import PageHero from "@/components/ui/PageHero";
import Panel from "@/components/ui/Panel";
import { ROBOTS_NOINDEX } from "@/lib/seo";

/**
 * The help centre, before it has anything in it.
 *
 * This exists so the hostname can be proved end to end — DNS, certificate,
 * nginx, and the host rewrite in next.config.ts — before any of the machinery
 * behind it is built. help.techplay.gg reaching this page means all four links
 * in that chain hold.
 *
 * Deliberately `noindex`. An empty shell is exactly the kind of page that gets
 * crawled once, filed as thin, and remembered that way — and this site spent
 * eight days this week climbing out of a hole with Google. It becomes
 * indexable in the same commit that gives it something to say.
 */
export const metadata: Metadata = {
    title: "Help centre",
    description: "Answers about accounts, connected platforms, your library and XP.",
    robots: ROBOTS_NOINDEX,
};

const ROUTES = [
    {
        href: "/contact",
        icon: Mail,
        title: "Email us",
        body: "Tell us what happened and what you expected. A person reads it.",
    },
    {
        href: "https://discord.gg/techplay",
        icon: MessagesSquare,
        title: "Ask on Discord",
        body: "Usually the fastest answer, and somebody has often hit it before you.",
    },
];

export default function HelpPlaceholderPage() {
    return (
        <main className="min-h-screen bg-[var(--surface-0)]">
            <PageHero
                title="Help centre"
                description="Written answers about accounts, connected platforms, your library and XP."
                iconNode={<LifeBuoy className="w-6 h-6 text-[var(--accent)]" strokeWidth={1.75} />}
            />

            <div className="container-page py-10 md:py-14">
                <Panel>
                    <div className="p-5 sm:p-7 max-w-[62ch]">
                        <h2 className="font-display text-[19px] font-black text-white">
                            We are still writing this.
                        </h2>
                        <p className="mt-3 text-[14px] leading-relaxed text-[var(--ink-mid)]">
                            The first answers cover connecting Steam, Xbox, PlayStation, GOG and
                            Epic, why a library sometimes stops syncing, how XP and its daily cap
                            work, and what happens to your data if you delete your account.
                        </p>
                        <p className="mt-3 text-[14px] leading-relaxed text-[var(--ink-mid)]">
                            Until they are here, both of these reach us.
                        </p>

                        <div className="mt-6 grid gap-3 sm:grid-cols-2">
                            {ROUTES.map(({ href, icon: Icon, title, body }) => (
                                <Link
                                    key={href}
                                    href={href}
                                    className="group rounded-[var(--radius-card)] border border-white/[0.08] bg-[var(--surface-2)] p-4 transition-colors hover:border-[color-mix(in_srgb,var(--accent)_45%,transparent)]"
                                >
                                    <span className="flex items-center gap-2.5">
                                        <Icon className="h-4 w-4 shrink-0 text-[var(--accent)]" />
                                        <span className="font-display text-[13px] font-bold uppercase tracking-[0.08em] text-white">
                                            {title}
                                        </span>
                                    </span>
                                    <span className="mt-2 block text-[13px] leading-snug text-[var(--ink-low)]">
                                        {body}
                                    </span>
                                </Link>
                            ))}
                        </div>
                    </div>
                </Panel>
            </div>
        </main>
    );
}
