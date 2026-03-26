import { Metadata } from "next";
import { generatePageMetadata } from "@/lib/seo";
import CommunityGuidelinesClient from "./CommunityGuidelinesClient";

export async function generateMetadata(): Promise<Metadata> {
    return generatePageMetadata('/community-guidelines', {
        title: "Community Guidelines - TechPlay",
        description: "Read the TechPlay community guidelines. Learn how to participate respectfully and keep our forums safe for everyone.",
    });
}

export default function CommunityGuidelinesPage() {
    return <CommunityGuidelinesClient />;
}
