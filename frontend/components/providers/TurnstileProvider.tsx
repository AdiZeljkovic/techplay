"use client";

import Script from "next/script";
import { createContext, useContext, useCallback, useState, useRef } from "react";

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
            remove: (widgetId: string) => void;
        };
    }
}

export default function TurnstileProvider({ children }: TurnstileProviderProps) {
    const [isLoaded, setIsLoaded] = useState(false);
    const widgetIdRef = useRef<string | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const tokenRef = useRef<string | null>(null);
    const resolverRef = useRef<((token: string | null) => void) | null>(null);

    const siteKey = "0x4AAAAAACK3cz501N-75UWK";

    // Render widget - for Invisible mode, it auto-executes and calls callback
    const renderWidget = useCallback(() => {
        if (!window.turnstile || !containerRef.current) return;

        // Remove existing widget if any
        if (widgetIdRef.current) {
            try {
                window.turnstile.remove(widgetIdRef.current);
            } catch (e) {
                // Ignore removal errors
            }
            widgetIdRef.current = null;
        }

        try {
            const id = window.turnstile.render(containerRef.current, {
                sitekey: siteKey,
                callback: (token: string) => {
                    console.log("Turnstile token received");
                    tokenRef.current = token;
                    if (resolverRef.current) {
                        resolverRef.current(token);
                        resolverRef.current = null;
                    }
                },
                "expired-callback": () => {
                    console.warn("Turnstile token expired");
                    tokenRef.current = null;
                },
                "error-callback": (error: any) => {
                    console.warn("Turnstile error:", error);
                    tokenRef.current = null;
                    if (resolverRef.current) {
                        resolverRef.current(null);
                        resolverRef.current = null;
                    }
                }
            });
            widgetIdRef.current = id;
        } catch (e) {
            console.error("Turnstile render error:", e);
        }
    }, []);

    const handleScriptLoad = () => {
        setIsLoaded(true);
        renderWidget();
    };

    const executeTurnstile = useCallback(async (_action: string): Promise<string | null> => {
        // If we already have a valid token, return it
        if (tokenRef.current) {
            const token = tokenRef.current;
            // Reset for next use
            tokenRef.current = null;
            renderWidget();
            return token;
        }

        // If widget not ready, try to render
        if (!isLoaded || !window.turnstile) {
            console.warn("Turnstile not ready, proceeding without token");
            return null;
        }

        // Re-render widget and wait for token
        return new Promise((resolve) => {
            const timeoutId = setTimeout(() => {
                console.warn("Turnstile timeout, proceeding without token");
                resolverRef.current = null;
                resolve(null);
            }, 10000);

            resolverRef.current = (token) => {
                clearTimeout(timeoutId);
                resolve(token);
            };

            renderWidget();
        });
    }, [isLoaded, renderWidget]);

    return (
        <TurnstileContext.Provider value={{ executeTurnstile, isLoaded }}>
            <Script
                src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
                strategy="afterInteractive"
                onLoad={handleScriptLoad}
            />
            {/* Container for Turnstile - invisible mode renders without visible UI */}
            <div
                ref={containerRef}
                id="turnstile-container"
                style={{ position: 'fixed', bottom: 0, right: 0, zIndex: -1 }}
            />
            {children}
        </TurnstileContext.Provider>
    );
}
