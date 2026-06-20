import { Metadata } from 'next'
import ClansClient from './ClansClient'

export const metadata: Metadata = {
  title: 'Clans — TechPlay',
  description: 'Find and join gaming clans on TechPlay.',
}

export default function ClansPage() {
  return <ClansClient />
}
