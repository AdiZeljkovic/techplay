import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getApiUrl, getServerApiUrl } from "@/lib/api";
import { fetchContent } from "@/lib/fetchContent";
import type { Gta6Character } from "@/types";
import Gta6EntityDetail from "@/components/gta6/Gta6EntityDetail";

export const revalidate = 3600;

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://techplay.gg";

export async function generateStaticParams(): Promise<{ slug: string }[]> {
    try {
        const res = await fetch(`${getServerApiUrl()}/gta6/characters`, {
            next: { revalidate: 3600 },
            headers: { Accept: "application/json" },
        });
        if (!res.ok) return [];
        const json = await res.json();
        return (json.data ?? [])
            .map((c: { slug?: string }) => c.slug)
            .filter(Boolean)
            .map((slug: string) => ({ slug }));
    } catch {
        return [];
    }
}

async function fetchCharacter(slug: string): Promise<Gta6Character | null> {
    const json = await fetchContent<{ data?: Gta6Character }>(`${getApiUrl()}/gta6/characters/${slug}`, {
        next: { revalidate: 3600 },
    });

    return json?.data ?? null;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params;
    const c = await fetchCharacter(slug);
    if (!c) return { title: "Character Not Found — TechPlay" };
    const roleText = c.role ? `the ${c.role}` : "a character";
    const firstSentence = c.description ? c.description.split(".")[0] + "." : "";
    const desc = `${c.name} is ${roleText} in Grand Theft Auto VI. ${firstSentence} Full profile, story details and gallery.`.slice(0, 160);
    return {
        title: `${c.name} — GTA 6 Character Profile & Gallery`,
        description: desc,
        keywords: [`${c.name} GTA 6`, `${c.name} Grand Theft Auto VI`, "GTA 6 characters"],
        alternates: { canonical: `${SITE_URL}/gta6/characters/${c.slug}` },
        openGraph: {
            title: `${c.name} — GTA 6 Character`,
            description: desc,
            images: c.image ? [{ url: c.image }] : [],
            type: "profile",
        },
    };
}

export default async function Gta6CharacterDetailPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const c = await fetchCharacter(slug);
    if (!c) notFound();

    const meta = [
        ...(c.role ? [{ label: "Role", value: c.role }] : []),
        ...(c.alias ? [{ label: "Alias", value: c.alias }] : []),
    ];

    const personLd = {
        "@context": "https://schema.org",
        "@type": "Person",
        "name": c.name,
        ...(c.alias ? { alternateName: c.alias } : {}),
        ...(c.description ? { description: c.description } : {}),
        ...(c.image ? { image: c.image } : {}),
        "url": `${SITE_URL}/gta6/characters/${c.slug}`,
    };

    const breadcrumbLd = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": SITE_URL },
            { "@type": "ListItem", "position": 2, "name": "GTA 6 Hub", "item": `${SITE_URL}/gta6` },
            { "@type": "ListItem", "position": 3, "name": "Characters", "item": `${SITE_URL}/gta6/characters` },
            { "@type": "ListItem", "position": 4, "name": c.name, "item": `${SITE_URL}/gta6/characters/${c.slug}` },
        ],
    };

    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(personLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
            <Gta6EntityDetail entity={c} sectionLabel="Characters" sectionPath="/gta6/characters" meta={meta} />
        </>
    );
}
