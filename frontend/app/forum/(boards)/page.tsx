import { Metadata } from "next";
import { generatePageMetadata } from "@/lib/seo";
import ForumClient from "./ForumClient";

export async function generateMetadata(): Promise<Metadata> {
    return generatePageMetadata('/forum', {
        title: "Community Forums",
        description: "Join the discussion — share your thoughts and connect with fellow gamers and tech enthusiasts.",
    });
}

export default function ForumPage() {
    return <ForumClient />;
}
