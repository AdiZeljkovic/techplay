"use client";

import Link from "next/link";
import { Facebook, Twitter, Instagram, Youtube, Mail, Gamepad2, ArrowRight, Loader2, CheckCircle } from "lucide-react";
import { useState } from "react";
import { Button } from "../ui/Button";
import { useSiteSettings } from "@/context/SiteSettingsContext";

const DiscordIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.043.033.055A19.9 19.9 0 0 0 6.131 21.3a.077.077 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
    </svg>
);

const TikTokIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.75a4.85 4.85 0 0 1-1.01-.06z"/>
    </svg>
);

const FOOTER_LINKS = {
    categories: [
        { name: "News", href: "/news" },
        { name: "Reviews", href: "/reviews" },
        { name: "Tech", href: "/hardware" },
        { name: "Video", href: "/videos" },
        { name: "Guides", href: "/guides" },
        { name: "Database", href: "/games" },
        { name: "Forum", href: "/forum" },
    ],
    community: [
        { name: "About Us", href: "/about" },
        { name: "Roadmap", href: "/roadmap" },
        { name: "Impressum", href: "/impressum" },
        { name: "Marketing", href: "/marketing" },
        { name: "Contact", href: "/contact" },
        { name: "Our Rating System", href: "/rating-system" },
    ],
    legal: [
        { name: "Privacy Policy", href: "/privacy" },
        { name: "Terms of Service", href: "/terms" },
        { name: "Cookie Policy", href: "/cookies" },
        { name: "Impressum", href: "/impressum" },
        { name: "Contact Us", href: "/contact" },
    ]
};

// Social Icon Mapping
const SOCIAL_ICON_MAP: Record<string, any> = {
    twitter_url: Twitter,
    facebook_url: Facebook,
    instagram_url: Instagram,
    youtube_url: Youtube,
    discord_url: DiscordIcon,
    tiktok_url: TikTokIcon,
};

export default function Footer() {
    const [email, setEmail] = useState("");
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [message, setMessage] = useState("");
    const { settings } = useSiteSettings();

    // Build dynamic social links from settings
    const socialLinks = Object.keys(SOCIAL_ICON_MAP)
        .filter(key => settings[key])
        .map(key => ({
            icon: SOCIAL_ICON_MAP[key],
            href: settings[key] || '#'
        }));

    const handleSubscribe = async () => {
        if (!email || !email.includes("@")) {
            setMessage("Please enter a valid email.");
            setStatus("error");
            return;
        }

        setStatus("loading");
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/newsletter/subscribe`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (response.ok) {
                setStatus("success");
                setMessage(data.message || "Please check your email to verify!");
                setEmail("");
            } else {
                setStatus("error");
                setMessage(data.message || "Something went wrong. Try again.");
            }
        } catch (error) {
            console.error("Newsletter Subscription Error:", error);
            console.log("Attempted URL:", `${process.env.NEXT_PUBLIC_API_URL}/newsletter/subscribe`);
            setStatus("error");
            setMessage(`Network error: ${(error as Error).message}`);
        }
    };

    return (
        <footer className="bg-[#000B25] border-t border-white/5 pt-16 pb-8 text-sm">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-16">

                    {/* Brand Column (4 Cols) */}
                    <div className="lg:col-span-4 space-y-6">
                        <Link href="/" className="flex items-center gap-3 group">
                            <div className="w-10 h-10 bg-[var(--accent)] rounded-lg flex items-center justify-center text-white shadow-lg group-hover:scale-105 transition-transform">
                                <Gamepad2 className="w-6 h-6" />
                            </div>
                            <div className="flex flex-col justify-center">
                                <span className="font-bold text-2xl leading-none text-white tracking-tight">
                                    TECH<span className="text-[var(--accent)]">PLAY</span>
                                </span>
                                <span className="text-[10px] font-medium text-gray-400 tracking-[0.2em] uppercase leading-none mt-1">
                                    Gaming Portal
                                </span>
                            </div>
                        </Link>
                        <p className="text-gray-400 leading-relaxed max-w-sm">
                            Your ultimate destination for gaming news, hardware reviews, and esports coverage.
                            Built by gamers, for gamers. Join our community today and level up your knowledge.
                        </p>
                        <div className="flex items-center gap-4">
                            {socialLinks.map((social, idx) => (
                                <Link
                                    key={idx}
                                    href={social.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:bg-[var(--accent)] hover:text-white transition-all transform hover:-translate-y-1"
                                >
                                    <social.icon className="w-4 h-4" />
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Links Columns (2 Cols each) */}
                    <div className="lg:col-span-2">
                        <h4 className="font-bold text-white mb-6 uppercase tracking-wider">Content</h4>
                        <ul className="space-y-3">
                            {FOOTER_LINKS.categories.map((link) => (
                                <li key={link.name}>
                                    <Link href={link.href} className="text-gray-400 hover:text-[var(--accent)] transition-colors inline-block hover:translate-x-1 duration-200">
                                        {link.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="lg:col-span-2">
                        <h4 className="font-bold text-white mb-6 uppercase tracking-wider">Community</h4>
                        <ul className="space-y-3">
                            {FOOTER_LINKS.community.map((link) => (
                                <li key={link.name}>
                                    <Link href={link.href} className="text-gray-400 hover:text-[var(--accent)] transition-colors inline-block hover:translate-x-1 duration-200">
                                        {link.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Newsletter Column (4 Cols) */}
                    <div className="lg:col-span-4 bg-[#001540] rounded-2xl p-4 sm:p-6 border border-white/5 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--accent)]/10 rounded-full blur-2xl transform translate-x-10 -translate-y-10 group-hover:bg-[var(--accent)]/20 transition-all" />

                        <h4 className="font-bold text-white text-base sm:text-lg mb-2 relative z-10">Subscribe to Newsletter</h4>
                        <p className="text-gray-400 text-xs sm:text-sm mb-4 sm:mb-6 relative z-10 leading-relaxed">
                            Get the latest gaming news and reviews directly in your inbox. No spam, we promise.
                        </p>

                        <div className="relative z-10 space-y-3">
                            {status === "success" ? (
                                <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center gap-3 text-green-500">
                                    <CheckCircle className="w-5 h-5" />
                                    <span className="text-sm font-medium">Thanks for subscribing!</span>
                                </div>
                            ) : (
                                <>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="Enter your email address"
                                            className="w-full bg-[#000B25] border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white text-xs focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] outline-none transition-all placeholder:text-gray-600"
                                            disabled={status === "loading"}
                                        />
                                    </div>
                                    <button
                                        onClick={handleSubscribe}
                                        disabled={status === "loading"}
                                        className="w-full py-3 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-[var(--accent)]/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {status === "loading" ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" /> Subscribing...
                                            </>
                                        ) : (
                                            <>
                                                Subscribe Now <ArrowRight className="w-4 h-4" />
                                            </>
                                        )}
                                    </button>
                                </>
                            )}
                            {status === "error" && (
                                <p className="text-red-500 text-xs mt-2">{message}</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-gray-400 text-xs" suppressHydrationWarning>
                        © {new Date().getFullYear()} TechPlay Gaming Portal. All rights reserved.
                    </p>
                    <div className="flex gap-6">
                        {FOOTER_LINKS.legal.map((link) => (
                            <Link key={link.name} href={link.href} className="text-gray-400 hover:text-white text-xs transition-colors">
                                {link.name}
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </footer>
    );
}


