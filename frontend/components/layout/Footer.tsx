"use client";

import Link from "next/link";
import { Facebook, Twitter, Instagram, Youtube, Linkedin, Mail, Gamepad2, ArrowRight, Loader2, CheckCircle } from "lucide-react";
import { useState } from "react";
import { Button } from "../ui/Button";
import { useSiteSettings } from "@/context/SiteSettingsContext";

const FOOTER_LINKS = {
    categories: [
        { name: "News", href: "/news" },
        { name: "Reviews", href: "/reviews" },
        { name: "Hardware", href: "/hardware" },
        { name: "Esports", href: "/esports" },
        { name: "Guides", href: "/guides" },
        { name: "Videos", href: "/videos" },
    ],
    community: [
        { name: "Discord Server", href: "#" },
        { name: "Forums", href: "/forum" },
        { name: "Community Guidelines", href: "#" },
        { name: "Merch Shop", href: "/shop" },
        { name: "Help Center", href: "/help" },
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
    discord_url: Linkedin,
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
                headers: { "Content-Type": "application/json" },
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
                    <div className="lg:col-span-4 bg-[#001540] rounded-2xl p-6 border border-white/5 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--accent)]/10 rounded-full blur-2xl transform translate-x-10 -translate-y-10 group-hover:bg-[var(--accent)]/20 transition-all" />

                        <h4 className="font-bold text-white text-lg mb-2 relative z-10">Subscribe to Newsletter</h4>
                        <p className="text-gray-400 text-xs mb-6 relative z-10 leading-relaxed">
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
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
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
                    <p className="text-gray-500 text-xs">
                        © {new Date().getFullYear()} TechPlay Gaming Portal. All rights reserved.
                    </p>
                    <div className="flex gap-6">
                        {FOOTER_LINKS.legal.map((link) => (
                            <Link key={link.name} href={link.href} className="text-gray-500 hover:text-white text-xs transition-colors">
                                {link.name}
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </footer>
    );
}


