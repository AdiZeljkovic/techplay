"use client";

import { useEffect, useRef, useCallback } from "react";
import Script from "next/script";

interface TurnstileProps {
    onVerify: (token: string) => void;
    onError?: () => void;
    onExpire?: () => void;
}

declare global {
    interface Window {
        turnstile?: {
            render: (container: HTMLElement, options: any) => string;
            reset: (widgetId: string) => void;
            remove: (widgetId: string) => void;
        };
        onTurnstileLoad?: () => void;
    }
}

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "0x4AAAAAACK3cz501N-75UWK";

export default function Turnstile({ onVerify, onError, onExpire }: TurnstileProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const widgetIdRef = useRef<string | null>(null);
    const scriptLoadedRef = useRef(false);

    const renderWidget = useCallback(() => {
        if (!window.turnstile || !containerRef.current || widgetIdRef.current) return;

        try {
            widgetIdRef.current = window.turnstile.render(containerRef.current, {
                sitekey: SITE_KEY,
                callback: (token: string) => {
                    onVerify(token);
                },
                "expired-callback": () => {
                    onExpire?.();
                },
                "error-callback": () => {
                    onError?.();
                },
                theme: "dark",
            });
        } catch (e) {
            console.error("Turnstile render error:", e);
            onError?.();
        }
    }, [onVerify, onError, onExpire]);

    const handleScriptLoad = useCallback(() => {
        scriptLoadedRef.current = true;
        renderWidget();
    }, [renderWidget]);

    useEffect(() => {
        // If script already loaded (e.g., navigating between pages)
        if (window.turnstile && !widgetIdRef.current) {
            renderWidget();
        }

        return () => {
            // Cleanup widget on unmount
            if (widgetIdRef.current && window.turnstile) {
                try {
                    window.turnstile.remove(widgetIdRef.current);
                } catch (e) {
                    // Ignore cleanup errors
                }
                widgetIdRef.current = null;
            }
        };
    }, [renderWidget]);

    return (
        <>
            <Script
                src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
                strategy="lazyOnload"
                onLoad={handleScriptLoad}
            />
            <div
                ref={containerRef}
                className="flex justify-center my-4"
            />
        </>
    );
}
