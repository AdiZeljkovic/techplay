import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getApiUrl, getServerApiUrl } from "@/lib/api";
import type { Gta6Vehicle } from "@/types";
import Gta6EntityDetail from "@/components/gta6/Gta6EntityDetail";

export const revalidate = 3600;

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://techplay.gg";

export async function generateStaticParams(): Promise<{ slug: string }[]> {
    try {
        const res = await fetch(`${getServerApiUrl()}/gta6/vehicles`, {
            next: { revalidate: 3600 },
            headers: { Accept: "application/json" },
        });
        if (!res.ok) return [];
        const json = await res.json();
        return (json.data ?? [])
            .map((v: { slug?: string }) => v.slug)
            .filter(Boolean)
            .map((slug: string) => ({ slug }));
    } catch {
        return [];
    }
}

async function fetchVehicle(slug: string): Promise<Gta6Vehicle | null> {
    try {
        const res = await fetch(`${getApiUrl()}/gta6/vehicles/${slug}`, {
            next: { revalidate: 3600 },
            headers: { Accept: "application/json" },
        });
        if (!res.ok) return null;
        const json = await res.json();
        return json.data ?? null;
    } catch {
        return null;
    }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params;
    const v = await fetchVehicle(slug);
    if (!v) return { title: "Vehicle Not Found — TechPlay" };
    const classText = v.vehicle_class ? ` (${v.vehicle_class})` : "";
    const firstSentence = v.description ? v.description.split(".")[0] + "." : "";
    const desc = `The ${v.name}${classText} is a confirmed vehicle in Grand Theft Auto VI. ${firstSentence} Full profile and class info.`.slice(0, 160);
    return {
        title: `${v.name} — GTA 6 Vehicle Profile & Gallery | TechPlay`,
        description: desc,
        keywords: [`${v.name} GTA 6`, "GTA 6 vehicles", "GTA 6 cars"],
        alternates: { canonical: `${SITE_URL}/gta6/vehicles/${v.slug}` },
        openGraph: {
            title: `${v.name} — GTA 6 Vehicle`,
            description: desc,
            images: v.image ? [{ url: v.image }] : [],
            type: "website",
        },
    };
}

export default async function Gta6VehicleDetailPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const v = await fetchVehicle(slug);
    if (!v) notFound();

    const meta = [
        ...(v.vehicle_class ? [{ label: "Class", value: v.vehicle_class }] : []),
        ...(v.real_equivalent ? [{ label: "Inspired by", value: v.real_equivalent }] : []),
    ];

    const productLd = {
        "@context": "https://schema.org",
        "@type": "Product",
        "name": v.name,
        ...(v.description ? { description: v.description } : {}),
        ...(v.image ? { image: v.image } : {}),
        ...(v.vehicle_class ? { category: v.vehicle_class } : {}),
        "url": `${SITE_URL}/gta6/vehicles/${v.slug}`,
    };

    const breadcrumbLd = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": SITE_URL },
            { "@type": "ListItem", "position": 2, "name": "GTA 6 Hub", "item": `${SITE_URL}/gta6` },
            { "@type": "ListItem", "position": 3, "name": "Vehicles", "item": `${SITE_URL}/gta6/vehicles` },
            { "@type": "ListItem", "position": 4, "name": v.name, "item": `${SITE_URL}/gta6/vehicles/${v.slug}` },
        ],
    };

    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
            <Gta6EntityDetail entity={v} sectionLabel="Vehicles" sectionPath="/gta6/vehicles" meta={meta} />
        </>
    );
}
