import { notFound } from "next/navigation";
import { Metadata } from "next";
import { getServerApiUrl } from "@/lib/api";
import AuthorHeader from "@/components/author/AuthorHeader";
import AuthorArticleGrid from "@/components/author/AuthorArticleGrid";
import type { AuthorPageData } from "@/types";

export const revalidate = 3600;

type Props = {
    params: Promise<{ slug: string }>;
};

async function getAuthorData(slug: string): Promise<AuthorPageData | null> {
    try {
        const res = await fetch(`${getServerApiUrl()}/authors/${slug}`, {
            next: { revalidate: 3600, tags: [`author-${slug}`] },
            headers: { Accept: "application/json" },
        });
        if (!res.ok) return null;
        return res.json();
    } catch {
        return null;
    }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const data = await getAuthorData(slug);

    if (!data) {
        return { title: "Author Not Found - TechPlay" };
    }

    const { author } = data;
    const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://techplay.gg";
    const authorUrl = `${siteUrl}/author/${slug}`;

    const description = author.bio
        ? `${author.bio.slice(0, 155)}...`
        : `Read all articles by ${author.display_name}, ${author.role} at TechPlay.`;

    return {
        title: `Articles by ${author.display_name} - TechPlay`,
        description,
        openGraph: {
            title: `Articles by ${author.display_name} - TechPlay`,
            description,
            url: authorUrl,
            siteName: "TechPlay",
            type: "profile",
            images: author.avatar_url
                ? [{ url: author.avatar_url, width: 400, height: 400, alt: author.display_name }]
                : [],
        },
        twitter: {
            card: "summary",
            title: `Articles by ${author.display_name} - TechPlay`,
            description,
            images: author.avatar_url ? [author.avatar_url] : [],
        },
        alternates: {
            canonical: authorUrl,
        },
        robots: { index: true, follow: true },
    };
}

export default async function AuthorPage({ params }: Props) {
    const { slug } = await params;
    const data = await getAuthorData(slug);

    if (!data) notFound();

    const { author, stats } = data;
    const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://techplay.gg";

    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "Person",
        "@id": `${siteUrl}/author/${author.author_slug}`,
        "name": author.display_name,
        "url": `${siteUrl}/author/${author.author_slug}`,
        "image": author.avatar_url || undefined,
        "description": author.bio || undefined,
        "jobTitle": author.role,
        "worksFor": {
            "@type": "Organization",
            "name": "TechPlay",
            "url": siteUrl,
        },
        "sameAs": [`${siteUrl}/profile/${author.username}`],
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <div className="min-h-screen bg-[#05070A]">
                <AuthorHeader author={author} stats={stats} />
                <AuthorArticleGrid slug={slug} stats={stats} />
            </div>
        </>
    );
}
