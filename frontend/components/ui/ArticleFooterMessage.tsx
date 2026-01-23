"use client";

import Link from "next/link";
import { useSiteSettings } from "@/context/SiteSettingsContext";
import { MessageCircle, Youtube, Instagram, Facebook, Globe } from "lucide-react";

/**
 * Footer message component displayed at the end of all articles.
 * Contains social links from Site Settings and copyright notice.
 */
export default function ArticleFooterMessage() {
    const { settings } = useSiteSettings();

    // Build social links array from settings with icons
    const socialLinks = [
        { name: "Discord", url: settings.discord_url, icon: MessageCircle, color: "#5865F2" },
        { name: "YouTube", url: settings.youtube_url, icon: Youtube, color: "#FF0000" },
        { name: "Instagram", url: settings.instagram_url, icon: Instagram, color: "#E4405F" },
        { name: "Facebook", url: settings.facebook_url, icon: Facebook, color: "#1877F2" },
        { name: "TechPlay.gg", url: "https://techplay.gg", icon: Globe, color: "var(--accent)" },
    ].filter(link => link.url);

    return (
        <div className="mt-12">
            {/* Decorative Divider */}
            <div className="flex items-center gap-4 mb-8">
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[var(--border)] to-transparent" />
                <div className="w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse" />
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[var(--border)] to-transparent" />
            </div>

            {/* Main Footer Card */}
            <div className="bg-gradient-to-br from-[var(--bg-elevated)]/50 to-[var(--bg-card)]/30 border border-[var(--border)] rounded-2xl p-6 md:p-8 backdrop-blur-sm">

                {/* Stay Connected Section */}
                <div className="text-center mb-6">
                    <h4 className="text-lg font-bold text-[var(--text-primary)] mb-2">
                        Stay Connected
                    </h4>
                    <p className="text-sm text-[var(--text-muted)]">
                        Follow us for the latest gaming news and updates
                    </p>
                </div>

                {/* Social Links Grid */}
                {socialLinks.length > 0 && (
                    <div className="flex flex-wrap justify-center gap-3 mb-8">
                        {socialLinks.map((link) => {
                            const Icon = link.icon;
                            return (
                                <Link
                                    key={link.name}
                                    href={link.url!}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="group flex items-center gap-2 px-4 py-2.5 bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl hover:border-[var(--accent)] hover:bg-[var(--accent)]/5 transition-all duration-300"
                                >
                                    <Icon
                                        className="w-4 h-4 transition-colors duration-300"
                                        style={{ color: link.color }}
                                    />
                                    <span className="text-sm font-medium text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors">
                                        {link.name}
                                    </span>
                                </Link>
                            );
                        })}
                    </div>
                )}

                {/* Divider */}
                <div className="h-px bg-[var(--border)] mb-6" />

                {/* Copyright Notice */}
                <div className="text-center">
                    <p className="text-xs text-[var(--text-muted)] leading-relaxed max-w-2xl mx-auto">
                        <span className="font-semibold text-[var(--text-secondary)]">© 2026 TechPlay.gg</span>
                        <span className="mx-2">•</span>
                        All rights reserved. Content sharing is permitted only with a mandatory active link to the original source.
                    </p>
                    <p className="text-[10px] text-[var(--text-muted)]/70 mt-2">
                        Unauthorized use of text, photos, or video is prohibited.
                    </p>
                </div>
            </div>
        </div>
    );
}
