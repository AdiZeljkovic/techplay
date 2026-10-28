"use client";

import { Copy, MapPin } from "lucide-react";
import toast from "react-hot-toast";

/**
 * A waypoint's chat code, one click from the clipboard.
 *
 * Pasted into the game's chat and clicked, the code is the way there — the one
 * piece of travel advice that is exact, and that still works when the wiki is
 * down. The code is the game's own, from `/v2/continents`.
 */
export default function ChatCode({ code, label }: { code: string; label: string | null }) {
    async function copy() {
        try {
            await navigator.clipboard.writeText(code);
            toast.success("Waypoint code copied — paste it in game chat and click it.");
        } catch {
            toast.error(`Could not copy. The code is ${code}`);
        }
    }

    return (
        <button
            type="button"
            onClick={() => void copy()}
            title={`Copy ${code}`}
            aria-label={label ? `Copy the chat code for ${label}` : "Copy the waypoint chat code"}
            className="inline-flex shrink-0 items-center gap-1 rounded-[var(--radius-inner)] px-1.5 py-0.5 font-numeric text-[11px] text-[var(--ink-low)] hover:text-[var(--accent-ink)]"
        >
            <MapPin size={11} aria-hidden />
            <Copy size={11} aria-hidden />
        </button>
    );
}
