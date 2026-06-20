import type { Metadata } from "next";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://techplay.gg";

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }): Promise<Metadata> {
    const { username } = await params;
    const ogImage = `${APP_URL}/og/profile?username=${encodeURIComponent(username)}`;

    return {
        title: `${username}'s Profile — TechPlay`,
        description: `Check out ${username}'s gaming profile on TechPlay.gg`,
        openGraph: {
            title: `${username} on TechPlay`,
            description: `Check out ${username}'s gaming profile on TechPlay.gg`,
            images: [{ url: ogImage, width: 1200, height: 630, alt: `${username}'s TechPlay profile` }],
            type: "profile",
        },
        twitter: {
            card: "summary_large_image",
            title: `${username} on TechPlay`,
            description: `Check out ${username}'s gaming profile on TechPlay.gg`,
            images: [ogImage],
        },
    };
}

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
