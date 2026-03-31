"use client";

import Script from "next/script";
import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

interface CookieConsent {
    necessary: boolean;
    analytics: boolean;
    marketing: boolean;
}

function readConsent(): CookieConsent | null {
    try {
        const raw = localStorage.getItem("cookie_preferences");
        if (!raw) return null;
        return JSON.parse(raw) as CookieConsent;
    } catch {
        return null;
    }
}

function updateGoogleConsent(consent: CookieConsent) {
    if (typeof window === "undefined" || !(window as any).gtag) return;
    (window as any).gtag("consent", "update", {
        analytics_storage: consent.analytics ? "granted" : "denied",
        ad_storage: consent.marketing ? "granted" : "denied",
        ad_user_data: consent.marketing ? "granted" : "denied",
        ad_personalization: consent.marketing ? "granted" : "denied",
    });
}

const GA_ID = process.env.NEXT_PUBLIC_GA_ID || "G-0J974Y0X23";
const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

export default function ConsentAwareAnalytics() {
    const [consent, setConsent] = useState<CookieConsent | null>(null);
    const pathname = usePathname();

    useEffect(() => {
        const saved = readConsent();
        setConsent(saved);
        if (saved) updateGoogleConsent(saved);

        const handleStorage = (e: StorageEvent) => {
            if (e.key === "cookie_preferences") {
                const updated = readConsent();
                setConsent(updated);
                if (updated) updateGoogleConsent(updated);
            }
        };

        window.addEventListener("storage", handleStorage);
        return () => window.removeEventListener("storage", handleStorage);
    }, []);

    // Track SPA page navigation — fires on route changes AFTER initial load
    // Initial page view is handled by send_page_view:true in gtag config below
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
            {/* GA4 — first-party proxy (/proxy/gtag) bypasses ad blockers; /api/* is routed to Laravel backend */}
            {/* send_page_view: false — we manually send pageviews via usePathname above */}
            <Script
                src={`/proxy/gtag?id=${GA_ID}`}
                strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
                {`
                    window.dataLayer = window.dataLayer || [];
                    function gtag(){dataLayer.push(arguments);}
                    gtag('js', new Date());
                    gtag('config', '${GA_ID}', { anonymize_ip: true, send_page_view: true });
                `}
            </Script>

            {/* Meta Pixel — marketing cookies, requires explicit consent */}
            {consent?.marketing && META_PIXEL_ID && (
                <Script id="meta-pixel" strategy="afterInteractive">
                    {`
                        !function(f,b,e,v,n,t,s){
                            if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                            n.queue=[];t=b.createElement(e);t.async=!0;
                            t.src=v;s=b.getElementsByTagName(e)[0];
                            s.parentNode.insertBefore(t,s)}(window,document,'script',
                            'https://connect.facebook.net/en_US/fbevents.js');
                        fbq('init', '${META_PIXEL_ID}');
                        fbq('track', 'PageView');
                    `}
                </Script>
            )}
        </>
    );
}
