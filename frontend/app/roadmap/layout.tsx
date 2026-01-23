import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Roadmap 2026 - TechPlay",
    description: "Discover what's coming to TechPlay in 2026. From AI-powered recommendations to mobile apps, see our vision for the future of gaming and tech community.",
    keywords: ["roadmap", "2026", "upcoming features", "techplay plans", "gaming platform", "future updates"],
    openGraph: {
        title: "TechPlay Roadmap 2026",
        description: "Shaping the future of gaming and tech - See what's coming in 2026",
        type: "website",
        url: "https://techplay.gg/roadmap",
        siteName: "TechPlay",
        images: [
            {
                url: "/og-roadmap.jpg",
                width: 1200,
                height: 630,
                alt: "TechPlay Roadmap 2026"
            }
        ],
    },
    twitter: {
        card: "summary_large_image",
        title: "TechPlay Roadmap 2026",
        description: "Discover what's coming to TechPlay in 2026",
        images: ["/og-roadmap.jpg"],
    },
};

export default function RoadmapLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
