'use client'

import useSWR from 'swr'
import Image from 'next/image'
import Link from 'next/link'
import { Trophy, Gamepad2, Clock, Star, Users, Swords } from 'lucide-react'
import { getApiUrl } from '@/lib/api'

const fetcher = (url: string) => fetch(url).then(r => r.json()).then(r => r.data)

type Stats = {
  total_games: number
  completed: number
  playing: number
  hours_played: number
  reputation: number
  forum_posts: number
  articles: number
}

type PlayerCard = {
  username: string
  display_name: string
  avatar: string | null
  xp: number
  rank: string | null
}

type SharedGame = {
  game: { slug: string; name: string; background_image: string | null } | null
  status_a: string
  status_b: string
}

type CompareData = {
  player_a: PlayerCard
  player_b: PlayerCard
  stats_a: Stats
  stats_b: Stats
  shared_games: SharedGame[]
  shared_count: number
}

const STATUS_LABEL: Record<string, string> = {
  playing: 'Playing',
  completed: 'Completed',
  backlog: 'Backlog',
  wishlist: 'Wishlist',
  dropped: 'Dropped',
}

function StatRow({ label, a, b, icon: Icon }: { label: string; a: number; b: number; icon: React.ElementType }) {
  const total = a + b
  const pctA = total > 0 ? Math.round((a / total) * 100) : 50
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm text-zinc-400">
        <span className="font-mono text-white">{a.toLocaleString()}</span>
        <div className="flex items-center gap-1.5 text-zinc-400">
          <Icon size={13} />
          <span>{label}</span>
        </div>
        <span className="font-mono text-white">{b.toLocaleString()}</span>
      </div>
      <div className="flex h-2 rounded-full overflow-hidden bg-zinc-800">
        <div className="bg-[--accent] transition-all" style={{ width: `${pctA}%` }} />
        <div className="bg-blue-500 transition-all" style={{ width: `${100 - pctA}%` }} />
      </div>
    </div>
  )
}

function PlayerHeader({ player, side }: { player: PlayerCard; side: 'a' | 'b' }) {
  const accent = side === 'a' ? 'border-[--accent]' : 'border-blue-500'
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <div className={`w-20 h-20 rounded-full overflow-hidden border-2 ${accent}`}>
        {player.avatar ? (
          <Image src={player.avatar} alt={player.username} width={80} height={80} className="object-cover w-full h-full" />
        ) : (
          <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-2xl font-bold text-zinc-500">
            {player.username[0]?.toUpperCase()}
          </div>
        )}
      </div>
      <div>
        <Link href={`/profile/${player.username}`} className="font-bold text-white hover:text-[--accent]">
          {player.display_name}
        </Link>
        <p className="text-zinc-400 text-sm">@{player.username}</p>
        {player.rank && <span className="text-xs text-zinc-500">{player.rank}</span>}
      </div>
    </div>
  )
}

export default function CompareClient({ username, other }: { username: string; other: string }) {
  const { data, isLoading } = useSWR<CompareData>(
    `${getApiUrl()}/compare/${username}/${other}`,
    fetcher
  )

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[--accent] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!data) return (
    <div className="min-h-screen flex items-center justify-center text-zinc-400">
      Could not load comparison.
    </div>
  )

  return (
    <main className="max-w-4xl mx-auto px-4 py-10 space-y-8">
      {/* Header */}
      <div className="text-center space-y-1">
        <div className="flex items-center justify-center gap-2 text-zinc-400 text-sm">
          <Swords size={16} className="text-[--accent]" />
          <span>Profile Comparison</span>
        </div>
        <h1 className="text-2xl font-bold text-white">
          {data.player_a.display_name} <span className="text-zinc-500">vs</span> {data.player_b.display_name}
        </h1>
      </div>

      {/* Players */}
      <div className="grid grid-cols-3 gap-4 items-center">
        <PlayerHeader player={data.player_a} side="a" />
        <div className="flex flex-col items-center gap-1">
          <div className="text-3xl font-black text-zinc-600">VS</div>
          <div className="text-sm text-zinc-400">
            <span className="text-green-400 font-bold">{data.shared_count}</span> shared games
          </div>
        </div>
        <PlayerHeader player={data.player_b} side="b" />
      </div>

      {/* Stat comparison */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4">
        <h2 className="font-semibold text-white mb-4">Stats</h2>
        <StatRow label="Games" a={data.stats_a.total_games} b={data.stats_b.total_games} icon={Gamepad2} />
        <StatRow label="Completed" a={data.stats_a.completed} b={data.stats_b.completed} icon={Trophy} />
        <StatRow label="Hours Played" a={data.stats_a.hours_played} b={data.stats_b.hours_played} icon={Clock} />
        <StatRow label="Reputation" a={data.stats_a.reputation} b={data.stats_b.reputation} icon={Star} />
        <StatRow label="Forum Posts" a={data.stats_a.forum_posts} b={data.stats_b.forum_posts} icon={Users} />
        <div className="flex justify-between text-xs text-zinc-500 pt-2">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[--accent] inline-block" />{data.player_a.username}</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />{data.player_b.username}</span>
        </div>
      </div>

      {/* Shared Games */}
      {data.shared_games.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-semibold text-white">Games Both Play</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {data.shared_games.map((sg, i) => sg.game && (
              <Link href={`/games/${sg.game.slug}`} key={i}
                className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-lg p-3 hover:border-zinc-600 transition-colors">
                {sg.game.background_image && (
                  <Image src={sg.game.background_image} alt={sg.game.name} width={64} height={40}
                    className="w-16 h-10 object-cover rounded" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white text-sm truncate">{sg.game.name}</p>
                  <div className="flex gap-2 text-xs text-zinc-400">
                    <span className="text-[--accent]">{STATUS_LABEL[sg.status_a] ?? sg.status_a}</span>
                    <span>·</span>
                    <span className="text-blue-400">{STATUS_LABEL[sg.status_b] ?? sg.status_b}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </main>
  )
}
