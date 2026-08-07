"use client";

import { useState } from "react";
import Image from "next/image";
import { MessageCircle } from "lucide-react";

const DISCORD_URL = "https://discord.gg/techplaygg";

export default function Gta6NewsletterCTA() {
    const [email, setEmail] = useState("");
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [message, setMessage] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !email.includes("@")) {
            setMessage("Please enter a valid email.");
            setStatus("error");
            return;
        }
        setStatus("loading");
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/newsletter/subscribe`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Accept: "application/json" },
                body: JSON.stringify({ email }),
            });
            const data = await res.json();
            if (res.ok) {
                setStatus("success");
                setMessage(data.message || "Check your email to verify!");
                setEmail("");
            } else {
                setStatus("error");
                setMessage(data.message || "Something went wrong.");
            }
        } catch (err) {
            setStatus("error");
            setMessage(`Network error: ${(err as Error).message}`);
        }
    };

    return (
        <div className="relative rounded-[var(--radius-panel)] overflow-hidden border border-white/[0.07] bg-[var(--surface-1)] gta6-grain">
            <Image src="/gta6/newsletter.png" alt="" fill sizes="(max-width:1320px) 100vw, 1320px" className="object-cover object-right" />
            <div className="absolute inset-0 bg-gradient-to-r from-[var(--surface-0)] via-[var(--surface-0)]/80 to-[var(--surface-0)]/20" />
            <div className="absolute inset-0 bg-gradient-to-r from-[var(--gta-violet)]/25 via-[var(--gta-pink)]/10 to-transparent pointer-events-none" />

            <div className="relative p-8 md:p-10">
                <h2 className="font-display text-[26px] md:text-[34px] font-black text-white leading-tight mb-2">
                    Don&apos;t miss a single GTA 6 drop
                </h2>
                <p className="text-white/45 text-[14px] md:text-[15px] max-w-xl mb-6">
                    Join thousands of fans and get the latest news, leaks and updates — straight to your inbox.
                </p>

                {status === "success" ? (
                    <div className="inline-flex items-center gap-3 px-6 py-4 rounded-[var(--radius-card)] bg-[#10b981]/10 border border-[#10b981]/25">
                        <span className="text-[#10b981] font-semibold text-[14px]">✓ {message}</span>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="max-w-xl">
                        <div className="flex flex-col sm:flex-row gap-2.5">
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="Enter your email"
                                disabled={status === "loading"}
                                className="flex-1 bg-[var(--surface-0)] border border-white/[0.07] rounded-[var(--radius-card)] px-5 h-[50px] text-white placeholder:text-white/35 text-[14px] focus:outline-none focus:border-[var(--gta-pink)]/50 transition-colors"
                            />
                            <button
                                type="submit"
                                disabled={status === "loading"}
                                className="h-[50px] px-7 rounded-[var(--radius-card)] bg-[var(--gta-pink)] hover:bg-[#ff1a7a] text-white font-bold uppercase tracking-wide text-[13px] transition-colors gta6-glow-pink disabled:opacity-50"
                            >
                                {status === "loading" ? "..." : "Join the Crew"}
                            </button>
                        </div>
                        {status === "error" && <p className="text-red-400 text-[12px] mt-2">{message}</p>}
                    </form>
                )}

                <div className="mt-5">
                    <a href={DISCORD_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-[13px] font-semibold text-[var(--gta-cyan)] hover:text-white transition-colors">
                        <MessageCircle className="w-4 h-4" /> or join our Discord community
                    </a>
                </div>
            </div>
        </div>
    );
}
