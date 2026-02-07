import { Metadata } from "next";
import { generatePageMetadata } from "@/lib/seo";
import TermsClient from "./TermsClient";

export async function generateMetadata(): Promise<Metadata> {
    return generatePageMetadata('/terms', {
        title: "Terms of Service",
        description: "Read the terms and conditions for using TechPlay services.",
    });
}

export default function TermsPage() {
    return <TermsClient />;
}
