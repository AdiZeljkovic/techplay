"use client";

import { useState } from "react";
import useSWR from "swr";
import axios from "@/lib/axios";
import toast from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";
import { Bell, BellRing, Loader2 } from "lucide-react";

const fetcher = (url: string) => axios.get(url).then((r) => r.data?.data ?? null);

interface Props {
    slug: string;
    gameName?: string;
    variant?: "hero" | "sidebar";
}

export default function NotifyMeButton({ slug, gameName, variant = "hero" }: Props) {
    const { user } = useAuth();
    const [busy, setBusy] = useState(false);

    const swrKey = user ? `/collection/games/${slug}` : null;
    const { data: entry, mutate } = useSWR(swrKey, fetcher);

    const isWishlisted = entry?.status === "wishlist";

    async function handleClick() {
        if (!user) {
            window.location.href = "/login";
            return;
        }
        if (busy) return;
        setBusy(true);
        try {
            if (isWishlisted) {
                await axios.delete(`/collection/games/${slug}`);
                mutate(null, false);
                toast.success("Release tracking removed");
            } else {
                await axios.put(`/collection/games/${slug}`, { status: "wishlist" });
                await mutate();
                toast.success(
                    gameName
                        ? `You'll be notified when ${gameName} releases!`
                        : "Added to wishlist — you'll be notified on release!"
                );
            }
        } catch {
            toast.error("Something went wrong");
        } finally {
            setBusy(false);
        }
    }

    if (variant === "sidebar") {
        return (
            <button
                onClick={handleClick}
                disabled={busy}
                className={`w-full flex items-center justify-center gap-2 py-2.5 text-[10px] font-bold uppercase tracking-widest rounded-full transition-all ${
                    isWishlisted
                        ? "bg-pink-600/20 border border-pink-500/40 text-pink-400 hover:bg-pink-600/30"
                        : "bg-zinc-100 dark:bg-white/[0.03] border border-zinc-200 dark:border-white/[0.07] text-zinc-600 dark:text-white/50 hover:text-zinc-900 dark:hover:text-white dark:hover:border-white/20"
                }`}
            >
                {busy ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : isWishlisted ? (
                    <BellRing className="w-3.5 h-3.5" />
                ) : (
                    <Bell className="w-3.5 h-3.5" />
                )}
                {isWishlisted ? "Tracking Release" : "Notify Me on Release"}
            </button>
        );
    }

    return (
        <button
            onClick={handleClick}
            disabled={busy}
            className={`flex items-center gap-2 px-5 py-[11px] text-[11px] font-bold uppercase tracking-widest rounded-xl transition-all whitespace-nowrap ${
                isWishlisted
                    ? "bg-pink-600/20 border border-pink-500/40 text-pink-400 hover:bg-pink-600/30"
                    : "bg-white/[0.04] border border-white/10 text-white/60 hover:bg-white/10 hover:text-white hover:border-white/25"
            }`}
        >
            {busy ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : isWishlisted ? (
                <BellRing className="w-3.5 h-3.5" />
            ) : (
                <Bell className="w-3.5 h-3.5" />
            )}
            {isWishlisted ? "Tracking Release" : "Notify Me on Release"}
        </button>
    );
}
