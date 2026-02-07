import { Metadata } from "next";
import { generatePageMetadata } from "@/lib/seo";
import CookiesClient from "./CookiesClient";

export async function generateMetadata(): Promise<Metadata> {
    return generatePageMetadata('/cookies', {
        title: "Cookie Policy",
        description: "Understand how TechPlay uses cookies and how you can manage your preferences.",
    });
}

export default function CookiesPage() {
    return <CookiesClient />;
}
