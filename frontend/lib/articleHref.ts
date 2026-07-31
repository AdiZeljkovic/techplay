import { Article } from "@/types";

/**
 * Route for an article by its category type.
 * `tech` articles live under /hardware — every other type maps 1:1.
 */
export function articleHref(article: Pick<Article, "slug" | "category">): string {
    if (!article.slug) return "#";
    const type = article.category?.type ?? "news";
    const segment = type === "tech" ? "hardware" : type;
    return `/${segment}/${article.slug}`;
}
