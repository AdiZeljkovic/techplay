import GiveawayClient from "./GiveawayClient";
import { Metadata } from "next";

interface PageProps {
    params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { slug } = await params;

    // Fetch giveaway for metadata
    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/giveaways/${slug}`, {
            next: { revalidate: 60 },
        });

        if (!res.ok) {
            return {
                title: "Giveaway | TechPlay",
            };
        }

        const data = await res.json();
        const giveaway = data.data;

        return {
            title: `${giveaway.title} | TechPlay Giveaway`,
            description: `Win ${giveaway.prize.name}! Enter the giveaway and complete tasks to increase your chances.`,
            openGraph: {
                title: `🎁 ${giveaway.title}`,
                description: `Win ${giveaway.prize.name}! Complete tasks to earn points and win.`,
                images: giveaway.featured_image ? [giveaway.featured_image] : [],
            },
            robots: {
                index: false, // Giveaways are private links
                follow: false,
            },
        };
    } catch {
        return {
            title: "Giveaway | TechPlay",
        };
    }
}

export default async function GiveawayPage({ params }: PageProps) {
    const { slug } = await params;

    return <GiveawayClient slug={slug} />;
}
