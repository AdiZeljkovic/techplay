import { Metadata } from "next";
import { generatePageMetadata } from "@/lib/seo";
import ForumClient from "./ForumClient";

export async function generateMetadata(): Promise<Metadata> {
    const meta = await generatePageMetadata('/forum', {
        title: "Community Forums",
        description: "Join the discussion — share your thoughts and connect with fellow gamers and tech enthusiasts.",
    });

    /**
     * Nothing to do here any more.
     *
     * This used to force the title absolute, because the admin-written title
     * already carried its own branding and the forum template added a second
     * suffix. generatePageMetadata now marks every database title absolute for
     * that same reason, so re-wrapping it here would only risk flattening it
     * back into a plain string.
     */
    return meta;
}

export default function ForumPage() {
    return <ForumClient />;
}
