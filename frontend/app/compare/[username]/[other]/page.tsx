import { Metadata } from 'next'
import CompareClient from './CompareClient'

type Props = { params: Promise<{ username: string; other: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username, other } = await params
  return {
    title: `${username} vs ${other} — TechPlay`,
    description: `Compare gaming profiles: ${username} vs ${other}`,
  }
}

export default async function ComparePage({ params }: Props) {
  const { username, other } = await params
  return <CompareClient username={username} other={other} />
}
