"use client";

import Script from "next/script";
import { useState, useEffect } from "react";

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

export default function ConsentAwareAnalytics() {
    const [consent, setConsent] = useState<CookieConsent | null>(null);

    useEffect(() => {
        setConsent(readConsent());

        const handleStorage = (e: StorageEvent) => {
            if (e.key === "cookie_preferences") {
                setConsent(readConsent());
            }
        };

        window.addEventListener("storage", handleStorage);
        return () => window.removeEventListener("storage", handleStorage);
    }, []);

    // Consent not yet determined — don't load any tracking
    if (!consent) return null;

    const GA_ID = process.env.NEXT_PUBLIC_GA_ID || "G-0J974Y0X23";
    const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

    return (
        <>
            {consent.analytics && (
                <>
                    <Script
                        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
                        strategy="lazyOnload"
                    />
                    <Script id="google-analytics" strategy="lazyOnload">
                        {`
                            window.dataLayer = window.dataLayer || [];
                            function gtag(){dataLayer.push(arguments);}
                            gtag('js', new Date());
                            gtag('config', '${GA_ID}');
                        `}
                    </Script>
                </>
            )}

            {consent.marketing && META_PIXEL_ID && (
                <Script id="meta-pixel" strategy="lazyOnload">
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
