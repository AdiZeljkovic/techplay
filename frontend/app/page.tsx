import { Metadata } from "next";
import HomeGate from "./HomeGate";
import HomeClient from "./HomeClient";
import type { GemGame } from "@/components/home/HiddenGems";
import type { OnThisDayData } from "@/components/home/OnThisDay";
import type { DiscoverGame } from "@/components/home/DiscoverGames";
import { generatePageMetadata } from "@/lib/seo";
import { getServerApiUrl } from "@/lib/api";
import { Article } from "@/types";

// ISR: revalidate every 60 seconds, but can be triggered on-demand
export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  return generatePageMetadata('/');
}

export interface HomeData {
  hero: Article[];
  news: Article[];
  reviews: Article[];
  tech: Article[];
  latestGlobal: Article[];
  popularGlobal: Article[];
}

async function getHomeData(): Promise<HomeData> {
  const apiUrl = getServerApiUrl();

  try {
    const res = await fetch(`${apiUrl}/home`, {
      next: { revalidate: 60 },
      headers: { 'Accept': 'application/json' },
    });

    if (!res.ok) {
      return { hero: [], news: [], reviews: [], tech: [], latestGlobal: [], popularGlobal: [] };
    }

    const json = await res.json();
    const data = json.data || json;

    return {
      hero: data.hero ?? [],
      news: data.news ?? [],
      reviews: data.reviews ?? [],
      tech: data.tech ?? [],
      latestGlobal: data.latest_global ?? [],
      popularGlobal: data.popular_global ?? [],
    };
  } catch {
    return { hero: [], news: [], reviews: [], tech: [], latestGlobal: [], popularGlobal: [] };
  }
}

/**
 * The three lists the homepage used to fetch from the browser after hydration.
 *
 * Each is small (1-4 KB) and none of them changes more than once a day, so
 * waiting for JavaScript to download, parse, hydrate and then make a round trip
 * bought nothing — it only meant three sections that were missing from the HTML
 * and appeared late. Fetched here they ride along with the page's own ISR.
 *
 * Every one degrades to an empty list on failure, which the components render
 * as nothing rather than as a broken section.
 */
async function getJson<T>(path: string, fallback: T, revalidate = 3600): Promise<T> {
  try {
    const res = await fetch(`${getServerApiUrl()}${path}`, {
      next: { revalidate },
      headers: { Accept: 'application/json' },
    });

    if (!res.ok) return fallback;

    return (await res.json()) as T;
  } catch {
    return fallback;
  }
}

export default async function Home() {
  const [homeData, gems, onThisDay, trending] = await Promise.all([
    getHomeData(),
    getJson<{ results: GemGame[] }>('/games/hidden-gems', { results: [] }),
    getJson<OnThisDayData>('/games/on-this-day', { results: [] }),
    getJson<{ results: DiscoverGame[] }>(
      '/games?ordering=-rating&min_rating=8.5&page_size=10',
      { results: [] },
      1800,
    ),
  ]);

  // HomeClient is rendered here, on the server, and handed to HomeGate as a
  // prop. Rendering it inside HomeGate — a client component — would pull the
  // whole public homepage into the browser bundle instead.
  return (
    <HomeGate
      publicHome={
        <HomeClient
          initialData={homeData}
          gems={gems.results ?? []}
          onThisDay={onThisDay}
          discoverTrending={(trending.results ?? []).slice(0, 5)}
        />
      }
    />
  );
}
