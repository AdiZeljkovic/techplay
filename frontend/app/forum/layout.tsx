import { ReactNode } from "react";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Community Forums - Gaming Discussions & Help",
    description: "Join the TechPlay community forums. Discuss games, share PC builds, get technical help, trade in the marketplace, and connect with fellow gamers. Active community since 2024.",
    keywords: ["gaming forum", "PC gaming community", "gaming discussions", "PC build help", "gaming marketplace", "esports community"],
    openGraph: {
        title: "TechPlay Forums - Gaming Community Discussions",
        description: "A thriving community of gamers discussing games, hardware, esports, and more.",
        type: "website",
    },
    alternates: {
        canonical: "/forum",
    },
};

export default function ForumLayout({ children }: { children: ReactNode }) {
    return <>{children}</>;
}

