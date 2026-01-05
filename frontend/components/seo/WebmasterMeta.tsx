"use client";

import { useSiteSettings } from "@/context/SiteSettingsContext";

export default function WebmasterMeta() {
    const { settings, loading } = useSiteSettings();

    if (loading) return null;

    return (
        <>
            {settings.seo_google_verification && (
                <meta name="google-site-verification" content={settings.seo_google_verification} />
            )}
            {settings.seo_bing_verification && (
                <meta name="msvalidate.01" content={settings.seo_bing_verification} />
            )}
            {settings.seo_yandex_verification && (
                <meta name="yandex-verification" content={settings.seo_yandex_verification} />
            )}
            {settings.seo_baidu_verification && (
                <meta name="baidu-site-verification" content={settings.seo_baidu_verification} />
            )}
        </>
    );
}
