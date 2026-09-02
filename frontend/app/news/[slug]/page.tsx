import { Article } from "@/types";
import { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import SectionHub from "@/components/editorial/SectionHub";
import ArticleDetailView from "@/components/news/ArticleDetailView";
import { NEWS_CATEGORIES } from "@/lib/categories";
import { getServerApiUrl, serverHeaders } from "@/lib/api";
import { fetchContent } from "@/lib/fetchContent";
import { ROBOTS_INDEX, ROBOTS_NOINDEX, generatePageMetadata } from "@/lib/seo";
import { articleDates } from "@/lib/articleDates";

// On-demand ISR - no automatic revalidation, only manual via /api/revalidate
// Backend triggers revalidation when content is updated
export const revalidate = false; // Disable automatic revalidation - only on-demand

/**
 * A category page is a real, indexed page, so its first screen is rendered on
 * the server rather than left to the client to fetch.
 */
async function getInitialCategoryData(categorySlug: string) {
    try {
        const params = new URLSearchParams({ page: '1', category: categorySlug });
        const res = await fetch(`${getServerApiUrl()}/news?${params.toString()}`, {
            next: { revalidate: 300, tags: ['news'] },
            headers: serverHeaders() });
        if (!res.ok) return null;
        return await res.json();
    } catch {
        return null;
    }
}

/**
 * The same slug, asked of the other sections.
 *
 * Only ever called when /news has already missed, so it costs nothing on the
 * path readers actually take. It exists because links to /news/{slug} were
 * being written by hand all over the site for articles that do not live there
 * — the author page did it for all 51 of one author's tech pieces, and the
 * share button on the article page did it for every tech article anyone
 * shared. Those links are already out in the world; one reached Discord as
 * "how am I supposed to read this if it throws an error?".
 *
 * Fixing the generators stops new ones. This is what rescues the ones already
 * sent, and hands Google a 301 where it was collecting a 404.
 */
async function elsewhere(slug: string): Promise<string | null> {
    // API segment → the path a reader sees. `tech` is the one that differs.
    const sections: Array<[string, string]> = [
        ["tech", "hardware"],
        ["reviews", "reviews"],
        ["guides", "guides"],
    ];

    for (const [api, web] of sections) {
        try {
            const json = await fetchContent<{ data?: Article } & Article>(
                `${getServerApiUrl()}/${api}/${slug}`,
                { cache: "force-cache", next: { tags: [api, `${api}-${slug}`] } },
            );
            if (json && (json.data ?? json)?.slug) return `/${web}/${slug}`;
        } catch {
            // A section that cannot answer must not turn a redirect into a 500.
        }
    }

    return null;
}

async function getArticle(slug: string): Promise<Article | null> {
    const json = await fetchContent<{ data?: Article } & Article>(`${getServerApiUrl()}/news/${slug}`, {
        cache: 'force-cache', // Cache until manually revalidated
        next: { tags: ['news', `news-${slug}`] } });

    // null means the API said this article is gone; anything else the API
    // could not answer has already thrown, so the reader is not told a live
    // article does not exist.
    return json ? (json.data ?? json) : null;
}

// ... imports

// Fix for Next.js 15: params is a Promise
type Props = {
    params: Promise<{ slug: string }>; // Updated type
    searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata(
    { params }: Props
): Promise<Metadata> {
    const { slug } = await params;

    // Check if category first
    const category = NEWS_CATEGORIES.find(c => c.slug === slug);
    if (category) {
        // The same call the page below makes, with the same options, so Next
        // serves it from the render's fetch cache rather than asking twice.
        const total = (await getInitialCategoryData(category.id))?.meta?.total;

        /*
         * The wording comes from `page_seo`, the same table every other page
         * on the site reads.
         *
         * There is a row for each of these categories and the copy in them is
         * written, not generated — /news/gaming holds "Gaming News 2026 |
         * Latest Game Releases & Announcements", /reviews/indie-gems holds
         * "Indie Game Reviews 2026 | Best Hidden Gems & Indie Hits". This
         * branch built its own title and description out of the slug instead
         * and never asked, so seventeen category pages introduced themselves
         * with a template while the real copy sat unread.
         *
         * The strings below stay as the fallback for a category with no row,
         * and generatePageMetadata carries the canonical, the og:image and the
         * admin's per-page no-index switch along with it.
         */
        const meta = await generatePageMetadata(`/news/${category.slug}`, {
            title: `${category.label} News - TechPlay`,
            description: `Latest news and updates from the ${category.label} world.`,
        });

        return {
            ...meta,
            /*
             * A category with nothing in it is an empty archive. Only a count
             * we actually read counts: a failed fetch leaves the page
             * indexable rather than quietly demoting a healthy category. This
             * sits after the spread so it can add a no-index, never remove the
             * one the admin switch may already have set.
             */
            ...(total === 0 ? { robots: ROBOTS_NOINDEX } : {}),
        };
    }

    const article = await getArticle(slug);
    // ... rest of metadata logic (using article)

    if (!article) {
        return {
            /*
             * A page that does not exist says so once.
             *
             * With no robots block here the root layout's index,follow was
             * inherited, and Next adds its own noindex when it renders
             * not-found — so the response carried two contradictory robots
             * tags. Google takes the stricter one, so the outcome was right by
             * accident; the contradiction was the tell that nothing was
             * deciding.
             */
            title: 'Article Not Found',
            robots: ROBOTS_NOINDEX,
        };
    }

    /*
     * Two audiences, two lengths — and for months they shared one string.
     *
     * `meta_title` is cut to sixty characters, which is roughly what Google
     * shows. That cut then went into og:title as well, so a share on Discord
     * or Facebook posted a sentence that stopped mid-thought: "DLSS 5
     * Announced: NVIDIA promises cinematic visuals in the". 117 of 629
     * published articles carry a meta_title that is a truncation of their own
     * headline, and every one of them shared that way.
     *
     * Nothing about a share card wants sixty characters. Facebook shows about
     * 88, X about 70, Discord up to 256 — so the social pair takes the real
     * headline and the real standfirst, and the search pair keeps the short
     * form the editor wrote for it.
     */
    const title = article.meta_title || article.title;
    const description = article.meta_description || article.excerpt || "Read more on TechPlay.";

    const socialTitle = article.title || title;
    const socialDescription = article.excerpt || article.meta_description || "Read more on TechPlay.";

    // Robust Image URL generation
    let imageUrl = article.featured_image_url;
    if (imageUrl) {
        // Fix localhost/127.0.0.1 in URLs (common dev/prod mismatch)
        if (imageUrl.includes('localhost') || imageUrl.includes('127.0.0.1')) {
            try {
                const urlObj = new URL(imageUrl);
                imageUrl = `${process.env.NEXT_PUBLIC_STORAGE_URL}${urlObj.pathname}`;
            } catch (e) {
                // If invalid URL, fall back to simple replacement
                imageUrl = imageUrl.replace(/http:\/\/localhost:\d+/, process.env.NEXT_PUBLIC_STORAGE_URL || '');
            }
        }
        // Handle relative paths
        else if (!imageUrl.startsWith('http')) {
            const storageUrl = process.env.NEXT_PUBLIC_STORAGE_URL?.replace(/\/$/, '') || '';
            const path = imageUrl.replace(/^\//, '');
            imageUrl = `${storageUrl}/${path}`;
        }
    }

    /*
     * The alt text the newsroom already writes — 628 of 629 published articles
     * have one — and which never reached a share card, because the images
     * array carried a bare URL.
     *
     * Width and height belong here too and are not available yet: the upload
     * pipeline measures the image but stores nothing, so there are no columns
     * to read. That needs a migration and a backfill, and is tracked as its
     * own backend task rather than guessed at here.
     */
    const images = imageUrl
        ? [{
            url: imageUrl,
            alt: article.featured_image_alt || article.title,
            /*
             * Facebook and X draw the card from these without fetching the
             * file. Null until the image has been measured, and an og:image
             * with no size is exactly what the site sent before — so an
             * unmeasured cover loses nothing.
             */
            ...(article.featured_image_width && article.featured_image_height
                ? { width: article.featured_image_width, height: article.featured_image_height }
                : {}),
        }]
        : [];

    return {
        title: title,
        description: description,
        openGraph: {
            title: socialTitle,
            description: socialDescription,
            url: article.canonical_url || `${process.env.NEXT_PUBLIC_APP_URL}/news/${slug}`,
            siteName: 'TechPlay',
            type: 'article',
            publishedTime: article.published_at || article.created_at,
            modifiedTime: article.updated_at,
            authors: [article.author?.display_name || article.author?.username || 'TechPlay'],
            images: images,
            locale: 'en_US' },
        twitter: {
            card: 'summary_large_image',
            title: socialTitle,
            description: socialDescription,
            images: images },
        alternates: {
            canonical: article.canonical_url || `${process.env.NEXT_PUBLIC_APP_URL}/news/${slug}` },
        keywords: Array.isArray(article.tags) && article.tags.length > 0
            ? article.tags.join(', ')
            : (article.focus_keyword || undefined),
        robots: article.is_noindex ? ROBOTS_NOINDEX : ROBOTS_INDEX
    };
}


// ... imports

// ... types

export default async function NewsSlugPage({ params }: Props) {
    const { slug } = await params;

    // Check if slug matches a category
    const category = NEWS_CATEGORIES.find(c => c.slug === slug);

    if (category) {
        // `id` is the slug the database and the API use; `slug` is the segment
        // in the URL. The hub filters on the former.
        const initialData = await getInitialCategoryData(category.id);
        return <SectionHub section="news" category={category.id} categoryName={category.label} initialData={initialData} />;
    }

    const article = await getArticle(slug);

    if (!article) {
        const home = await elsewhere(slug);
        if (home) permanentRedirect(home);
        notFound();
    }

    // Optimization: Comments are now included in the article payload (Eager Loaded)
    // No second request needed.
    // If article.comments is undefined (old api), fallback to empty array.
    // We assume the backend change is deployed.
    const comments = article.comments || [];

    const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://techplay.gg';
    const articleUrl = article.canonical_url || `${siteUrl}/news/${article.slug}`;
    const featuredImage = article.featured_image_url?.startsWith('http')
        ? article.featured_image_url
        : `${process.env.NEXT_PUBLIC_STORAGE_URL}/${article.featured_image_url}`;

    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "NewsArticle",
        "mainEntityOfPage": {
            "@type": "WebPage",
            "@id": articleUrl },
        "headline": article.meta_title || article.title,
        "description": article.meta_description || article.excerpt || "",
        "image": featuredImage ? [featuredImage] : [],
        // Never a modification that precedes publication: a draft written
        // and published later leaves updated_at behind published_at, and an
        // article claiming to have been edited before it existed is not a
        // timestamp a freshness surface can trust. See lib/articleDates.
        "datePublished": articleDates(article).published,
        "dateModified": articleDates(article).modified,
        "author": [{
            "@type": "Person",
            "name": article.author?.display_name || article.author?.username || "TechPlay Editor",
            "url": `${siteUrl}/author/${article.author?.author_slug || article.author?.username}` }],
        "publisher": {
            "@type": "Organization",
            "name": "TechPlay",
            "logo": {
                "@type": "ImageObject",
                "url": `${siteUrl}/logo.png` } },
        "url": articleUrl,
        "speakable": {
            "@type": "SpeakableSpecification",
            "cssSelector": ["h1", ".article-excerpt"] } };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <ArticleDetailView article={article} initialComments={comments} />
        </>
    );
}
