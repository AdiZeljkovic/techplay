"use client";

import { useState } from "react";
import { Share2, X, Check, Download, Link2, Loader2 } from "lucide-react";

interface Props {
    /** The OG route that draws the card. */
    imageUrl: string;
    /** What gets copied and shared. */
    pageUrl: string;
    title: string;
    /** Filename for the download, without an extension. */
    fileName: string;
    label?: string;
    className?: string;
    /**
     * Drive it from somewhere else — a menu item, say. When these are passed
     * the component draws no button of its own, only the card.
     */
    open?: boolean;
    onClose?: () => void;
}

/**
 * Shows the share card, rather than only mentioning it.
 *
 * The OG images have existed for months and looked good, and the only way to
 * see one was to paste a link somewhere else and wait for that site to unfurl
 * it. Meanwhile "Share" copied a URL and said "Copied" — which is a clipboard
 * operation, not a moment worth having.
 *
 * The card is the thing being shared, so the card is what the button opens.
 * Then three ways out: the system share sheet where it exists (phones, which is
 * where sharing actually happens), a download, and the plain link for everyone
 * else.
 */
export default function ShareCard({
    imageUrl, pageUrl, title, fileName, label = "Share", className = "", open: openProp, onClose,
}: Props) {
    const [openSelf, setOpenSelf] = useState(false);

    const controlled = openProp !== undefined;
    const open = controlled ? openProp : openSelf;
    const setOpen = (next: boolean) => {
        if (controlled) {
            if (!next) onClose?.();

            return;
        }

        setOpenSelf(next);
    };
    const [copied, setCopied] = useState(false);
    const [saving, setSaving] = useState(false);

    const copy = () => {
        navigator.clipboard?.writeText(pageUrl).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    const download = async () => {
        setSaving(true);
        try {
            const res = await fetch(imageUrl);
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${fileName}.png`;
            a.click();
            URL.revokeObjectURL(url);
        } catch {
            // Nothing to say — the card is on screen and the link still works.
        } finally {
            setSaving(false);
        }
    };

    // Only offered where it exists. A button that does nothing on desktop is
    // worse than one that is not there.
    const canShareNatively = typeof navigator !== "undefined" && typeof navigator.share === "function";

    const shareNatively = () => {
        navigator.share?.({ title, url: pageUrl }).catch(() => {});
    };

    return (
        <>
            {!controlled && (
            <button
                onClick={() => setOpen(true)}
                className={`inline-flex items-center gap-2 h-9 px-4 rounded-[var(--radius-card)] bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] font-display text-[10.5px] font-bold uppercase tracking-[0.1em] text-white transition-colors ${className}`}
            >
                <Share2 className="w-3.5 h-3.5" /> {label}
            </button>
            )}

            {open && (
                <div className="fixed inset-0 z-[80] flex items-center justify-center px-4 bg-black/75 backdrop-blur-sm">
                    <button aria-label="Close" onClick={() => setOpen(false)} className="absolute inset-0 cursor-default" />

                    <div className="relative w-full max-w-[620px] rounded-[var(--radius-panel)] border border-[var(--line-strong)] bg-[var(--surface-2)] shadow-[0_30px_80px_rgba(0,0,0,0.7)] overflow-hidden">
                        <div className="flex items-center justify-between gap-3 px-5 py-3.5 border-b border-white/[0.07]">
                            <p className="font-display text-[11px] font-black uppercase tracking-[0.15em] text-white">Share card</p>
                            <button onClick={() => setOpen(false)} aria-label="Close" className="text-white/30 hover:text-white transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="p-5">
                            {/* The card itself, at the ratio every network
                                renders it. */}
                            <div className="rounded-[var(--radius-card)] overflow-hidden border border-white/[0.08] bg-[var(--surface-0)] aspect-[1200/630]">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={imageUrl} alt={title} className="w-full h-full object-cover" />
                            </div>

                            <div className="mt-4 flex flex-wrap items-center gap-2">
                                {canShareNatively && (
                                    <button
                                        onClick={shareNatively}
                                        className="inline-flex items-center gap-2 h-10 px-4 rounded-[var(--radius-card)] bg-[var(--accent)] hover:brightness-110 font-display text-[10.5px] font-bold uppercase tracking-[0.1em] text-white transition-[filter]"
                                    >
                                        <Share2 className="w-3.5 h-3.5" /> Share
                                    </button>
                                )}

                                <button
                                    onClick={download}
                                    disabled={saving}
                                    className="inline-flex items-center gap-2 h-10 px-4 rounded-[var(--radius-card)] bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] font-display text-[10.5px] font-bold uppercase tracking-[0.1em] text-white transition-colors disabled:opacity-60"
                                >
                                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />} Save image
                                </button>

                                <button
                                    onClick={copy}
                                    className="inline-flex items-center gap-2 h-10 px-4 rounded-[var(--radius-card)] bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] font-display text-[10.5px] font-bold uppercase tracking-[0.1em] text-white transition-colors"
                                >
                                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Link2 className="w-3.5 h-3.5" />}
                                    {copied ? "Copied" : "Copy link"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
