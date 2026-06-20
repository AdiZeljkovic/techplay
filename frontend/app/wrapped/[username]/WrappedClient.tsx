"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Trophy,
  Clock,
  Gamepad2,
  CheckCircle2,
  Share2,
  Sparkles,
  Star,
} from "lucide-react";

interface WrappedData {
  year: number;
  username: string;
  display_name: string;
  avatar_url?: string;
  gamer_type: string;
  top_genre: string | null;
  total_hours: number;
  games_added: number;
  games_completed: number;
  most_played: { name: string; slug: string; background_image?: string; hours_played: number } | null;
  completed_games: { name: string; slug: string; background_image?: string; hours_played: number }[];
  achievements: number;
  top_achievements: { name: string; icon_path?: string; points: number }[];
}

interface Props {
  data: WrappedData;
  year: number;
}

const FADE = { hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0 } };

function StatPill({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  accent: string;
}) {
  return (
    <motion.div
      variants={FADE}
      className={`rounded-2xl border p-5 bg-white/[0.03] ${accent}`}
    >
      <Icon className="w-5 h-5 mb-3 opacity-60" />
      <p className="text-3xl font-black mb-0.5">{value}</p>
      <p className="text-xs text-zinc-400 font-semibold uppercase tracking-wider">
        {label}
      </p>
    </motion.div>
  );
}

export default function WrappedClient({ data, year }: Props) {
  const share = () => {
    if (navigator?.share) {
      navigator.share({
        title: `My ${year} Gaming Wrapped`,
        text: `Check out my TechPlay Gaming Wrapped for ${year}!`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  return (
    <div className="min-h-screen bg-[#070A0F] text-white pb-24">
      {/* Hero */}
      <div className="relative h-72 overflow-hidden">
        {data.most_played?.background_image && (
          <Image
            src={data.most_played.background_image}
            alt=""
            fill
            className="object-cover scale-105 blur-sm opacity-25"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#070A0F]" />
        <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-4">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-tp-accent/15 border border-tp-accent/30 text-tp-accent text-xs font-black tracking-widest uppercase mb-4"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Gaming Wrapped {year}
          </motion.div>
          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-5xl font-black mb-1"
          >
            {data.display_name}
          </motion.h1>
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-tp-accent font-bold text-lg"
          >
            {data.gamer_type}
          </motion.p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 mt-6">
        {/* Stats grid */}
        <motion.div
          variants={{ show: { transition: { staggerChildren: 0.08 } } }}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10"
        >
          <StatPill
            icon={Clock}
            label="Hours Played"
            value={data.total_hours}
            accent="border-blue-500/20"
          />
          <StatPill
            icon={CheckCircle2}
            label="Completed"
            value={data.games_completed}
            accent="border-emerald-500/20"
          />
          <StatPill
            icon={Gamepad2}
            label="Games Added"
            value={data.games_added}
            accent="border-tp-accent/20"
          />
          <StatPill
            icon={Trophy}
            label="Achievements"
            value={data.achievements}
            accent="border-yellow-500/20"
          />
        </motion.div>

        {/* Top genre + gamer type */}
        {data.top_genre && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-white/10 p-6 bg-gradient-to-br from-tp-accent/10 to-transparent mb-6"
          >
            <p className="text-xs font-bold uppercase tracking-widest text-tp-accent mb-2">
              Your year in gaming
            </p>
            <p className="text-2xl font-black">
              You were all about{" "}
              <span className="text-tp-accent">{data.top_genre}</span>
            </p>
            <p className="text-zinc-400 mt-1">
              That makes you a{" "}
              <span className="text-white font-bold">{data.gamer_type}</span>.
            </p>
          </motion.div>
        )}

        {/* Most played */}
        {data.most_played && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl border border-white/10 overflow-hidden mb-6"
          >
            <div className="relative aspect-[21/9] overflow-hidden">
              {data.most_played.background_image && (
                <Image
                  src={data.most_played.background_image}
                  alt={data.most_played.name}
                  fill
                  className="object-cover"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
              <div className="absolute bottom-4 left-5">
                <p className="text-xs font-bold text-tp-accent uppercase tracking-widest mb-1">
                  Most Played
                </p>
                <p className="text-xl font-black">{data.most_played.name}</p>
                <p className="text-sm text-zinc-300">
                  {data.most_played.hours_played}h played
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Completed games */}
        {data.completed_games.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mb-8"
          >
            <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-400 mb-4">
              Games completed in {year}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {data.completed_games.slice(0, 6).map((game) => (
                <Link
                  key={game.slug}
                  href={`/games/${game.slug}`}
                  className="group relative rounded-xl overflow-hidden aspect-video bg-white/5 hover:ring-1 hover:ring-tp-accent/50 transition-all"
                >
                  {game.background_image && (
                    <Image
                      src={game.background_image}
                      alt={game.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                  <div className="absolute bottom-2 left-2 right-2">
                    <p className="text-[11px] font-bold leading-snug truncate">
                      {game.name}
                    </p>
                    {game.hours_played > 0 && (
                      <p className="text-[10px] text-zinc-400">
                        {game.hours_played}h
                      </p>
                    )}
                  </div>
                  <div className="absolute top-2 right-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 drop-shadow" />
                  </div>
                </Link>
              ))}
            </div>
          </motion.div>
        )}

        {/* Top achievements */}
        {data.top_achievements.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-10"
          >
            <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-400 mb-4">
              Top achievements
            </h2>
            <div className="space-y-2">
              {data.top_achievements.map((a, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]"
                >
                  <div className="w-9 h-9 rounded-xl bg-yellow-500/15 border border-yellow-500/20 flex items-center justify-center shrink-0">
                    <Trophy className="w-4 h-4 text-yellow-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{a.name}</p>
                  </div>
                  <div className="flex items-center gap-1 text-yellow-400 text-xs font-bold">
                    <Star className="w-3 h-3" />
                    {a.points}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Share */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="text-center"
        >
          <button
            onClick={share}
            className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-tp-accent text-white font-black text-lg hover:bg-tp-accent/90 active:scale-[0.97] transition-all"
          >
            <Share2 className="w-5 h-5" />
            Share my Wrapped
          </button>
        </motion.div>
      </div>
    </div>
  );
}
