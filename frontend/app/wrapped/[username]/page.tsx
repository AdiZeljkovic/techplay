import type { Metadata } from "next";
import { notFound } from "next/navigation";
import WrappedClient, { type WrappedPayload } from "./WrappedClient";
import { getApiUrl } from "@/lib/api";
import { fetchContent } from "@/lib/fetchContent";

interface Props {
    params: Promise<{ username: string }>;
    searchParams: Promise<{ year?: string }>;
}

async function fetchWrapped(username: string, year: number): Promise<WrappedPayload | null> {
    const json = await fetchContent<{ data?: WrappedPayload }>(
        `${getApiUrl()}/users/${username}/wrapped/${year}`,
        { next: { revalidate: 1800 } },
    );

    return json?.data ?? null;
}

/** The wrapper is made to be shared, so the year in the URL drives the meta. */
export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
    const { username } = await params;
    const sp = await searchParams;
    const year = sp.year ? parseInt(sp.year, 10) : new Date().getFullYear();
    const data = await fetchWrapped(username, year);

    if (!data) return { title: "Gaming Wrapper — TechPlay" };

    const stat = (key: string) => data.stats.find((s) => s.key === key)?.value ?? 0;

    return {
        title: `${data.display_name}'s ${year} Gaming Wrapper — TechPlay`,
        description: `${stat("games_completed")} games completed, ${stat("hours")}h played and ${stat("achievements")} achievements in ${year}. ${data.archetype.name}.`,
        openGraph: {
            title: `${data.display_name}'s ${year} in gaming`,
            description: data.archetype.blurb,
            images: [`/og/wrapped?username=${encodeURIComponent(username)}&year=${year}`],
        },
    };
}

export default async function WrappedPage({ params, searchParams }: Props) {
    const { username } = await params;
    const sp = await searchParams;
    const year = sp.year ? parseInt(sp.year, 10) : new Date().getFullYear();

    const data = await fetchWrapped(username, year);
    if (!data) notFound();

    return <WrappedClient data={data} username={username} />;
}
