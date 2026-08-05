"use client";

import useSWR from "swr";
import Link from "next/link";
import Image from "next/image";
import { Sparkles } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getApiUrl } from "@/lib/api";
import type { FeedItem, PersonalFeed } from "@/types/feed";

const fetcher = (url: string, token: string) =>
  fetch(url, { headers: { Authorization: `Bearer ${token}` } })
    .then((r) => (r.ok ? r.json() : null))
    .then((j) => (j?.data ?? null) as PersonalFeed | null);

export function ArticleCard({ article }: { article: FeedItem }) {
  return (
    <Link
      href={article.url}
      className="group flex gap-4 items-start hover:bg-[var(--fill-1)] p-2 -mx-2 rounded-xl transition-colors"
    >
      <div className="relative w-24 h-16 rounded-lg overflow-hidden shrink-0 bg-[var(--fill-1)]">
        {article.featured_image_url && (
          <Image
            src={article.featured_image_url}
            alt={article.title}
            fill
            sizes="96px"
            className="object-cover group-hover:scale-[1.04] transition-transform duration-700 ease-[var(--ease-hud)]"
          />
        )}
      </div>
      <div className="flex-1 min-w-0">
        {article.category?.name && (
          <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--accent)] mb-1">
            {article.category.name}
          </p>
        )}
        <p className="font-display text-[13px] font-bold text-[var(--ink-hi)] leading-snug line-clamp-2 group-hover:text-[var(--accent)] transition-colors">
          {article.title}
        </p>
      </div>
    </Link>
  );
}

export default function PersonalizedFeedSection() {
  const { user, token } = useAuth();

  const { data: feed } = useSWR(
    user && token ? [`${getApiUrl()}/feed/personalized?limit=6`, token] : null,
    ([url, tok]) => fetcher(url, tok),
    { dedupingInterval: 300_000, revalidateOnFocus: false }
  );

  const articles = feed?.items ?? [];

  // When the feed had nothing to go on it hands back the newest, labelled as
  // such. A "For You" block on the homepage showing exactly what the strip
  // above it shows would be a claim we cannot support, so it stays hidden
  // until there is something real behind it.
  if (!user || !feed?.personalised || articles.length === 0) return null;

  return (
    <div className="container-page w-full mb-20">
      <div className="border-t border-zinc-200 dark:border-white/5 pt-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--accent-soft)] border border-[color-mix(in_srgb,var(--accent)_20%,transparent)] text-[var(--accent)] text-[11px] font-black tracking-widest uppercase">
            <Sparkles className="w-3 h-3" />
            For You
          </div>
          <p className="text-xs text-zinc-500">
            {feed.interests.length > 0
              ? `Around ${feed.interests.slice(0, 2).join(" and ")}`
              : "Based on what you read"}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {articles.slice(0, 6).map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      </div>
    </div>
  );
}
