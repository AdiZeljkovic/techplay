"use client";

import { useState } from "react";

export default function NewsletterCTA() {
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
                headers: { "Content-Type": "application/json", "Accept": "application/json" },
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
        <section className="px-4 xl:px-0 max-w-[1320px] mx-auto mt-6 mb-20 w-full relative">
            <div className="bg-zinc-50/80 dark:bg-[#0B0E14]/80 backdrop-blur-md border border-zinc-200 dark:border-[#161B22] rounded-[24px] relative overflow-hidden shadow-sm dark:shadow-[0_0_40px_rgba(0,0,0,0.5)] transition-colors duration-300">
                <div className="absolute top-0 right-[20%] w-[40%] h-[1px] bg-gradient-to-r from-transparent via-[#FC4100]/20 dark:via-[#FC4100]/40 to-transparent" />
                <div className="absolute -top-[150px] -right-[100px] w-[350px] h-[350px] bg-[#FC4100]/5 dark:bg-[#FC4100]/10 blur-[100px] rounded-full pointer-events-none" />
                <div className="absolute -bottom-[150px] -left-[100px] w-[300px] h-[300px] bg-[#FC4100]/5 blur-[80px] rounded-full pointer-events-none" />

                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between py-[46px] px-8 md:px-[60px] gap-8">
                    <div className="flex-1 text-center md:text-left">
                        <h2 className="font-display text-[26px] font-bold text-zinc-900 dark:text-white uppercase tracking-[0.05em] mb-3 drop-shadow-sm dark:drop-shadow-md">
                            STAY IN THE GAME
                        </h2>
                        <p className="text-zinc-600 dark:text-[#A1A1AA] text-[15px] max-w-md mx-auto md:mx-0 leading-relaxed">
                            Get the latest gaming news, reviews and release dates delivered straight to your inbox.
                        </p>
                    </div>

                    {status === "success" ? (
                        <div className="shrink-0 flex items-center gap-3 px-6 py-4 rounded-[12px] bg-[#10b981]/10 border border-[#10b981]/20">
                            <span className="text-[#10b981] font-semibold text-[14px]">✓ {message}</span>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="w-full md:w-auto shrink-0 max-w-lg md:max-w-none">
                            <div className="flex flex-col gap-1">
                                <div className="flex flex-col sm:flex-row">
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        placeholder="Your email address"
                                        disabled={status === "loading"}
                                        className="w-full sm:w-[300px] bg-white dark:bg-[#05070A] border border-zinc-300 dark:border-[#161B22] sm:border-r-0 rounded-[8px] sm:rounded-l-[8px] sm:rounded-r-none px-5 h-[50px] text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-[#71717A] text-[13px] focus:outline-none focus:border-tp-accent/50 transition-colors"
                                    />
                                    <button
                                        type="submit"
                                        disabled={status === "loading"}
                                        className="w-full sm:w-[160px] h-[50px] mt-2 sm:mt-0 bg-tp-accent hover:bg-tp-accent-hover text-white px-6 rounded-[8px] sm:rounded-l-none sm:rounded-r-[8px] font-bold uppercase tracking-[0.08em] text-[13px] transition-all shadow-lg border border-tp-accent hover:shadow-[0_0_20px_rgba(252,65,0,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {status === "loading" ? "..." : "SUBSCRIBE"}
                                    </button>
                                </div>
                                {status === "error" && (
                                    <p className="text-red-500 dark:text-red-400 text-[12px] pl-1">{message}</p>
                                )}
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </section>
    );
}
