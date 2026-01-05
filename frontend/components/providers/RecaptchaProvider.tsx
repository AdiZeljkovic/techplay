"use client";

import Script from "next/script";
import { createContext, useContext, useCallback, useState, useEffect } from "react";

interface RecaptchaContextType {
    executeRecaptcha: (action: string) => Promise<string | null>;
    isLoaded: boolean;
}

const RecaptchaContext = createContext<RecaptchaContextType>({
    executeRecaptcha: async () => null,
    isLoaded: false,
});

export function useRecaptcha() {
    return useContext(RecaptchaContext);
}

interface RecaptchaProviderProps {
    children: React.ReactNode;
}

declare global {
    interface Window {
        grecaptcha?: {
            ready: (callback: () => void) => void;
            execute: (siteKey: string, options: { action: string }) => Promise<string>;
        };
    }
}

export default function RecaptchaProvider({ children }: RecaptchaProviderProps) {
    const [isLoaded, setIsLoaded] = useState(false);
    const [isLocalhost, setIsLocalhost] = useState(false);
    const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

    useEffect(() => {
        // Detect if running on localhost
        const hostname = window.location.hostname;
        setIsLocalhost(hostname === 'localhost' || hostname === '127.0.0.1');
    }, []);

    const executeRecaptcha = useCallback(async (action: string): Promise<string | null> => {
        // Skip reCAPTCHA on localhost (key only works on production domain)
        if (isLocalhost) {
            console.log("reCAPTCHA skipped on localhost");
            return null;
        }

        // If no site key configured, skip reCAPTCHA
        if (!siteKey) {
            console.warn("reCAPTCHA site key not configured, skipping verification");
            return null;
        }

        // If grecaptcha not loaded, skip gracefully
        if (!window.grecaptcha) {
            console.warn("reCAPTCHA not loaded, skipping verification");
            return null;
        }

        try {
            return new Promise((resolve) => {
                window.grecaptcha!.ready(() => {
                    window.grecaptcha!.execute(siteKey, { action })
                        .then(token => resolve(token))
                        .catch(error => {
                            console.warn("reCAPTCHA execution failed, skipping:", error.message);
                            resolve(null);
                        });
                });
            });
        } catch (error) {
            console.warn("reCAPTCHA error, skipping verification");
            return null;
        }
    }, [siteKey, isLocalhost]);

    const handleScriptLoad = () => {
        setIsLoaded(true);
    };

    const handleScriptError = () => {
        console.warn("Failed to load reCAPTCHA script");
        setIsLoaded(false);
    };

    // Don't load reCAPTCHA script on localhost
    const shouldLoadScript = siteKey && !isLocalhost;

    return (
        <RecaptchaContext.Provider value={{ executeRecaptcha, isLoaded }}>
            {shouldLoadScript && (
                <Script
                    src={`https://www.google.com/recaptcha/api.js?render=${siteKey}`}
                    strategy="afterInteractive"
                    onLoad={handleScriptLoad}
                    onError={handleScriptError}
                />
            )}
            {children}
        </RecaptchaContext.Provider>
    );
}
