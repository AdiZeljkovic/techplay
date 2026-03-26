import { Metadata } from "next";
import { generatePageMetadata } from "@/lib/seo";
import GiveawaysClient from "./GiveawaysClient";

export async function generateMetadata(): Promise<Metadata> {
    const metadata = await generatePageMetadata('/giveaways', {
        title: "Giveaways - TechPlay",
        description: "Browse active and past giveaways. Enter to win amazing gaming prizes!",
    });
    return { ...metadata, robots: { index: false, follow: false } };
}

export default function GiveawaysPage() {
    return <GiveawaysClient />;
}
