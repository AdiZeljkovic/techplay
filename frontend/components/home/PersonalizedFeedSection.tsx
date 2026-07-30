"use client";

import useSWR from "swr";
import Link from "next/link";
import Image from "next/image";
import { Sparkles } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getApiUrl } from "@/lib/api";
import { Article } from "@/types";

const fetcher = (url: string, token: string) =>
  fetch(url, { headers: { Authorization: `Bearer ${token}` } })
    .then((r) => (r.ok ? r.json() : null))
    .then((j) => j?.data as Article[] | null);

/** Maps a category type to its route segment — `tech` articles live under /hardware. */
function articleHref(article: Article): string {
  if (!article.slug) return "#";
  const type = article.category?.type ?? "news";
  const segment = type === "tech" ? "hardware" : type;
  return `/${segment}/${article.slug}`;
}

export function ArticleCard({ article }: { article: Article }) {
  const href = articleHref(article);

  return (
    <Link
      href={href}
      className="group flex gap-4 items-start hover:bg-white/[0.03] p-2 -mx-2 rounded-xl transition-colors"
    >
      <div className="relative w-24 h-16 rounded-lg overflow-hidden shrink-0 bg-white/5">
        {article.featured_image_url && (
          <Image
            src={article.featured_image_url}
            alt={article.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        )}
      </div>
      <div className="flex-1 min-w-0">
        {article.category?.name && (
          <p className="text-[10px] font-bold uppercase tracking-wider text-tp-accent mb-1">
            {article.category.name}
          </p>
        )}
        <p className="text-sm font-bold text-white leading-snug line-clamp-2 group-hover:text-tp-accent transition-colors">
          {article.title}
        </p>
      </div>
    </Link>
  );
}

export default function PersonalizedFeedSection() {
  const { user, token } = useAuth();

  const { data: articles } = useSWR(
    user && token ? [`${getApiUrl()}/feed/personalized`, token] : null,
    ([url, tok]) => fetcher(url, tok),
    { dedupingInterval: 300_000, revalidateOnFocus: false }
  );

  if (!user || !articles?.length) return null;

  return (
    <div className="max-w-[1320px] mx-auto px-4 xl:px-0 w-full mb-20">
      <div className="border-t border-zinc-200 dark:border-white/5 pt-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-tp-accent/10 border border-tp-accent/20 text-tp-accent text-[11px] font-black tracking-widest uppercase">
            <Sparkles className="w-3 h-3" />
            For You
          </div>
          <p className="text-xs text-zinc-500">
            Based on your library
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
