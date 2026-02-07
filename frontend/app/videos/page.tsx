import { Metadata } from "next";
import { generatePageMetadata } from "@/lib/seo";
import VideosClient from "./VideosClient";

export async function generateMetadata(): Promise<Metadata> {
    return generatePageMetadata('/videos', {
        title: "Videos",
        description: "Watch gaming highlights, cinematic edits, and community content on TechPlay.",
    });
}

export default function VideosPage() {
    return <VideosClient />;
}
