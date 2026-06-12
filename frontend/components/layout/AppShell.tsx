"use client";

import { usePathname } from 'next/navigation';
import Header from './Header';
import Footer from './Footer';

export default function AppShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    // Hide header/footer on coming soon page
    const isComingSoon = pathname === "/coming-soon" || pathname.startsWith("/coming-soon");

    if (isComingSoon) {
        return <main className="flex-grow">{children}</main>;
    }

    return (
        <>
            <Header />
            {/* pt accounts for fixed header: 34px top bar + 72px main nav = 106px */}
            <main className="flex-grow pt-[106px]">{children}</main>
            <Footer />
        </>
    );
}
