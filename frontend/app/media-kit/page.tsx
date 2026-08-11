import MediaKitClient from "./MediaKitClient";
import { Metadata } from "next";
import { getServerApiUrl } from "@/lib/api";
import type { MediaKitData } from "@/hooks/useMediaKit";

export const revalidate = 3600; // ISR: 1 hour

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://techplay.gg';

export async function generateMetadata(): Promise<Metadata> {
    const title = "Advertise on TechPlay | Gaming & Tech Media Kit 2026";
    const description = "Reach 20K+ engaged gamers and tech enthusiasts. Competitive CPM rates from $1.00, 62% desktop traffic, 12.4% monthly growth. Global gaming tech portal with verified audience and real-time analytics.";
    const keywords = [
        "gaming advertising",
        "tech advertising",
        "gaming media kit",
        "esports advertising",
        "tech media buying",
        "gaming audience",
        "tech enthusiasts",
        "gaming marketing",
        "display advertising",
        "gaming CPM",
        "tech portal advertising",
        "gaming content marketing",
        "sponsored content gaming",
        "gaming tech reviews",
        "pc gaming advertising"
    ];

    return {
        title,
        description,
        keywords: keywords.join(", "),
        authors: [{ name: "TechPlay" }],
        creator: "TechPlay",
        publisher: "TechPlay",
        metadataBase: new URL(APP_URL),
        alternates: {
            canonical: `${APP_URL}/media-kit`,
        },
        openGraph: {
            type: 'website',
            url: `${APP_URL}/media-kit`,
            title,
            description,
            siteName: 'TechPlay',
            locale: 'en_US',
            images: [
                {
                    url: `${APP_URL}/og-media-kit.jpg`,
                    width: 1200,
                    height: 630,
                    alt: 'TechPlay Media Kit - Gaming & Tech Advertising Opportunities',
                }
            ],
        },
        twitter: {
            card: 'summary_large_image',
            site: '@TechPlayMedia',
            creator: '@TechPlayMedia',
            title,
            description,
            images: [`${APP_URL}/og-media-kit.jpg`],
        },
        robots: {
            index: true,
            follow: true,
            googleBot: {
                index: true,
                follow: true,
                'max-video-preview': -1,
                'max-image-preview': 'large',
                'max-snippet': -1,
            },
        },
        other: {
            'fb:app_id': '1234567890', // Replace with actual Facebook App ID if available
        },
    };
}

// JSON-LD Structured Data for SEO
const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
        {
            "@type": "Organization",
            "@id": `${APP_URL}/#organization`,
            "name": "TechPlay",
            "url": APP_URL,
            "logo": {
                "@type": "ImageObject",
                "url": `${APP_URL}/logo.png`,
                "width": 512,
                "height": 512
            },
            "sameAs": [
                "https://www.facebook.com/techplaymedia",
                "https://www.instagram.com/techplaymedia",
                "https://www.youtube.com/@TechPlayMedia",
                "https://www.tiktok.com/@techplaymedia"
            ],
            "contactPoint": {
                "@type": "ContactPoint",
                "contactType": "Advertising Inquiries",
                "email": "marketing@techplay.gg",
                "availableLanguage": ["en"]
            }
        },
        {
            "@type": "WebSite",
            "@id": `${APP_URL}/#website`,
            "url": APP_URL,
            "name": "TechPlay",
            "publisher": {
                "@id": `${APP_URL}/#organization`
            },
            "inLanguage": "en-US"
        },
        {
            "@type": "WebPage",
            "@id": `${APP_URL}/media-kit/#webpage`,
            "url": `${APP_URL}/media-kit`,
            "name": "Advertise on TechPlay | Gaming & Tech Media Kit 2026",
            "description": "Reach 20K+ engaged gamers and tech enthusiasts. Competitive CPM rates from $1.00, 62% desktop traffic, 12.4% monthly growth.",
            "isPartOf": {
                "@id": `${APP_URL}/#website`
            },
            "about": {
                "@id": `${APP_URL}/#organization`
            },
            "inLanguage": "en-US"
        },
        {
            "@type": "Service",
            "name": "Gaming & Tech Advertising Solutions",
            "provider": {
                "@id": `${APP_URL}/#organization`
            },
            "description": "Professional advertising services for gaming and tech brands targeting engaged audiences",
            "serviceType": "Digital Advertising",
            "areaServed": "Worldwide",
            "audience": {
                "@type": "Audience",
                "audienceType": "Gamers and Tech Enthusiasts",
                "geographicArea": {
                    "@type": "Place",
                    "name": "Global"
                }
            },
            "offers": [
                {
                    "@type": "Offer",
                    "name": "Display Advertising (CPM)",
                    "price": "1.00",
                    "priceCurrency": "USD",
                    "priceSpecification": {
                        "@type": "UnitPriceSpecification",
                        "price": "1.00",
                        "priceCurrency": "USD",
                        "unitText": "per 1000 impressions"
                    }
                },
                {
                    "@type": "Offer",
                    "name": "Article Sponsorship",
                    "price": "150",
                    "priceCurrency": "USD"
                }
            ]
        },
        {
            "@type": "BreadcrumbList",
            "itemListElement": [
                {
                    "@type": "ListItem",
                    "position": 1,
                    "name": "Home",
                    "item": APP_URL
                },
                {
                    "@type": "ListItem",
                    "position": 2,
                    "name": "Media Kit",
                    "item": `${APP_URL}/media-kit`
                }
            ]
        }
    ]
};

/**
 * The media kit's own figures, fetched on the server.
 *
 * They used to arrive through SWR after hydration, so the page a media buyer
 * opens showed eight pulsing grey blocks first and the numbers second — and a
 * crawler reading it for the advertising keywords in the metadata above found
 * a skeleton. It rides the route's ISR now.
 */
async function getMediaKit(): Promise<MediaKitData> {
    const empty = {} as MediaKitData;

    try {
        const res = await fetch(`${getServerApiUrl()}/media-kit`, {
            next: { revalidate: 3600 },
            headers: { Accept: 'application/json' },
        });

        if (!res.ok) return empty;

        return (await res.json()) as MediaKitData;
    } catch {
        return empty;
    }
}

export default async function MediaKitPage() {
    const data = await getMediaKit();

    return (
        <>
            {/* JSON-LD Structured Data */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
            />
            <MediaKitClient data={data} />
        </>
    );
}
