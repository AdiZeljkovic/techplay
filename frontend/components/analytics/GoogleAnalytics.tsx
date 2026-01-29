"use client";

import { usePathname, useSearchParams } from "next/navigation";
import Script from "next/script";
import { useEffect, useState } from "react";

declare global {
    interface Window {
        gtag: (
            command: "config" | "event" | "js",
            targetId: string,
            config?: Record<string, any>
        ) => void;
    }
}

export default function GoogleAnalytics({ gaId }: { gaId: string }) {
    const pathname = usePathname();
    const searchParams = useSearchParams();

    useEffect(() => {
        const url = pathname + searchParams.toString();

        if (typeof window.gtag !== "undefined") {
            window.gtag("config", gaId, {
                page_path: url,
            });
        }
    }, [pathname, searchParams, gaId]);

    return (
        <>
            <Script
                strategy="afterInteractive"
                src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
            />
            <Script
                id="google-analytics"
                strategy="afterInteractive"
                dangerouslySetInnerHTML={{
                    __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${gaId}', {
              page_path: window.location.pathname,
            });
          `,
                }}
            />
        </>
    );
}
