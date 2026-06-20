'use client'

import { useState } from 'react'
import useSWR from 'swr'
import Image from 'next/image'
import Link from 'next/link'
import { Search, Shield, Users, Plus, X } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { getApiUrl } from '@/lib/api'
import toast from 'react-hot-toast'

const fetcher = (url: string) => fetch(url).then(r => r.json()).then(r => r.data)

type Clan = {
  id: number
  name: string
  slug: string
  tag: string | null
  description: string | null
  logo: string | null
  is_public: boolean
  members_count: number
  member_limit: number
  focus: string | null
  owner: { username: string; avatar: string | null }
}

type MyClan = { clan: Clan; role: string } | null

function CreateClanModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const { token } = useAuth()
  const [form, setForm] = useState({ name: '', description: '', tag: '', is_public: true, focus: '' })
  const [saving, setSaving] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch(`${getApiUrl()}/clans`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      })
      const json = await res.json()
      if (!res.ok) { toast.error(json.message || 'Failed'); return }
      toast.success('Clan created!')
      onCreated()
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-white text-lg">Create a Clan</h2>
          <button onClick={onClose}><X size={18} className="text-zinc-400" /></button>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="text-xs text-zinc-400 mb-1 block">Clan Name *</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-zinc-500"
              required minLength={3} maxLength={40} placeholder="e.g. Shadow Knights" />
          </div>
          <div>
            <label className="text-xs text-zinc-400 mb-1 block">Tag (max 8 chars)</label>
            <input value={form.tag} onChange={e => setForm(f => ({ ...f, tag: e.target.value }))}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-zinc-500"
              maxLength={8} placeholder="SK" />
          </div>
          <div>
            <label className="text-xs text-zinc-400 mb-1 block">Description</label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-zinc-500 resize-none"
              rows={3} maxLength={500} />
          </div>
          <div>
            <label className="text-xs text-zinc-400 mb-1 block">Focus (RPG, FPS, Strategy…)</label>
            <input value={form.focus} onChange={e => setForm(f => ({ ...f, focus: e.target.value }))}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-zinc-500"
              maxLength={60} placeholder="e.g. Competitive FPS" />
          </div>
          <label className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer">
            <input type="checkbox" checked={form.is_public} onChange={e => setForm(f => ({ ...f, is_public: e.target.checked }))}
              className="accent-[--accent]" />
            Public clan (anyone can join)
          </label>
          <button type="submit" disabled={saving}
            className="w-full bg-[--accent] hover:bg-orange-600 text-white rounded-lg py-2 text-sm font-semibold transition-colors disabled:opacity-60">
            {saving ? 'Creating…' : 'Create Clan'}
          </button>
        </form>
      </div>
    </div>
  )
}

function ClanCard({ clan, isMember, onJoin }: { clan: Clan; isMember: boolean; onJoin: () => void }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3 hover:border-zinc-700 transition-colors">
      <div className="flex items-start gap-3">
        {clan.logo ? (
          <Image src={clan.logo} alt={clan.name} width={48} height={48} className="w-12 h-12 rounded-lg object-cover" />
        ) : (
          <div className="w-12 h-12 rounded-lg bg-zinc-800 flex items-center justify-center">
            <Shield size={20} className="text-zinc-500" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Link href={`/clans/${clan.slug}`} className="font-semibold text-white hover:text-[--accent] truncate">
              {clan.name}
            </Link>
            {clan.tag && <span className="text-xs text-zinc-400 bg-zinc-800 px-1.5 py-0.5 rounded">[{clan.tag}]</span>}
          </div>
          {clan.focus && <p className="text-xs text-zinc-500">{clan.focus}</p>}
        </div>
      </div>
      {clan.description && (
        <p className="text-sm text-zinc-400 line-clamp-2">{clan.description}</p>
      )}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 text-zinc-400 text-sm">
          <Users size={14} />
          <span>{clan.members_count}/{clan.member_limit}</span>
        </div>
        {isMember ? (
          <span className="text-xs text-green-400 font-medium">Member</span>
        ) : clan.is_public ? (
          <button onClick={onJoin}
            className="text-xs bg-zinc-800 hover:bg-[--accent] text-white px-3 py-1 rounded-lg transition-colors font-medium">
            Join
          </button>
        ) : (
          <span className="text-xs text-zinc-600">Invite only</span>
        )}
      </div>
    </div>
  )
}

export default function ClansClient() {
  const { user, token } = useAuth()
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [joinedSlugs, setJoinedSlugs] = useState<Set<string>>(new Set())

  const { data: clansData, mutate } = useSWR(
    `${getApiUrl()}/clans${search ? `?search=${encodeURIComponent(search)}` : ''}`,
    fetcher
  )
  const { data: myClan } = useSWR<MyClan>(
    token ? [`${getApiUrl()}/user/clan`, token] : null,
    ([url]: [string]) => fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(r => r.data)
  )

  const clans: Clan[] = clansData?.data ?? clansData ?? []

  const handleJoin = async (slug: string) => {
    if (!token) { toast.error('Log in to join a clan'); return }
    try {
      const res = await fetch(`${getApiUrl()}/clans/${slug}/join`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      const json = await res.json()
      if (!res.ok) { toast.error(json.message || 'Failed'); return }
      toast.success('Joined clan!')
      setJoinedSlugs(s => new Set([...s, slug]))
      mutate()
    } catch {
      toast.error('Something went wrong')
    }
  }

  return (
    <main className="max-w-5xl mx-auto px-4 py-10 space-y-8">
      {showCreate && (
        <CreateClanModal onClose={() => setShowCreate(false)} onCreated={() => mutate()} />
      )}

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Shield className="text-[--accent]" size={22} />
          Clans
        </h1>
        {user && !myClan && (
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 bg-[--accent] hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
            <Plus size={15} />
            Create Clan
          </button>
        )}
      </div>

      {myClan && (
        <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-4 flex items-center gap-4">
          <Shield size={20} className="text-[--accent]" />
          <div>
            <p className="text-zinc-400 text-sm">Your Clan</p>
            <Link href={`/clans/${myClan.clan.slug}`} className="font-semibold text-white hover:text-[--accent]">
              [{myClan.clan.tag}] {myClan.clan.name}
            </Link>
            <span className="ml-2 text-xs text-zinc-500 capitalize">{myClan.role}</span>
          </div>
        </div>
      )}

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search clans…"
          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-4 py-2 text-white text-sm focus:outline-none focus:border-zinc-600" />
      </div>

      {clans.length === 0 ? (
        <p className="text-zinc-500 text-center py-12">No clans found.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {clans.map(clan => (
            <ClanCard
              key={clan.id}
              clan={clan}
              isMember={myClan?.clan.id === clan.id || joinedSlugs.has(clan.slug)}
              onJoin={() => handleJoin(clan.slug)}
            />
          ))}
        </div>
      )}
    </main>
  )
}
