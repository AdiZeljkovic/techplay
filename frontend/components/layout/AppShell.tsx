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
            <main className="flex-grow">{children}</main>
            <Footer />
        </>
    );
}
