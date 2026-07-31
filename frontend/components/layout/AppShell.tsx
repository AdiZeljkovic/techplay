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
            {/* pt accounts for the fixed single-bar header (72px) */}
            <main className="flex-grow pt-[72px]">{children}</main>
            <Footer />
        </>
    );
}
