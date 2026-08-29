import { Metadata } from "next";
import HomeClient from "./HomeClient";
import { generatePageMetadata } from "@/lib/seo";
import { getServerApiUrl, serverHeaders } from "@/lib/api";
import { Article } from "@/types";

// ISR: revalidate every 60 seconds, but can be triggered on-demand
export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  return generatePageMetadata('/');
}

export interface HomeData {
  /**
   * How many games are actually in the catalogue.
   *
   * The hero used to state "200K+" as a hard-coded string. The catalogue has
   * been cleaned twice since — adult titles and clutter removed — and the real
   * figure is now around 141,000, so the headline claim on the busiest page of
   * the site was simply wrong. Read from the API it cannot go stale again, and
   * a precise number is worth more than a rounded-up one on a site whose whole
   * argument is that its figures can be checked.
   */
  gameCount: number | null;
  hero: Article[];
  news: Article[];
  reviews: Article[];
  tech: Article[];
  latestGlobal: Article[];
  popularGlobal: Article[];
}

/**
 * The homepage, or nothing at all — never an empty one.
 *
 * A failed fetch used to return empty arrays, and ISR published that: for at
 * least the next sixty seconds every reader got a homepage with no hero, no
 * news and no reviews, and `HomeClient` renders what it is handed with no
 * client-side refetch, so nothing recovered it. Nothing had errored, either —
 * an empty page and a quiet day look identical.
 *
 * Throwing is the better failure. During a background regeneration Next keeps
 * serving the last good copy and tries again on the next pass, so a backend
 * blip becomes a slightly stale homepage rather than a blank one. On a cold
 * cache it reaches the error boundary, which says something is wrong — which is
 * true, and is the trade `lib/fetchContent.ts` already makes everywhere else.
 */
async function getHomeData(): Promise<HomeData> {
  const apiUrl = getServerApiUrl();

  const res = await fetch(`${apiUrl}/home`, {
    next: { revalidate: 60 },
    headers: serverHeaders(),
  });

  if (!res.ok) {
    throw new Error(`Homepage payload unavailable (HTTP ${res.status})`);
  }

  const json = await res.json();
  const data = json.data || json;

  return {
    gameCount: await getGameCount(),
    hero: data.hero ?? [],
    news: data.news ?? [],
    reviews: data.reviews ?? [],
    tech: data.tech ?? [],
    latestGlobal: data.latest_global ?? [],
    popularGlobal: data.popular_global ?? [],
  };
}

/**
 * The catalogue size, or nothing.
 *
 * Null rather than a fallback number: a stale constant is what this replaces,
 * and the hero simply omits the figure when it cannot be confirmed. Saying
 * nothing is always defensible; saying the wrong number is not.
 */
async function getGameCount(): Promise<number | null> {
  try {
    const res = await fetch(`${getServerApiUrl()}/games/hub`, {
      next: { revalidate: 3600 },
      headers: serverHeaders(),
    });

    if (!res.ok) return null;

    const json = await res.json();

    return json?.data?.stats?.games ?? null;
  } catch {
    return null;
  }
}

export default async function Home() {
  const homeData = await getHomeData();

  return <HomeClient initialData={homeData} />;
}
