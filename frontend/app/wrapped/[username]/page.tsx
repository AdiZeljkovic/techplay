import type { Metadata } from "next";
import { notFound } from "next/navigation";
import WrappedClient from "./WrappedClient";
import { getApiUrl } from "@/lib/api";

interface Props {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ year?: string }>;
}

async function fetchWrapped(username: string, year: number) {
  try {
    const res = await fetch(`${getApiUrl()}/users/${username}/wrapped/${year}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const year = new Date().getFullYear();
  const data = await fetchWrapped(username, year);
  if (!data) return { title: "Gaming Wrapped" };

  return {
    title: `${data.display_name}'s ${year} Gaming Wrapped — TechPlay`,
    description: `${data.games_completed} games completed, ${data.total_hours}h played, ${data.achievements} achievements in ${year}.`,
    openGraph: {
      images: [`/og/wrapped?username=${username}&year=${year}`],
    },
  };
}

export default async function WrappedPage({ params, searchParams }: Props) {
  const { username } = await params;
  const sp = await searchParams;
  const year = sp.year ? parseInt(sp.year) : new Date().getFullYear();

  const data = await fetchWrapped(username, year);
  if (!data) notFound();

  return <WrappedClient data={data} year={year} />;
}
