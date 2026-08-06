'use client'

import useSWR from 'swr'
import Image from 'next/image'
import { Trophy, Gamepad2, CheckCircle2 } from 'lucide-react'
import { format } from 'date-fns'
import { getApiUrl } from '@/lib/api'

const fetcher = (url: string) => fetch(url).then(r => r.json()).then(r => r.data)

type SteamAch = {
  id: number
  display_name: string | null
  description: string | null
  icon_url: string | null
  achieved_at: string | null
  game: { name: string; slug: string; cover_url: string | null } | null
}

type SteamAchData = {
  total: number
  achieved: number
  completion_pct: number
  items: SteamAch[]
}

export default function SteamAchievements({ username }: { username: string }) {
  const { data, isLoading } = useSWR<SteamAchData>(
    `${getApiUrl()}/users/${username}/steam-achievements`,
    fetcher
  )

  if (isLoading) return (
    <div className="flex items-center justify-center py-12">
      <div className="w-6 h-6 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!data || data.total === 0) return (
    <div className="flex flex-col items-center justify-center py-16 text-zinc-500 gap-3">
      <Gamepad2 size={32} className="opacity-40" />
      <p className="text-sm">No Steam achievements imported yet.</p>
      <p className="text-xs text-zinc-600">Connect your Steam account to import achievements.</p>
    </div>
  )

  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="flex items-center gap-6 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-4">
        <div className="text-center">
          <p className="text-2xl font-bold text-[var(--accent)]">{data.achieved}</p>
          <p className="text-xs text-zinc-500">Unlocked</p>
        </div>
        <div className="flex-1">
          <div className="flex justify-between text-xs text-zinc-400 mb-1">
            <span>{data.completion_pct}% complete</span>
            <span>{data.achieved} / {data.total}</span>
          </div>
          <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
            <div className="h-full bg-[var(--accent)] rounded-full transition-all" style={{ width: `${data.completion_pct}%` }} />
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-zinc-400">
          <Trophy size={16} className="text-yellow-400" />
          <span className="text-sm">Steam</span>
        </div>
      </div>

      {/* Achievement grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {data.items.map(ach => (
          <div key={ach.id} className="flex items-center gap-3 bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-3">
            {ach.icon_url ? (
              <Image src={ach.icon_url} alt={ach.display_name ?? ''} width={40} height={40}
                className="w-10 h-10 rounded flex-shrink-0" />
            ) : (
              <div className="w-10 h-10 rounded bg-white/[0.06] flex items-center justify-center flex-shrink-0">
                <CheckCircle2 size={18} className="text-green-400" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-white text-sm truncate">{ach.display_name ?? 'Unknown'}</p>
              {ach.description && (
                <p className="text-xs text-zinc-500 truncate">{ach.description}</p>
              )}
              {ach.game && (
                <p className="text-xs text-zinc-600 truncate">{ach.game.name}</p>
              )}
            </div>
            {ach.achieved_at && (
              <span className="text-xs text-zinc-500 flex-shrink-0">
                {format(new Date(ach.achieved_at), 'MMM d')}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
