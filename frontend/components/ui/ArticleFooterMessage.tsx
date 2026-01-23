"use client";

import Link from "next/link";
import { useSiteSettings } from "@/context/SiteSettingsContext";

/**
 * Footer message component displayed at the end of all articles.
 * Contains social links from Site Settings and copyright notice.
 */
export default function ArticleFooterMessage() {
    const { settings } = useSiteSettings();

    // Build social links array from settings
    const socialLinks = [
        { name: "Discord", url: settings.discord_url },
        { name: "YouTube", url: settings.youtube_url },
        { name: "Instagram", url: settings.instagram_url },
        { name: "Facebook", url: settings.facebook_url },
        { name: "TechPlay.gg", url: "https://techplay.gg" },
    ].filter(link => link.url); // Only show links that have URLs set

    return (
        <div className="mt-12 pt-8 border-t border-[var(--border)]">
            {/* Social Links */}
            {socialLinks.length > 0 && (
                <div className="mb-4 text-center">
                    <span className="text-sm font-semibold text-[var(--text-primary)]">Stay Connected: </span>
                    <span className="text-sm text-[var(--text-secondary)]">
                        {socialLinks.map((link, index) => (
                            <span key={link.name}>
                                <Link
                                    href={link.url!}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[var(--accent)] hover:underline"
                                >
                                    {link.name}
                                </Link>
                                {index < socialLinks.length - 1 && " | "}
                            </span>
                        ))}
                    </span>
                </div>
            )}

            {/* Copyright Notice */}
            <p className="text-xs text-[var(--text-muted)] text-center leading-relaxed">
                © 2026 TechPlay.gg. All rights reserved. Content sharing is permitted only with a mandatory active link to the original source. Unauthorized use of text, photos, or video is prohibited.
            </p>
        </div>
    );
}
