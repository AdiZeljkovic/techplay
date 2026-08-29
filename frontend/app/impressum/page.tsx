import { Metadata } from "next";
import { getServerApiUrl, serverHeaders } from "@/lib/api";
import { generatePageMetadata } from "@/lib/seo";
import ImpressumClient from "./ImpressumClient";

export async function generateMetadata(): Promise<Metadata> {
    return generatePageMetadata('/impressum', {
        title: "Impressum",
        description: "Legal information about TechPlay — company details, editorial team, and contact information.",
    });
}

async function getStaffData() {
    // Server-side, so the internal address — the public hostname goes out
    // through Cloudflare and back for no reason. The staff list has been
    // rendering empty on this page.
    const baseUrl = getServerApiUrl();
    const url = baseUrl.endsWith('/api/v1') ? `${baseUrl}/staff` : `${baseUrl}/api/v1/staff`;


    try {
        // An hour, not `no-store`. The masthead changes when somebody is hired,
        // which is not something to re-ask the API on every single request —
        // and this page is not behind the nginx cache that /games/ and /studios/
        // sit behind, so `no-store` meant a round trip per visitor and per bot.
        const res = await fetch(url, { next: { revalidate: 3600 }, headers: serverHeaders() });
        if (!res.ok) {
            console.error('[Impressum] Staff API error - status:', res.status);
            return null;
        }
        const data = await res.json();
        return data;
    } catch (error) {
        console.error("[Impressum] Failed to fetch staff:", error);
        return null;
    }
}

// Rebuilt hourly rather than rendered per request. `force-dynamic` was doing the
// latter for a page whose content changes when the masthead does.
export const revalidate = 3600;

export default async function ImpressumPage() {
    const staff = await getStaffData();

    return <ImpressumClient staff={staff} />;
}
