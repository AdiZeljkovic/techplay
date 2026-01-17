import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Game Reviews - Honest Scores & In-Depth Analysis",
    description: "Read our comprehensive game reviews with detailed scores, benchmarks, pros and cons. From AAA titles to indie gems, we test every game thoroughly. Unbiased verdicts you can trust.",
    keywords: ["game reviews", "video game reviews", "PS5 game reviews", "Xbox game reviews", "PC game reviews", "gaming scores", "game ratings", "honest game reviews"],
    openGraph: {
        title: "TechPlay Reviews - Unbiased Game Reviews & Ratings",
        description: "In-depth game reviews with benchmark scores, gameplay analysis, and final verdicts. Find your next favorite game.",
        type: "website",
    },
    alternates: {
        canonical: "/reviews",
    },
};

export default function ReviewsLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
