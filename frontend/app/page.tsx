import { Metadata } from "next";
import HomeClient from "./HomeClient";
import { generatePageMetadata } from "@/lib/seo";
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
}

async function getHomeData(): Promise<HomeData> {
  let apiUrl = process.env.NEXT_PUBLIC_API_URL;

  if (apiUrl && apiUrl.includes('localhost')) {
    apiUrl = apiUrl.replace('localhost', '127.0.0.1');
  }

  try {
    const res = await fetch(`${apiUrl}/home`, {
      next: { revalidate: 60 },
      headers: { 'Accept': 'application/json' },
    });

    if (!res.ok) {
      return { hero: [], news: [], reviews: [], tech: [] };
    }

    const json = await res.json();
    const data = json.data || json;

    return {
      hero: data.hero ?? [],
      news: data.news ?? [],
      reviews: data.reviews ?? [],
      tech: data.tech ?? [],
    };
  } catch {
    return { hero: [], news: [], reviews: [], tech: [] };
  }
}

export default async function Home() {
  const homeData = await getHomeData();

  return <HomeClient initialData={homeData} />;
}
