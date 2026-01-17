import { Metadata } from "next";

export const metadata: Metadata = {
    title: "About Us - Gaming News Team from Sarajevo",
    description: "TechPlay is a Sarajevo-based gaming and technology media outlet. Founded by passionate gamers, we deliver unbiased reviews, breaking news, and in-depth hardware analysis. Meet the team behind your favorite gaming portal.",
    keywords: ["about TechPlay", "gaming news team", "Sarajevo gaming", "gaming journalists", "tech reviewers", "gaming media outlet"],
    openGraph: {
        title: "About TechPlay - The Team Behind the News",
        description: "Meet the passionate team of gamers and tech enthusiasts creating TechPlay content from Sarajevo, Bosnia and Herzegovina.",
        type: "website",
    },
    alternates: {
        canonical: "/about",
    },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
