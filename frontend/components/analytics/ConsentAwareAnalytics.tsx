"use client";

import Script from "next/script";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID || "G-0J974Y0X23";

export default function ConsentAwareAnalytics() {
    const pathname = usePathname();

    // Track SPA navigations after initial load
    // Initial page_view is sent automatically by GA4 (send_page_view: true)
    const isFirstRender = useRef(true);
    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }
        if (typeof window === "undefined" || !(window as any).gtag) return;
        (window as any).gtag("event", "page_view", {
            page_path: pathname,
        });
    }, [pathname]);

    return (
        <>
            {/* GA4 — cookieless mode (client_storage: none), no consent required, counts all visits */}
            <Script
                src={`/proxy/gtag?id=${GA_ID}`}
                strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
                {`
                    window.dataLayer = window.dataLayer || [];
                    function gtag(){dataLayer.push(arguments);}
                    gtag('js', new Date());
                    gtag('config', '${GA_ID}', {
                        anonymize_ip: true,
                        client_storage: 'none',
                        send_page_view: true
                    });
                `}
            </Script>
        </>
    );
}
