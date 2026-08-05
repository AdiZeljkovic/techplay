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
        { name: "TechPlay.gg", url: "https://techplay.gg", icon: Globe, color: "#DC143C" },
    ].filter(link => link.url);

    return (
        <div className="mt-12">
            {/* Main Footer Card */}
            <div className="relative overflow-hidden bg-[#0B0E14]/80 backdrop-blur-md border border-[#161B22] rounded-[24px] p-8 md:p-10 shadow-[0_0_40px_rgba(0,0,0,0.5)]">
                {/* Orange accent hairline + glow */}
                <div className="absolute top-0 left-[25%] w-[50%] h-[1px] bg-gradient-to-r from-transparent via-[#DC143C]/40 to-transparent" />
                <div className="absolute -top-[120px] left-1/2 -translate-x-1/2 w-[300px] h-[300px] bg-[#DC143C]/10 blur-[90px] rounded-full pointer-events-none" />

                {/* Stay Connected Section */}
                <div className="text-center mb-8 relative z-10">
                    <span className="text-tp-accent font-bold tracking-[0.15em] text-[10px] uppercase mb-2 block">
                        JOIN THE COMMUNITY
                    </span>
                    <h4 className="font-display text-[24px] font-bold text-white uppercase tracking-[0.05em] mb-3">
                        STAY CONNECTED
                    </h4>
                    <p className="text-[14px] text-[#A1A1AA]">
                        Follow us for the latest gaming news and updates
                    </p>
                </div>

                {/* Social Links Grid */}
                {socialLinks.length > 0 && (
                    <div className="flex flex-wrap justify-center gap-3 mb-8 relative z-10">
                        {socialLinks.map((link) => {
                            const Icon = link.icon;
                            return (
                                <Link
                                    key={link.name}
                                    href={link.url!}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="group flex items-center gap-3 pl-2 pr-5 py-2 bg-[#05070A] border border-[#161B22] rounded-xl hover:border-tp-accent/40 hover:bg-white/[0.03] hover:-translate-y-0.5 transition-all duration-300"
                                >
                                    <span
                                        className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 group-hover:scale-110"
                                        style={{ backgroundColor: `${link.color}1A` }}
                                    >
                                        <Icon className="w-4 h-4" style={{ color: link.color }} />
                                    </span>
                                    <span className="text-[12px] font-bold uppercase tracking-wider text-[#A1A1AA] group-hover:text-white transition-colors">
                                        {link.name}
                                    </span>
                                </Link>
                            );
                        })}
                    </div>
                )}

                {/* Divider */}
                <div className="h-px bg-gradient-to-r from-transparent via-[#161B22] to-transparent mb-6 relative z-10" />

                {/* Copyright Notice */}
                <div className="text-center relative z-10">
                    <p className="text-[12px] text-[#71717A] leading-relaxed max-w-2xl mx-auto">
                        <span className="font-bold text-[#A1A1AA]">© 2026 TechPlay.gg</span>
                        <span className="mx-2 text-tp-accent">•</span>
                        All rights reserved. Content sharing is permitted only with a mandatory active link to the original source.
                    </p>
                    <p className="text-[10px] text-[#71717A]/70 mt-2 uppercase tracking-widest font-bold">
                        Unauthorized use of text, photos, or video is prohibited.
                    </p>
                </div>
            </div>
        </div>
    );
}
