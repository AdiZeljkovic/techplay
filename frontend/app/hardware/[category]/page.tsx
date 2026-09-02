import SectionHub from "@/components/editorial/SectionHub";
import ArticleDetailView from "@/components/news/ArticleDetailView";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { HARDWARE_CATEGORIES } from "@/lib/categories";
import { getServerApiUrl, serverHeaders } from "@/lib/api";
import { fetchContent } from "@/lib/fetchContent";
import type { Article } from "@/types";
import { ROBOTS_INDEX, ROBOTS_NOINDEX, generatePageMetadata } from "@/lib/seo";
import { articleDates } from "@/lib/articleDates";

// ISR: revalidate every 10 minutes
export const revalidate = 600;

type Props = {
    params: Promise<{ category: string }>;
};

async function getInitialCategoryData(categoryId: string) {
    try {
        const params = new URLSearchParams({ page: '1', category: categoryId });
        const res = await fetch(`${getServerApiUrl()}/tech?${params.toString()}`, {
            next: { revalidate: 600 },
            headers: serverHeaders(),
        });
        if (!res.ok) return null;
        return await res.json();
    } catch {
        return null;
    }
}

async function getArticle(slug: string) {
    const json = await fetchContent<{ data?: Article } & Article>(
        `${getServerApiUrl()}/tech/${slug}`,
        { next: { revalidate: 600, tags: ['tech', `tech-${slug}`] } },
    );

    return json ? (json.data ?? json) : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { category: slug } = await params;
    const categoryDef = HARDWARE_CATEGORIES.find(c => c.slug === slug);
    if (categoryDef) {
        const title = `${categoryDef.label} - Hardware Lab`;
        // Same call the page makes; deduped by Next within the render.
        const total = (await getInitialCategoryData(categoryDef.id))?.meta?.total;

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
        const meta = await generatePageMetadata(`/hardware/${categoryDef.slug}`, {
            title,
            description: `Hardware ${categoryDef.label.toLowerCase()} from the TechPlay lab, with measured numbers.`,
        });

        return {
            ...meta,
            /*
             * An archive with nothing in it stays out of the index. Only a
             * count we actually read demotes the page — a failed fetch leaves
             * it indexable.
             *
             * A `seo_noindex_categories` setting used to be read here too, and
             * it was the only reader: one boolean that would have hidden every
             * hardware category at once, off in the database, with no field in
             * the admin to turn it on. page_seo.is_noindex does the same job
             * one page at a time, is on the category's own SEO tab, and now
             * reaches all four sections rather than this one. Removed with the
             * settings fetch it existed for — a request per render for a value
             * nothing could set.
             */
            ...(total === 0 ? { robots: ROBOTS_NOINDEX } : {}),
        };
    }

    // It's an article slug — fetch article for metadata
    const article = await getArticle(slug);
    if (!article) {
        /*
         * A missing piece answered with the section's own title and
         * description, which reads as a real page rather than a dead end — and
         * with no robots block it inherited the root's index,follow alongside
         * Next's own noindex. See the news route.
         */
        return { title: "Not found — Hardware Lab", robots: ROBOTS_NOINDEX };
    }

    const title = article.meta_title || article.title;
    const description = article.meta_description || article.excerpt || "Read more on TechPlay.";
    // Share cards take the real headline and standfirst; the search pair keeps
    // the short form. See the news route.
    const socialTitle = article.title || title;
    const socialDescription = article.excerpt || article.meta_description || "Read more on TechPlay.";

    let imageUrl = article.featured_image_url;
    if (imageUrl && !imageUrl.startsWith('http')) {
        const storageUrl = process.env.NEXT_PUBLIC_STORAGE_URL?.replace(/\/$/, '') || '';
        const path = imageUrl.replace(/^\//, '');
        imageUrl = `${storageUrl}/${path}`;
    }
    // Alt text the newsroom already writes, which never reached a share card.
    // Width and height need a migration — tracked separately.
    const images = imageUrl
        ? [{
            url: imageUrl,
            alt: article.featured_image_alt || article.title,
            // Declared so the card renders on the first share; see the news route.
            ...(article.featured_image_width && article.featured_image_height
                ? { width: article.featured_image_width, height: article.featured_image_height }
                : {}),
        }]
        : [];

    return {
        title,
        description,
        openGraph: {
            title: socialTitle,
            description: socialDescription,
            url: `${process.env.NEXT_PUBLIC_APP_URL}/hardware/${slug}`,
            siteName: 'TechPlay',
            type: 'article',
            publishedTime: article.published_at || article.created_at,
            modifiedTime: article.updated_at,
            authors: [article.author?.display_name || article.author?.username || 'TechPlay'],
            images: images,
            locale: 'en_US',
        },
        twitter: {
            card: 'summary_large_image',
            title: socialTitle,
            description: socialDescription,
            images: images,
        },
        // Same toggle as News and Reviews honour; this page did not.
        robots: article.is_noindex ? ROBOTS_NOINDEX : ROBOTS_INDEX,
        alternates: {
            canonical: article.canonical_url || `${process.env.NEXT_PUBLIC_APP_URL}/hardware/${slug}`,
        },
    };
}

export default async function HardwareSlugPage({ params }: Props) {
    const { category: slug } = await params;

    // Check if it's a known category
    const categoryDef = HARDWARE_CATEGORIES.find(c => c.slug === slug);

    if (categoryDef) {
        const initialData = await getInitialCategoryData(categoryDef.id);
        return <SectionHub section="tech" category={categoryDef.id} categoryName={categoryDef.label} initialData={initialData} />;
    }

    // It's an article slug — fetch server-side
    const article = await getArticle(slug);
    if (!article) {
        notFound();
    }

    const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://techplay.gg';
    const articleUrl = `${siteUrl}/hardware/${slug}`;

    let featuredImage = article.featured_image_url;
    if (featuredImage && !featuredImage.startsWith('http')) {
        const storageUrl = process.env.NEXT_PUBLIC_STORAGE_URL?.replace(/\/$/, '') || '';
        featuredImage = `${storageUrl}/${featuredImage.replace(/^\//, '')}`;
    }

    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "NewsArticle",
        "mainEntityOfPage": { "@type": "WebPage", "@id": articleUrl },
        "headline": article.meta_title || article.title,
        "description": article.meta_description || article.excerpt || "",
        "image": featuredImage ? [featuredImage] : [],
        // Never a modification that precedes publication: a draft written
        // and published later leaves updated_at behind published_at, and an
        // article claiming to have been edited before it existed is not a
        // timestamp a freshness surface can trust. See lib/articleDates.
        "datePublished": articleDates(article).published,
        "dateModified": articleDates(article).modified,
        "author": article.author ? [{
            "@type": "Person",
            "name": article.author.display_name || article.author.username || "TechPlay",
            "url": `${siteUrl}/author/${article.author.username}`,
        }] : [{ "@type": "Organization", "name": "TechPlay", "url": siteUrl }],
        "publisher": {
            "@type": "Organization",
            "name": "TechPlay",
            "logo": { "@type": "ImageObject", "url": `${siteUrl}/logo.png` },
        },
        "url": articleUrl,
        "speakable": { "@type": "SpeakableSpecification", "cssSelector": ["h1", ".article-excerpt"] },
    };

    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
            <ArticleDetailView article={article} initialComments={article.comments || []} />
        </>
    );
}
