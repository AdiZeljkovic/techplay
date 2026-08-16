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
        const res = await fetch(url, { cache: 'no-store', headers: serverHeaders() });
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

export const dynamic = 'force-dynamic';

export default async function ImpressumPage() {
    const staff = await getStaffData();

    return <ImpressumClient staff={staff} />;
}
