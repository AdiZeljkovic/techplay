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
const MATOMO_URL = "//analytics.adizeljkovic.com/";
const MATOMO_SITE_ID = "1";

export default function ConsentAwareAnalytics() {
    const [consent, setConsent] = useState<CookieConsent | null>(null);

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

    return (
        <>
            {/* GA4 — Consent Mode v2 handles storage restrictions */}
            <Script
                src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
                strategy="lazyOnload"
            />
            <Script id="google-analytics" strategy="lazyOnload">
                {`
                    window.dataLayer = window.dataLayer || [];
                    function gtag(){dataLayer.push(arguments);}
                    gtag('js', new Date());
                    gtag('config', '${GA_ID}', { anonymize_ip: true });
                `}
            </Script>

            {/* Matomo — cookieless mode (disableCookies), no consent required */}
            <Script id="matomo-analytics" strategy="lazyOnload">
                {`
                    var _paq = window._paq = window._paq || [];
                    _paq.push(['disableCookies']);
                    _paq.push(['trackPageView']);
                    _paq.push(['enableLinkTracking']);
                    (function() {
                        var u="${MATOMO_URL}";
                        _paq.push(['setTrackerUrl', u+'matomo.php']);
                        _paq.push(['setSiteId', '${MATOMO_SITE_ID}']);
                        var d=document, g=d.createElement('script'), s=d.getElementsByTagName('script')[0];
                        g.async=true; g.src=u+'matomo.js'; s.parentNode.insertBefore(g,s);
                    })();
                `}
            </Script>

            {/* Meta Pixel — marketing cookies, requires explicit consent */}
            {consent?.marketing && META_PIXEL_ID && (
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
