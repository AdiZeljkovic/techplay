'use client'

import useSWR from 'swr'
import Image from 'next/image'
import Link from 'next/link'
import { Shield, Users, Crown, UserCheck, UserMinus, LogIn, MessageSquare } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { getApiUrl } from '@/lib/api'
import toast from 'react-hot-toast'

const fetcher = (url: string) => fetch(url).then(r => r.json()).then(r => r.data)

const ROLE_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  owner:   { label: 'Owner',   icon: Crown,     color: 'text-yellow-400' },
  officer: { label: 'Officer', icon: UserCheck, color: 'text-blue-400' },
  member:  { label: 'Member',  icon: Users,     color: 'text-zinc-400' },
}

type Member = {
  id: number
  role: 'owner' | 'officer' | 'member'
  joined_at: string | null
  user: { username: string; avatar: string | null; xp: number }
}

type ClanData = {
  id: number
  name: string
  slug: string
  tag: string | null
  description: string | null
  logo: string | null
  banner: string | null
  is_public: boolean
  member_limit: number
  members_count: number
  focus: string | null
  owner: { username: string; avatar: string | null }
  members: Member[]
}

export default function ClanDetailClient({ slug }: { slug: string }) {
  const { user, token } = useAuth()
  const { data: clan, mutate, isLoading } = useSWR<ClanData>(`${getApiUrl()}/clans/${slug}`, fetcher)

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[--accent] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!clan) return (
    <div className="min-h-screen flex items-center justify-center text-zinc-400">Clan not found.</div>
  )

  const myMembership = user ? clan.members.find(m => m.user.username === user.username) : null
  const isMember = !!myMembership

  const handleJoin = async () => {
    if (!token) return
    const res = await fetch(`${getApiUrl()}/clans/${slug}/join`, {
      method: 'POST', headers: { Authorization: `Bearer ${token}` }
    })
    const json = await res.json()
    if (!res.ok) { toast.error(json.message || 'Failed'); return }
    toast.success('Joined!'); mutate()
  }

  const handleLeave = async () => {
    if (!token) return
    const res = await fetch(`${getApiUrl()}/clans/${slug}/leave`, {
      method: 'DELETE', headers: { Authorization: `Bearer ${token}` }
    })
    const json = await res.json()
    if (!res.ok) { toast.error(json.message || 'Failed'); return }
    toast.success('Left clan'); mutate()
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-10 space-y-8">
      {/* Banner */}
      <div className="relative rounded-xl overflow-hidden h-40 bg-zinc-900 border border-zinc-800">
        {clan.banner && <Image src={clan.banner} alt="" fill className="object-cover opacity-40" />}
        <div className="absolute inset-0 flex items-end p-5 gap-4">
          {clan.logo ? (
            <Image src={clan.logo} alt={clan.name} width={72} height={72} className="w-18 h-18 rounded-xl border-2 border-zinc-700 object-cover" />
          ) : (
            <div className="w-16 h-16 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center">
              <Shield size={24} className="text-zinc-500" />
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-white">{clan.name}</h1>
              {clan.tag && <span className="text-zinc-400 text-sm">[{clan.tag}]</span>}
            </div>
            {clan.focus && <p className="text-sm text-zinc-400">{clan.focus}</p>}
          </div>
        </div>
      </div>

      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-sm text-zinc-400">
          <Users size={15} />
          <span>{clan.members_count} / {clan.member_limit} members</span>
          <span>·</span>
          <span>Led by <Link href={`/profile/${clan.owner.username}`} className="text-white hover:text-[--accent]">@{clan.owner.username}</Link></span>
        </div>
        <div className="flex items-center gap-2">
          {isMember && (
            <Link href={`/forum/clan-${clan.slug}`}
              className="flex items-center gap-1.5 text-sm text-white bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 rounded-lg transition-colors">
              <MessageSquare size={14} /> Clan Forum
            </Link>
          )}
          {user && (
            isMember && myMembership.role !== 'owner' ? (
              <button onClick={handleLeave}
                className="flex items-center gap-1.5 text-sm text-red-400 hover:text-red-300 bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 rounded-lg transition-colors">
                <UserMinus size={14} /> Leave
              </button>
            ) : !isMember && clan.is_public ? (
              <button onClick={handleJoin}
                className="flex items-center gap-1.5 text-sm bg-[--accent] hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors">
                <LogIn size={14} /> Join Clan
              </button>
            ) : null
          )}
        </div>
      </div>

      {clan.description && (
        <p className="text-zinc-300 text-sm leading-relaxed">{clan.description}</p>
      )}

      {/* Members */}
      <div>
        <h2 className="font-semibold text-white mb-3">Members</h2>
        <div className="space-y-2">
          {clan.members.map(m => {
            const cfg = ROLE_CONFIG[m.role] ?? ROLE_CONFIG.member
            const RoleIcon = cfg.icon
            return (
              <div key={m.id} className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-lg p-3">
                <div className="w-9 h-9 rounded-full overflow-hidden bg-zinc-800">
                  {m.user.avatar ? (
                    <Image src={m.user.avatar} alt={m.user.username} width={36} height={36} className="object-cover w-full h-full" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-zinc-500">
                      {m.user.username[0]?.toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <Link href={`/profile/${m.user.username}`} className="font-medium text-white hover:text-[--accent] text-sm">
                    {m.user.username}
                  </Link>
                  <p className="text-xs text-zinc-500">{m.user.xp?.toLocaleString() ?? 0} XP</p>
                </div>
                <div className={`flex items-center gap-1 text-xs ${cfg.color}`}>
                  <RoleIcon size={12} />
                  <span>{cfg.label}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </main>
  )
}
