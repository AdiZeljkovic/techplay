import { Metadata } from "next";
import { generatePageMetadata } from "@/lib/seo";
import { getServerApiUrl } from "@/lib/api";
import SupportClient from "./SupportClient";
import type { SupportTier } from "@/types/support";

// The tiers change when someone edits them in the admin panel, not per request.
export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
    return generatePageMetadata('/support', {
        title: "Support TechPlay",
        description: "Help keep TechPlay independent. Support us and get exclusive perks.",
    });
}

async function getTiers(): Promise<SupportTier[]> {
    try {
        const res = await fetch(`${getServerApiUrl()}/support/tiers`, {
            next: { revalidate: 300 },
            headers: { Accept: 'application/json' },
        });

        if (!res.ok) return [];

        const data = await res.json();

        return (Array.isArray(data) ? data : data?.data ?? []) as SupportTier[];
    } catch {
        return [];
    }
}

export default async function SupportPage() {
    return <SupportClient tiers={await getTiers()} />;
}
