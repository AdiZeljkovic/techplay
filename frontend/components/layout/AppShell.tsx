"use client";

import { useSelectedLayoutSegment } from 'next/navigation';
import Header from './Header';
import Footer from './Footer';
import PageTransition from './PageTransition';
import MobileTabBar from './MobileTabBar';

/*
 * The chrome every page sits inside.
 *
 * This used to open by checking for `/coming-soon` and returning a bare <main>
 * for it — the maintenance-mode landing page. That page, and the middleware
 * that sent people to it, were removed some time ago; the branch guarding them
 * outlived both, along with the `usePathname()` call that existed only to feed
 * it. A route that cannot be reached does not need a special case.
 *
 * ── The one special case that came back, and why it is not optional ──────
 *
 * /help is not a section of techplay.gg. It is served from help.techplay.gg,
 * mapped onto these routes by a host rewrite in next.config.ts, and that
 * changes what a link means: on the subdomain, every path is rewritten into
 * /help/*, so the header's `/news` resolves to the help topic "news" and 404s.
 * The same goes for `/games`, `/forum`, the footer, and every tab in the
 * mobile bar — the entire navigation, on a hostname we are about to ask Google
 * to crawl.
 *
 * Making Header and Footer host-aware would mean reading the request headers,
 * which turns every page on the site dynamic and costs the whole ISR strategy
 * to fix one subdomain.
 *
 * ── Why the segment and not the path ────────────────────────────────────
 *
 * The first version of this asked `usePathname()`, and it did nothing at all.
 * The router's pathname is the URL **the browser asked for**, and the rewrite
 * that maps this hostname onto /help/* happens on the server, below the
 * router — so on help.techplay.gg the pathname is `/`, or
 * `/account-and-sign-in`, and never begins with /help. The check was false on
 * every page it existed to catch, and the site header rendered on the
 * subdomain with its whole navigation pointing at 404s. Verified in the
 * shipped HTML: `<a href="/news">Discover</a>`, live on help.techplay.gg.
 *
 * `useSelectedLayoutSegment()` answers the other question — which route below
 * the root layout is **actually rendering** — and that is the one the rewrite
 * has already been applied to. It costs nothing and is known at prerender
 * time, so the static pages stay static.
 *
 * `app/help/layout.tsx` supplies its own header and footer, whose outbound
 * links are absolute and name techplay.gg. techplay.gg/help/* is a 301 to the
 * subdomain, so no reader ever sees these routes under the main hostname and
 * nothing on the main site loses its chrome.
 */
export default function AppShell({ children }: { children: React.ReactNode }) {
    const segment = useSelectedLayoutSegment();

    if (segment === 'help') {
        return <>{children}</>;
    }

    return (
        <>
            <PageTransition />
            <Header />
            {/* Top: the fixed header — 56px on a phone, 72px from md up.
                Bottom: the tab bar, plus whatever the home indicator claims.
                Without the bottom pad the last row of every list sits under
                the bar and cannot be tapped. */}
            <main className="flex-grow pt-[56px] md:pt-[72px] pb-[calc(64px+env(safe-area-inset-bottom,0px))] md:pb-0">
                {children}
            </main>
            <Footer />
            <MobileTabBar />
        </>
    );
}
