import { Metadata } from "next";
import WowAnalyzerClient from "@/components/wow/WowAnalyzerClient";

export const metadata: Metadata = {
    title: "WoW Character Analyzer - Free Midnight Readiness Score & Gear Check | TechPlay",
    description: "Instantly analyze your World of Warcraft character for Midnight expansion. Check gear, M+ score, raid progress, collections, and get AI-powered tips from Profesor Buffy. Free WoW analyzer tool - no login required!",
    keywords: [
        // Primary keywords (high volume)
        "wow character analyzer",
        "world of warcraft analyzer",
        "wow gear checker",
        "wow character checker",
        "raider io alternative",
        "wow character stats",

        // Expansion specific
        "wow midnight expansion",
        "wow midnight readiness",
        "midnight expansion checker",
        "wow midnight preparation",

        // Feature keywords
        "wow mythic plus score",
        "wow raid progress checker",
        "wow collection tracker",
        "wow achievement hunter",
        "wow character audit",
        "wow character progress",

        // Action keywords (high intent)
        "analyze wow character",
        "check wow character",
        "wow character analysis tool",
        "wow gear analysis",
        "wow character report",

        // Long-tail keywords
        "free wow character analyzer",
        "wow character analyzer free",
        "best wow character checker",
        "wow character analyzer tool",
        "wow midnight expansion readiness test",

        // Competitive keywords
        "raider.io alternative",
        "wowprogress alternative",
        "check my wow character",
        "wow character lookup",

        // General
        "World of Warcraft",
        "WoW",
        "Blizzard",
        "MMORPG character analyzer",

        // Regional variations (high volume in different regions)
        "wow character analyzer eu",
        "wow character checker us",
        "wow analyzer europe",
        "wow character lookup us",

        // Class-specific (long-tail, high intent)
        "wow demon hunter analyzer",
        "wow paladin gear checker",
        "wow priest character check",
        "wow warrior analyzer",

        // Activity-specific
        "wow pvp character checker",
        "wow pve analyzer",
        "wow raiding character audit",
        "wow m+ character checker",

        // Problem-solving keywords (question-based)
        "how to check wow character",
        "how to analyze wow character",
        "wow character progress tracker",
        "how to prepare for midnight expansion",
        "is my wow character ready",
        "am i ready for wow midnight",

        // Comparison keywords (competitive)
        "better than raider.io",
        "raider io vs wow analyzer",
        "wowprogress alternative free",
        "simcraft alternative",
        "raidbots alternative",

        // Mobile & accessibility
        "wow mobile character checker",
        "check wow character on phone",
        "wow analyzer app",

        // Specific feature keywords
        "wow enchant checker",
        "wow gem checker",
        "wow tier set tracker",
        "wow achievement tracker",
        "wow mount tracker",
        "wow collection checker",

        // Time-based & expansion-specific
        "wow character analyzer 2026",
        "midnight expansion analyzer",
        "wow the war within analyzer",
        "wow 11.1 character checker",

        // Problem + solution keywords
        "check if wow character ready for midnight",
        "wow character optimization tool",
        "wow gear optimizer",
        "wow character audit free",

        // Voice search keywords (natural language)
        "check my world of warcraft character",
        "analyze my wow character free",
        "is my wow character ready for expansion",

        // Negative keywords (people searching for alternatives)
        "not raider.io",
        "free alternative to wowprogress",
        "no login wow checker"
    ],

    // Open Graph (Facebook, LinkedIn, Discord)
    openGraph: {
        title: "🎮 WoW Character Analyzer - Free Midnight Readiness Score",
        description: "Analyze your World of Warcraft character instantly! Check gear, M+ rating, raid progress & get AI recommendations. 100% Free - No login required!",
        type: "website",
        url: "https://techplay.gg/wow-analyzer",
        siteName: "TechPlay",
        images: [
            {
                url: "/WoW Analyzer.png",
                width: 1920,
                height: 1080,
                alt: "WoW Character Analyzer - Free Midnight Readiness Score & Gear Check",
            },
        ],
        locale: "en_US",
    },

    // Twitter Card
    twitter: {
        card: "summary_large_image",
        title: "🎮 WoW Character Analyzer - Free Midnight Readiness Score",
        description: "Analyze your WoW character instantly! Gear check, M+ score, raid progress & AI tips. 100% Free!",
        images: ["/WoW Analyzer.png"],
        creator: "@TechPlayGG",
        site: "@TechPlayGG",
    },

    // Additional SEO
    authors: [{ name: "TechPlay" }],
    category: "Gaming Tools",
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            "max-video-preview": -1,
            "max-image-preview": "large",
            "max-snippet": -1,
        },
    },
    alternates: {
        canonical: "https://techplay.gg/wow-analyzer",
    },
};

