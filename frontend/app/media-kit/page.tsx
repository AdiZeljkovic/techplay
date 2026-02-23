import MediaKitClient from "./MediaKitClient";
import { Metadata } from "next";

export const revalidate = 3600; // ISR: 1 hour

export async function generateMetadata(): Promise<Metadata> {
    return {
        title: "Media Kit & Press Information | TechPlay",
        description: "Official media kit with audience statistics, content strategy, and partnership opportunities for TechPlay gaming portal.",
        openGraph: {
            title: "Media Kit & Press Information | TechPlay",
            description: "Statistics, audience insights, and advertising opportunities",
            url: `${process.env.NEXT_PUBLIC_APP_URL}/media-kit`,
            siteName: 'TechPlay',
            type: 'website',
            images: [`${process.env.NEXT_PUBLIC_APP_URL}/og-media-kit.jpg`],
            locale: 'en_US',
        },
        twitter: {
            card: 'summary_large_image',
            title: "Media Kit & Press Information | TechPlay",
            description: "Statistics, audience insights, and advertising opportunities",
        },
        robots: {
            index: true,
            follow: true,
        },
    };
}

export default function MediaKitPage() {
    return <MediaKitClient />;
}
