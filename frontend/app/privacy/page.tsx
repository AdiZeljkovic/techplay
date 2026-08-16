import { Metadata } from "next";
import { generatePageMetadata } from "@/lib/seo";
import PrivacyClient from "./PrivacyClient";

export async function generateMetadata(): Promise<Metadata> {
    return generatePageMetadata('/privacy', {
        title: "Privacy Policy",
        description: "What data TechPlay collects — including from connected Steam, PlayStation and Xbox accounts — how it is used, and how to remove it.",
    });
}

export default function PrivacyPage() {
    return <PrivacyClient />;
}
