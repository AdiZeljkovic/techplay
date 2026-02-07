import { Metadata } from "next";
import { generatePageMetadata } from "@/lib/seo";
import PrivacyClient from "./PrivacyClient";

export async function generateMetadata(): Promise<Metadata> {
    return generatePageMetadata('/privacy', {
        title: "Privacy Policy",
        description: "Learn how TechPlay collects, uses, and protects your personal data.",
    });
}

export default function PrivacyPage() {
    return <PrivacyClient />;
}
