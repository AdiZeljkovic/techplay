"use client";

import Script from "next/script";
import { createContext, useContext, useCallback, useState, useRef, useEffect } from "react";

interface TurnstileContextType {
    executeTurnstile: (action: string) => Promise<string | null>;
    isLoaded: boolean;
}

const TurnstileContext = createContext<TurnstileContextType>({
    executeTurnstile: async () => null,
    isLoaded: false,
});

export function useTurnstile() {
    return useContext(TurnstileContext);
}

interface TurnstileProviderProps {
    children: React.ReactNode;
}

declare global {
    interface Window {
        turnstile?: {
            render: (container: string | HTMLElement, options: any) => string;
            reset: (widgetId: string) => void;
            getResponse: (widgetId: string) => string | undefined;
            execute: (container: string | HTMLElement, options?: any) => void;
        };
    }
}

export default function TurnstileProvider({ children }: TurnstileProviderProps) {
    const [isLoaded, setIsLoaded] = useState(false);
    const widgetIdRef = useRef<string | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const currentResolverRef = useRef<((token: string | null) => void) | null>(null);

    // Hardcoded per user request, but best practice is ENV.
    // Using default provided key if none in env (for immediate fix).
    const siteKey = "0x4AAAAAACK3cz501N-75UWK";

    const handleScriptLoad = () => {
        setIsLoaded(true);
        // Initialize hidden widget
        if (window.turnstile && containerRef.current && !widgetIdRef.current) {
            try {
                const id = window.turnstile.render(containerRef.current, {
                    sitekey: siteKey,
                    execution: 'execute',
                    callback: (token: string) => {
                        if (currentResolverRef.current) {
                            currentResolverRef.current(token);
                            currentResolverRef.current = null;
                        }
                    },
                    "error-callback": () => {
                        console.warn("Turnstile error");
                        if (currentResolverRef.current) {
                            currentResolverRef.current(null);
                            currentResolverRef.current = null;
                        }
                    }
                });
                widgetIdRef.current = id;
            } catch (e) {
                console.error("Turnstile render error:", e);
            }
        }
    };

    const executeTurnstile = useCallback(async (action: string): Promise<string | null> => {
        if (!isLoaded || !window.turnstile || !widgetIdRef.current) {
            console.warn("Turnstile not ready, proceeding without token");
            return null;
        }

        return new Promise((resolve) => {
            // Set a timeout to prevent infinite waiting
            const timeoutId = setTimeout(() => {
                console.warn("Turnstile timeout, proceeding without token");
                currentResolverRef.current = null;
                resolve(null);
            }, 5000);

            currentResolverRef.current = (token) => {
                clearTimeout(timeoutId);
                resolve(token);
            };

            try {
                // Reset the widget to ensure a fresh challenge
                window.turnstile!.reset(widgetIdRef.current!);
                // Execute with the new action
                window.turnstile!.execute(containerRef.current!, { action });
            } catch (e) {
                console.error("Turnstile execute error:", e);
                clearTimeout(timeoutId);
                resolve(null);
            }
        });
    }, [isLoaded]);

    return (
        <TurnstileContext.Provider value={{ executeTurnstile, isLoaded }}>
            <Script
                src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
                strategy="afterInteractive"
                onLoad={handleScriptLoad}
            />
            {/* Hidden container for Turnstile widget */}
            <div ref={containerRef} id="turnstile-container" className="hidden" />
            {children}
        </TurnstileContext.Provider>
    );
}
