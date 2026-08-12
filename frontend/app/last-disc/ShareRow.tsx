"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Link2, Check } from "lucide-react";

const URL = "https://techplay.gg/last-disc";
const TEXT = "Sony is ending physical PlayStation discs in 2028. Digital is only bad when it's the only option — sign the open letter.";

/**
 * Share targets, opened in a window rather than navigated to: a reader who
 * shares should still be looking at the campaign afterwards.
 *
 * The marks are drawn here rather than pulled from an icon set — Facebook, X
 * and Reddit are brands, and a generic glyph in their place reads as a
 * placeholder nobody finished.
 */
const TARGETS = [
    {
        name: "Facebook",
        href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(URL)}`,
        path: "M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.96h-1.51c-1.49 0-1.96.93-1.96 1.89v2.26h3.33l-.53 3.49h-2.8V24C19.61 23.1 24 18.1 24 12.07z",
    },
    {
        name: "X",
        href: `https://twitter.com/intent/tweet?url=${encodeURIComponent(URL)}&text=${encodeURIComponent(TEXT)}`,
        path: "M18.9 1.15h3.68l-8.04 9.19L24 22.85h-7.4l-5.8-7.58-6.64 7.58H.47l8.6-9.83L0 1.15h7.59l5.24 6.93 6.07-6.93zm-1.29 19.5h2.04L6.49 3.24H4.3l13.31 17.41z",
    },
    {
        name: "Reddit",
        href: `https://www.reddit.com/submit?url=${encodeURIComponent(URL)}&title=${encodeURIComponent("The Last Disc — an open letter to Sony on physical games")}`,
        path: "M24 11.78a2.6 2.6 0 0 0-4.4-1.87 12.8 12.8 0 0 0-6.98-2.23l1.19-5.6 3.89.83a1.86 1.86 0 1 0 .2-1.24L13.5.72a.62.62 0 0 0-.74.48l-1.33 6.27a12.8 12.8 0 0 0-7.06 2.23 2.6 2.6 0 1 0-2.87 4.26 5.1 5.1 0 0 0-.06.79c0 4.02 4.69 7.29 10.47 7.29s10.47-3.27 10.47-7.29c0-.27-.02-.53-.06-.79A2.6 2.6 0 0 0 24 11.78zM6.2 13.64a1.86 1.86 0 1 1 3.72 0 1.86 1.86 0 0 1-3.72 0zm10.4 4.93c-1.28 1.28-3.72 1.37-4.44 1.37-.72 0-3.17-.1-4.44-1.37a.48.48 0 0 1 .68-.68c.8.8 2.53 1.09 3.76 1.09 1.24 0 2.96-.29 3.77-1.09a.48.48 0 1 1 .68.68zm-.34-3.07a1.86 1.86 0 1 1 0-3.72 1.86 1.86 0 0 1 0 3.72z",
    },
];

export default function ShareRow() {
    const [copied, setCopied] = useState(false);

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(URL);
            setCopied(true);
            toast.success("Link copied.");
            setTimeout(() => setCopied(false), 2000);
        } catch {
            toast.error("Couldn't copy the link.");
        }
    };

    const circle =
        "w-10 h-10 rounded-full bg-white/[0.07] hover:bg-white/[0.16] border border-white/[0.12] flex items-center justify-center text-white/70 hover:text-white transition-colors";

    return (
        <div>
            <p className="font-display text-[9.5px] font-bold uppercase tracking-[0.16em] text-white/40">
                Share this campaign
            </p>

            <div className="mt-2.5 flex items-center gap-2.5">
                {TARGETS.map(({ name, href, path }) => (
                    <a
                        key={name}
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Share on ${name}`}
                        title={`Share on ${name}`}
                        className={circle}
                    >
                        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor" aria-hidden>
                            <path d={path} />
                        </svg>
                    </a>
                ))}

                <button onClick={copy} aria-label="Copy link" title="Copy link" className={circle}>
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Link2 className="w-4 h-4" />}
                </button>
            </div>
        </div>
    );
}
