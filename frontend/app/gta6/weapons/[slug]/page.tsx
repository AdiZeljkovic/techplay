import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getApiUrl } from "@/lib/api";
import type { Gta6Weapon } from "@/types";
import Gta6EntityDetail from "@/components/gta6/Gta6EntityDetail";

export const revalidate = 3600;

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://techplay.gg";

async function fetchWeapon(slug: string): Promise<Gta6Weapon | null> {
    try {
        const res = await fetch(`${getApiUrl()}/gta6/weapons/${slug}`, {
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
    const w = await fetchWeapon(slug);
    if (!w) return { title: "Weapon Not Found — TechPlay" };
    const desc = (w.description ?? `${w.name} — a weapon in Grand Theft Auto VI.`).slice(0, 160);
    return {
        title: `${w.name} — GTA 6 Weapon | TechPlay`,
        description: desc,
        alternates: { canonical: `${SITE_URL}/gta6/weapons/${w.slug}` },
        openGraph: {
            title: `${w.name} — GTA 6 Weapon`,
            description: desc,
            images: w.image ? [{ url: w.image }] : [],
            type: "website",
        },
    };
}

export default async function Gta6WeaponDetailPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const w = await fetchWeapon(slug);
    if (!w) notFound();

    const meta = [
        ...(w.weapon_type ? [{ label: "Type", value: w.weapon_type }] : []),
    ];

    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "Product",
        "name": w.name,
        ...(w.description ? { description: w.description } : {}),
        ...(w.image ? { image: w.image } : {}),
        ...(w.weapon_type ? { category: w.weapon_type } : {}),
        "url": `${SITE_URL}/gta6/weapons/${w.slug}`,
    };

    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
            <Gta6EntityDetail entity={w} sectionLabel="Weapons" sectionPath="/gta6/weapons" meta={meta} />
        </>
    );
}
