import { Metadata } from 'next'
import ClanDetailClient from './ClanDetailClient'
import { getApiUrl } from '@/lib/api'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  try {
    const res = await fetch(`${getApiUrl()}/clans/${slug}`, { next: { revalidate: 300 } })
    const json = await res.json()
    const clan = json.data
    return {
      title: `${clan?.name ?? 'Clan'} — TechPlay`,
      description: clan?.description ?? `Clan ${slug} on TechPlay`,
    }
  } catch {
    return { title: 'Clan — TechPlay' }
  }
}

export default async function ClanPage({ params }: Props) {
  const { slug } = await params
  return <ClanDetailClient slug={slug} />
}
