import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getApiUrl, getServerApiUrl, serverHeaders } from "@/lib/api";
import { fetchContent } from "@/lib/fetchContent";
import type { Gta6Character } from "@/types";
import { absoluteGta6Image } from "@/lib/gta6";
import Gta6EntityDetail from "@/components/gta6/Gta6EntityDetail";

export const revalidate = 3600;

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://techplay.gg";

export async function generateStaticParams(): Promise<{ slug: string }[]> {
    try {
        const res = await fetch(`${getServerApiUrl()}/gta6/characters`, {
            next: { revalidate: 3600 },
            headers: serverHeaders(),
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

/**
 * Cut on a word, never inside one, and only add the tail when it fits.
 *
 * Google shows roughly 155 characters and truncates the rest itself — on a
 * word. A description that arrives already broken mid-word is cut twice, once
 * by us and once by them, and the first cut is the one that reads as careless.
 */
function clampToWord(text: string, max: number, tail = ""): string {
    const full = tail ? `${text.trim()} ${tail}` : text.trim();
    if (full.length <= max) return full;

    const body = text.trim();
    if (body.length <= max) return body;

    // lastIndexOf returns -1 when the first word alone is longer than max;
    // slicing on that would drop a character instead of the whole word.
    const brk = body.lastIndexOf(" ", max);
    const cut = brk > 0 ? body.slice(0, brk) : body.slice(0, max);

    return cut.replace(/[\s,;:—-]+$/, "");
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params;
    const c = await fetchCharacter(slug);
    if (!c) return { title: "Character Not Found" };
    const roleText = c.role ? `the ${c.role}` : "a character";
    const firstSentence = c.description ? c.description.split(".")[0].trim() + "." : "";

    /*
     * Two problems in one line, both from `.slice(0, 160)`.
     *
     * It cut by character, so every one of the twelve profiles ended
     * mid-word — "standing alongside Jason D", "sharing the spotlight with
     * Luc". And because the cut always landed inside the bio, the closing
     * sentence the template promised — "Full profile, story details and
     * gallery." — never once reached a reader.
     *
     * The name was also being said twice: the lead-in names the character and
     * the bio's first sentence starts with the name again. Dropping the
     * lead-in when the bio already opens with the name leaves room for the
     * part that carries information.
     */
    const opensWithName = firstSentence.toLowerCase().startsWith(c.name.toLowerCase());
    const lead = opensWithName ? "" : `${c.name} is ${roleText} in Grand Theft Auto VI. `;
    const desc = clampToWord(`${lead}${firstSentence}`, 155, "Full profile, story details and gallery.");
    return {
        title: `${c.name} — GTA 6 Character Profile & Gallery`,
        description: desc,
        keywords: [`${c.name} GTA 6`, `${c.name} Grand Theft Auto VI`, "GTA 6 characters"],
        alternates: { canonical: `${SITE_URL}/gta6/characters/${c.slug}` },
        openGraph: {
            title: `${c.name} — GTA 6 Character`,
            description: desc,
            /*
             * The API returns a storage-relative path ("gta6-characters/x.webp").
             * Passed through untouched, Next resolves it against metadataBase —
             * techplay.gg — and every one of the twelve character pages
             * advertised an og:image that returned 404. The page itself looked
             * fine, because the component resolves it properly; only the share
             * card was empty, which is the one place these pages are seen.
             */
            images: absoluteGta6Image(c.image) ? [{ url: absoluteGta6Image(c.image)! }] : [],
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
        // schema.org wants an absolute URL; a relative path is unusable.
        ...(absoluteGta6Image(c.image) ? { image: absoluteGta6Image(c.image) } : {}),
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
