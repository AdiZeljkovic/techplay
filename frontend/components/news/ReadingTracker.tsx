"use client";

import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { Bookmark, BookmarkCheck, Loader2 } from "lucide-react";
import axios from "@/lib/axios";
import { useAuth } from "@/context/AuthContext";

/**
 * Records how far a logged-in reader gets through an article (for the
 * dashboard's Continue Reading card) and offers a save-for-later toggle.
 * Renders nothing for guests.
 */
export default function ReadingTracker({ slug }: { slug: string }) {
    const { user } = useAuth();
    const [saved, setSaved] = useState<boolean | null>(null);
    const [busy, setBusy] = useState(false);
    const lastSent = useRef(0);

    // Scroll depth → progress, sent at most once per 10% gained
    useEffect(() => {
        if (!user) return;

        let frame = 0;
        const measure = () => {
            frame = 0;
            const scrollable = document.documentElement.scrollHeight - window.innerHeight;
            if (scrollable <= 0) return;

            const percent = Math.min(100, Math.round((window.scrollY / scrollable) * 100));
            if (percent < 5 || percent < lastSent.current + 10) return;

            lastSent.current = percent;
            axios.put(`/articles/${slug}/progress`, { progress: percent }).catch(() => {
                // progress is best-effort; never interrupt reading
            });
        };

        const onScroll = () => {
            if (!frame) frame = requestAnimationFrame(measure);
        };

        window.addEventListener("scroll", onScroll, { passive: true });
        return () => {
            window.removeEventListener("scroll", onScroll);
            if (frame) cancelAnimationFrame(frame);
        };
    }, [user, slug]);

    if (!user) return null;

    const toggle = async () => {
        if (busy) return;
        setBusy(true);
        try {
            const res = await axios.post(`/articles/${slug}/bookmark`);
            const next = !!res.data?.data?.bookmarked;
            setSaved(next);
            toast.success(res.data?.message ?? (next ? "Saved" : "Removed"));
        } catch {
            toast.error("Couldn't update your reading list.");
        } finally {
            setBusy(false);
        }
    };

    return (
        <button
            onClick={toggle}
            disabled={busy}
            title={saved ? "Remove from reading list" : "Save for later"}
            className={`inline-flex items-center gap-1.5 h-8 px-3.5 rounded-[8px] font-display text-[10.5px] font-black uppercase tracking-[0.1em] transition-[filter,background] ${
                saved
                    ? "bg-[var(--accent)]/12 text-[var(--accent-ink)] shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--accent)_40%,transparent)]"
                    : "bg-[var(--accent)] text-white hover:brightness-110"
            }`}
        >
            {busy ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : saved ? (
                <BookmarkCheck className="w-3.5 h-3.5" />
            ) : (
                <Bookmark className="w-3.5 h-3.5" />
            )}
            {saved ? "Saved" : "Save"}
        </button>
    );
}
