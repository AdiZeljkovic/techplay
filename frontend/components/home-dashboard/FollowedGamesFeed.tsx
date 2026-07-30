"use client";

import useSWR from "swr";
import { Newspaper } from "lucide-react";
import axios from "@/lib/axios";
import SectionCard from "@/components/profile/dashboard/SectionCard";
import { ArticleCard } from "@/components/home/PersonalizedFeedSection";
import { Article } from "@/types";

const fetcher = (url: string) => axios.get(url).then((r) => r.data?.data as Article[]);

/**
 * Articles scored against the user's library/wishlist (GET /feed/personalized).
 */
export default function FollowedGamesFeed() {
    const { data: articles } = useSWR("/feed/personalized", fetcher, {
        dedupingInterval: 300_000,
        revalidateOnFocus: false,
    });

    if (!articles?.length) return null;

    return (
        <SectionCard
            title="From Games You Follow"
            icon={<Newspaper className="w-3.5 h-3.5 text-[var(--accent)]" />}
            action={{ label: "All news", href: "/news" }}
            bodyClassName="grid grid-cols-1 sm:grid-cols-2 gap-2"
        >
            {articles.slice(0, 6).map((article) => (
                <ArticleCard key={article.id} article={article} />
            ))}
        </SectionCard>
    );
}
