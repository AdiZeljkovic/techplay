"use client";

import Script from "next/script";
import { useEffect, useState } from "react";
import { AD_CLIENT, adsAllowedHere } from "./config";

/**
 * The AdSense loader, but only on the site the account actually owns.
 *
 * It used to sit in the root layout unconditionally, so it loaded wherever the
 * app ran — a developer's localhost, the origin opened by its bare IP — and
 * AdSense duly recorded those as sites. Rendering it from a client component
 * keeps the layout static: the host is a browser fact, and this is the only
 * place that can read it without making every page dynamic.
 */
export default function AdSenseScript() {
    const [allowed, setAllowed] = useState(false);

    useEffect(() => { setAllowed(adsAllowedHere()); }, []);

    if (!allowed) return null;

    return (
        <Script
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${AD_CLIENT}`}
            strategy="afterInteractive"
            crossOrigin="anonymous"
        />
    );
}
