"use client";

import { useCallback, useEffect, useRef } from "react";
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

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "0x4AAAAAACQelqz05sxYB2FD";

/**
 * How long to wait before deciding the widget is never coming.
 *
 * Turnstile normally settles in a second or two. Fifteen is long enough that a
 * slow connection is not accused of being blocked, and short enough that nobody
 * sits in front of a dead button wondering what they did wrong.
 */
const GIVE_UP_AFTER_MS = 15_000;

/**
 * The security check the submit button waits on.
 *
 * Both forms disable their button until a token arrives, which is correct — the
 * API refuses the request without one. What was missing is what happens when
 * the token never arrives at all.
 *
 * Turnstile's own `error-callback` only fires once the widget is running. If
 * the script never loads — a content blocker eating challenges.cloudflare.com,
 * a DNS filter, a captive network — nothing fires. No token, no error, no
 * message: the button is simply dead and the page offers no reason. A reader
 * reported exactly that, and was right about the cause.
 *
 * Two things close it. `onError` on the script tag catches the load failure
 * Next already reports and nobody was listening to. The timer below catches the
 * quieter version, where the script loads but the widget's iframe is the thing
 * being blocked, so no callback of any kind is ever made.
 *
 * The strategy also changed. It was `lazyOnload`, which waits for the page to
 * go idle — so on a slow connection somebody who filled the form quickly met a
 * disabled button before anything had gone wrong. It is not a low-priority
 * script; it gates the only action on the page.
 */
export default function Turnstile({ onVerify, onError, onExpire }: TurnstileProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const widgetIdRef = useRef<string | null>(null);

    // Whichever happens first wins, and the other is ignored: a token arriving
    // late must not be overruled by the timer, and the timer must not fire
    // after a failure has already been reported.
    const settledRef = useRef(false);

    const fail = useCallback(() => {
        if (settledRef.current) return;
        settledRef.current = true;
        onError?.();
    }, [onError]);

    const succeed = useCallback((token: string) => {
        settledRef.current = true;
        onVerify(token);
    }, [onVerify]);

    const renderWidget = useCallback(() => {
        if (!window.turnstile || !containerRef.current || widgetIdRef.current) return;

        try {
            widgetIdRef.current = window.turnstile.render(containerRef.current, {
                sitekey: SITE_KEY,
                callback: succeed,
                "expired-callback": () => {
                    // An expiry is not a failure — the reader can solve it
                    // again, so the guard reopens.
                    settledRef.current = false;
                    onExpire?.();
                },
                "error-callback": fail,
                theme: "dark",
            });
        } catch (e) {
            console.error("Turnstile render error:", e);
            fail();
        }
    }, [succeed, fail, onExpire]);

    const handleScriptLoad = useCallback(() => {
        renderWidget();
    }, [renderWidget]);

    useEffect(() => {
        // Already loaded, e.g. navigating between login and register.
        if (window.turnstile && !widgetIdRef.current) {
            renderWidget();
        }

        const giveUp = setTimeout(fail, GIVE_UP_AFTER_MS);

        return () => {
            clearTimeout(giveUp);

            if (widgetIdRef.current && window.turnstile) {
                try {
                    window.turnstile.remove(widgetIdRef.current);
                } catch {
                    // Ignore cleanup errors
                }
                widgetIdRef.current = null;
            }
        };
    }, [renderWidget, fail]);

    return (
        <>
            <Script
                src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
                strategy="afterInteractive"
                onLoad={handleScriptLoad}
                onError={fail}
            />
            <div ref={containerRef} className="flex justify-center my-4" />
        </>
    );
}
