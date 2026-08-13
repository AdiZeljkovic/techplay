import { Metadata } from "next";
import HomeClient from "./HomeClient";
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

export default async function Home() {
  const homeData = await getHomeData();

  return <HomeClient initialData={homeData} />;
}
