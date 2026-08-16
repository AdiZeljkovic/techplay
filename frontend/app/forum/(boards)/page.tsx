import { Metadata } from "next";
import { generatePageMetadata } from "@/lib/seo";
import ForumClient from "./ForumClient";

export async function generateMetadata(): Promise<Metadata> {
    const meta = await generatePageMetadata('/forum', {
        title: "Community Forums",
        description: "Join the discussion — share your thoughts and connect with fellow gamers and tech enthusiasts.",
    });

    /**
     * Absolute, so the forum's title template does not apply to the forum's
     * own front page.
     *
     * The title here comes from the admin panel's page SEO, which already
     * carries its own branding. With the template added on top it read
     * "TechPlay Community Forums | Global Gaming & Hardware Discussions |
     * TechPlay Forum" — measured, not predicted. Boards and threads below still
     * want the suffix; this one page does not.
     */
    return {
        ...meta,
        title: { absolute: typeof meta.title === 'string' ? meta.title : 'Community Forums' },
    };
}

export default function ForumPage() {
    return <ForumClient />;
}