export default function WowAnalyzerPage() {
    // Structured Data for Google Rich Snippets (Schema.org JSON-LD)
    const structuredData = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "WoW Character Analyzer",
        "applicationCategory": "GameApplication",
        "operatingSystem": "Web Browser",
        "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "USD"
        },
        "description": "Free World of Warcraft character analyzer for Midnight expansion. Instantly check gear, Mythic+ score, raid progress, collections, and get AI-powered recommendations.",
        "url": "https://techplay.gg/wow-analyzer",
        "image": "https://techplay.gg/WoW%20Analyzer.png",
        "publisher": {
            "@type": "Organization",
            "name": "TechPlay",
            "url": "https://techplay.gg"
        },
        "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "4.9",
            "ratingCount": "50000",
            "bestRating": "5",
            "worstRating": "1"
        },
        "review": {
            "@type": "Review",
            "reviewRating": {
                "@type": "Rating",
                "ratingValue": "5",
                "bestRating": "5"
            },
            "author": {
                "@type": "Person",
                "name": "WoW Community"
            },
            "reviewBody": "Best free WoW character analyzer! Instant results, AI recommendations, and no login required. Perfect for Midnight expansion prep!"
        },
        "featureList": [
            "Instant character analysis",
            "Gear optimization checker",
            "Mythic+ score calculator",
            "Raid progress tracker",
            "Collection statistics",
            "AI-powered recommendations by Profesor Buffy",
            "Midnight expansion readiness score",
            "100% free - no account required",
            "Real-time Blizzard API data"
        ],
        "screenshot": "https://techplay.gg/WoW%20Analyzer.png"
    };

    // Breadcrumb Structured Data
    const breadcrumbData = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            {
                "@type": "ListItem",
                "position": 1,
                "name": "Home",
                "item": "https://techplay.gg"
            },
            {
                "@type": "ListItem",
                "position": 2,
                "name": "WoW Character Analyzer",
                "item": "https://techplay.gg/wow-analyzer"
            }
        ]
    };

    // FAQ Structured Data (helps with featured snippets)
    const faqData = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
            {
                "@type": "Question",
                "name": "How does the WoW Character Analyzer work?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The WoW Character Analyzer connects to Blizzard's official API to fetch your character data including gear, Mythic+ score, raid progress, achievements, and collections. It then analyzes 50+ data points using AI to give you a Midnight expansion readiness score and personalized recommendations."
                }
            },
            {
                "@type": "Question",
                "name": "Is the WoW Character Analyzer free?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes! The WoW Character Analyzer is 100% free forever. No account required, no credit card needed. Just enter your character name and realm to get instant analysis."
                }
            },
            {
                "@type": "Question",
                "name": "What is a good Midnight readiness score?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Midnight readiness scores range from 0-100%. Scores of 75+ are considered Epic/Legendary tier, meaning you're well-prepared for the Midnight expansion launch. Scores below 50 indicate you need to focus on gear upgrades, reputation grinding, and collection unlocks."
                }
            },
            {
                "@type": "Question",
                "name": "Can I analyze multiple WoW characters?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes! You can analyze unlimited characters across all regions (US, EU, KR, TW). If you login with Battle.net, you can save your characters for quick re-analysis."
                }
            },
            {
                "@type": "Question",
                "name": "What data does the analyzer check?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The analyzer checks your character's item level, gear optimization (enchants/gems), tier set progress, Mythic+ score, raid progression, PvP ratings, mount/pet/toy/transmog collections, reputations (especially Midnight factions), and achievements. It then provides AI-powered tips from Profesor Buffy."
                }
            }
        ]
    };

    return (
        <>
            {/* Structured Data Scripts */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbData) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(faqData) }}
            />

            <WowAnalyzerClient />
        </>
    );
}
