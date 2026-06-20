"use client";

import { useState } from "react";
import useSWR, { mutate } from "swr";
import axios from "@/lib/axios";
import { Heart, Lightbulb, Smile, Crown, ChevronDown } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "@/hooks/useAuth";

interface RecognitionEntry {
    type: string;
    label: string;
    count: number;
    given_by_me: boolean;
}

const ICONS: Record<string, React.ReactNode> = {
    helpful:    <Heart className="w-3.5 h-3.5" />,
    insightful: <Lightbulb className="w-3.5 h-3.5" />,
    friendly:   <Smile className="w-3.5 h-3.5" />,
    leader:     <Crown className="w-3.5 h-3.5" />,
};

const COLORS: Record<string, string> = {
    helpful:    "text-pink-400 hover:bg-pink-500/10 border-pink-500/20",
    insightful: "text-yellow-400 hover:bg-yellow-500/10 border-yellow-500/20",
    friendly:   "text-green-400 hover:bg-green-500/10 border-green-500/20",
    leader:     "text-blue-400 hover:bg-blue-500/10 border-blue-500/20",
};

const ACTIVE_COLORS: Record<string, string> = {
    helpful:    "bg-pink-500/15 border-pink-400/40 text-pink-300",
    insightful: "bg-yellow-500/15 border-yellow-400/40 text-yellow-300",
    friendly:   "bg-green-500/15 border-green-400/40 text-green-300",
    leader:     "bg-blue-500/15 border-blue-400/40 text-blue-300",
};

const fetcher = (url: string) => axios.get(url).then((r) => r.data?.data ?? []);

export default function GiveRecognitionButton({ username }: { username: string }) {
    const { user } = useAuth();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState<string | null>(null);

    const swrKey = `/users/${username}/recognitions`;
    const { data: recognitions } = useSWR<RecognitionEntry[]>(swrKey, fetcher);

    if (!user || user.username === username) return null;

    async function give(type: string, alreadyGiven: boolean) {
        if (loading) return;
        setLoading(type);
        try {
            if (alreadyGiven) {
                await axios.delete(`/users/${username}/recognitions/${type}`);
                toast.success("Recognition removed");
            } else {
                await axios.post(`/users/${username}/recognitions`, { type });
                toast.success("Recognition given!");
            }
            mutate(swrKey);
        } catch (err: any) {
            toast.error(err?.response?.data?.message ?? "Failed");
        } finally {
            setLoading(null);
            setOpen(false);
        }
    }

    return (
        <div className="relative">
            <button
                onClick={() => setOpen((v) => !v)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-white/70 hover:text-white text-[12px] font-semibold transition-colors"
            >
                <Heart className="w-3.5 h-3.5" />
                Recognise
                <ChevronDown className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`} />
            </button>

            {open && (
                <>
                    {/* Backdrop */}
                    <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
                    <div className="absolute right-0 top-10 z-40 w-48 rounded-xl bg-[#0d1117] border border-white/10 shadow-2xl overflow-hidden">
                        {(recognitions ?? []).map((r) => (
                            <button
                                key={r.type}
                                onClick={() => give(r.type, r.given_by_me)}
                                disabled={loading === r.type}
                                className={`w-full flex items-center justify-between px-3 py-2.5 text-[12px] font-semibold border-b border-white/[0.04] last:border-0 transition-colors ${
                                    r.given_by_me
                                        ? ACTIVE_COLORS[r.type]
                                        : `text-white/60 hover:text-white hover:bg-white/[0.04] ${COLORS[r.type]}`
                                }`}
                            >
                                <span className="flex items-center gap-2">
                                    {ICONS[r.type]}
                                    {r.label}
                                </span>
                                <span className="text-[11px] opacity-60 font-bold">{r.count}</span>
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
