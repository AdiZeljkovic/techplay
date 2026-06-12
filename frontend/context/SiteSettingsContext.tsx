"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

interface SiteSettings {
    site_name?: string;
    site_tagline?: string;
    logo_url?: string;
    twitter_url?: string;
    facebook_url?: string;
    instagram_url?: string;
    youtube_url?: string;
    discord_url?: string;
    contact_email?: string;
    support_email?: string;
    marketing_email?: string;
    [key: string]: string | undefined;
}

interface SiteSettingsContextType {
    settings: SiteSettings;
    loading: boolean;
}

const SiteSettingsContext = createContext<SiteSettingsContextType>({
    settings: {},
    loading: true,
});

export function SiteSettingsProvider({ children }: { children: ReactNode }) {
    const [settings, setSettings] = useState<SiteSettings>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchSettings() {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/settings`);
                if (res.ok) {
                    const data = await res.json();
                    setSettings(data);
                }
            } catch (error) {
                console.error("Failed to fetch site settings:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchSettings();
    }, []);

    return (
        <SiteSettingsContext.Provider value={{ settings, loading }}>
            {children}
        </SiteSettingsContext.Provider>
    );
}

export function useSiteSettings() {
    return useContext(SiteSettingsContext);
}
