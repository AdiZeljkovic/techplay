import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Gaming News - Breaking Headlines & Industry Updates",
    description: "Stay updated with the latest gaming news, industry announcements, game releases, and developer updates. Breaking stories from PlayStation, Xbox, Nintendo, and PC gaming world.",
    keywords: ["gaming news", "video game news", "PS5 news", "Xbox news", "Nintendo news", "PC gaming news", "game announcements", "gaming industry news"],
    openGraph: {
        title: "Gaming News - Latest Headlines from TechPlay",
        description: "Breaking gaming news, release dates, trailers, and industry updates. Your daily source for what's happening in gaming.",
        type: "website",
    },
    alternates: {
        canonical: "/news",
    },
};

export default function NewsLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
