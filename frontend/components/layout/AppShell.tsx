"use client";

import { usePathname } from 'next/navigation';
import Header from './Header';
import Footer from './Footer';
import PageTransition from './PageTransition';
import MobileTabBar from './MobileTabBar';

export default function AppShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    // Hide header/footer on coming soon page
    const isComingSoon = pathname === "/coming-soon" || pathname.startsWith("/coming-soon");

    if (isComingSoon) {
        return <main className="flex-grow">{children}</main>;
    }

    return (
        <>
            <PageTransition />
            <Header />
            {/* Top: the fixed header — 56px on a phone, 72px from md up.
                Bottom: the tab bar, plus whatever the home indicator claims.
                Without the bottom pad the last row of every list sits under
                the bar and cannot be tapped. */}
            <main className="flex-grow pt-[56px] md:pt-[72px] pb-[calc(58px+env(safe-area-inset-bottom,0px))] md:pb-0">
                {children}
            </main>
            <Footer />
            <MobileTabBar />
        </>
    );
}
