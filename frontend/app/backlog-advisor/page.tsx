"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  BookmarkPlus,
  Clock,
  Gamepad2,
  Loader2,
  Sparkles,
  Swords,
  BookOpen,
  Zap,
  Coffee,
} from "lucide-react";
import axios from "@/lib/axios";
import { useAuth } from "@/context/AuthContext";
import { getApiUrl } from "@/lib/api";

const MOODS = [
  { id: "any", label: "Surprise me", Icon: Sparkles },
  { id: "action", label: "Action", Icon: Swords },
  { id: "story", label: "Story", Icon: BookOpen },
  { id: "relaxed", label: "Chill", Icon: Coffee },
  { id: "competitive", label: "Competitive", Icon: Zap },
];

const TIMES = [1, 2, 3, 5, 8];

interface Suggestion {
  game_name: string;
  reason: string;
  mood_match: string;
  estimated_hours: number;
  game?: {
    slug: string;
    background_image?: string;
    rating?: number;
  };
}

export default function BacklogAdvisorPage() {
  const { user, token } = useAuth();
  const [mood, setMood] = useState("any");
  const [hours, setHours] = useState(3);
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);
  const [error, setError] = useState<string | null>(null);

  const getSuggestion = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    setSuggestion(null);

    try {
      const res = await fetch(`${getApiUrl()}/backlog/suggest`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ mood, time_available: hours }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Something went wrong");
      setSuggestion(data.data);
    } catch (e: any) {
      setError(e.message ?? "Failed to get suggestion");
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <BookmarkPlus className="w-12 h-12 text-zinc-400 mx-auto mb-4" />
          <p className="text-zinc-400">Sign in to use the Backlog Advisor</p>
          <Link
            href="/login"
            className="mt-4 inline-block px-5 py-2 bg-tp-accent text-white rounded-lg font-semibold text-sm"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070A0F] text-white">
      <div className="max-w-2xl mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-tp-accent/10 border border-tp-accent/20 text-tp-accent text-xs font-bold tracking-widest uppercase mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            AI Backlog Advisor
          </div>
          <h1 className="text-4xl font-black mb-3">
            What should you play next?
          </h1>
          <p className="text-zinc-400">
            Tell us your mood and how much time you have — our AI will pick the
            perfect game from your backlog.
          </p>
        </div>

        {/* Mood picker */}
        <div className="mb-8">
          <p className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">
            Current mood
          </p>
          <div className="flex flex-wrap gap-2">
            {MOODS.map(({ id, label, Icon }) => (
              <button
                key={id}
                onClick={() => setMood(id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold transition-all ${
                  mood === id
                    ? "bg-tp-accent border-tp-accent text-white"
                    : "bg-white/5 border-white/10 text-zinc-300 hover:border-tp-accent/50"
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Time picker */}
        <div className="mb-10">
          <p className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">
            <Clock className="w-4 h-4 inline mr-1" />
            Available time
          </p>
          <div className="flex gap-2">
            {TIMES.map((h) => (
              <button
                key={h}
                onClick={() => setHours(h)}
                className={`w-14 h-10 rounded-xl border text-sm font-bold transition-all ${
                  hours === h
                    ? "bg-tp-accent border-tp-accent text-white"
                    : "bg-white/5 border-white/10 text-zinc-300 hover:border-tp-accent/50"
                }`}
              >
                {h}h
              </button>
            ))}
          </div>
        </div>

        {/* CTA */}
        <button
          onClick={getSuggestion}
          disabled={loading}
          className="w-full py-4 rounded-2xl bg-tp-accent text-white font-black text-lg flex items-center justify-center gap-3 hover:bg-tp-accent/90 active:scale-[0.98] transition-all disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Thinking…
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              Get my pick
            </>
          )}
        </button>

        {/* Error */}
        {error && (
          <div className="mt-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        {/* Result */}
        {suggestion && (
          <div className="mt-10 rounded-2xl border border-white/10 overflow-hidden">
            {suggestion.game?.background_image && (
              <div className="relative aspect-video">
                <Image
                  src={suggestion.game.background_image}
                  alt={suggestion.game_name}
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0D1117] via-[#0D1117]/40 to-transparent" />
                <div className="absolute bottom-4 left-5">
                  <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-tp-accent/20 border border-tp-accent/40 text-tp-accent text-[11px] font-bold uppercase tracking-widest mb-2">
                    <Sparkles className="w-3 h-3" />
                    AI Pick
                  </div>
                </div>
              </div>
            )}

            <div className="p-6 bg-[#0D1117]">
              <h2 className="text-2xl font-black mb-1">{suggestion.game_name}</h2>

              <div className="flex items-center gap-4 text-sm text-zinc-400 mb-5">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  ~{suggestion.estimated_hours}h session
                </span>
                {suggestion.game?.rating && (
                  <span className="flex items-center gap-1.5">
                    <Gamepad2 className="w-4 h-4" />
                    {suggestion.game.rating.toFixed(1)}/5 rating
                  </span>
                )}
              </div>

              <p className="text-zinc-300 leading-relaxed mb-3">
                {suggestion.reason}
              </p>

              {suggestion.mood_match && (
                <p className="text-zinc-500 text-sm italic mb-6">
                  {suggestion.mood_match}
                </p>
              )}

              <div className="flex gap-3">
                {suggestion.game?.slug && (
                  <Link
                    href={`/games/${suggestion.game.slug}`}
                    prefetch={false}
                    className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-center text-sm font-semibold hover:border-tp-accent/40 transition-colors"
                  >
                    View Game
                  </Link>
                )}
                <button
                  onClick={getSuggestion}
                  className="flex-1 py-3 rounded-xl bg-tp-accent text-white text-sm font-bold hover:bg-tp-accent/90 transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
