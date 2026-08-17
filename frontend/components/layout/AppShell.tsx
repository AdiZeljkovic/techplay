"use client";

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
 */
export default function AppShell({ children }: { children: React.ReactNode }) {
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
