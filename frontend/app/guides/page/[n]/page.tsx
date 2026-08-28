import { Metadata } from "next";
import { notFound } from "next/navigation";
import SectionHub from "@/components/editorial/SectionHub";
import { generatePageMetadata } from "@/lib/seo";
import { fetchSectionPage } from "@/lib/sectionPages";
import { ROBOTS_INDEX } from "@/lib/seo";

/**
 * Page two and beyond, at an address instead of in client state.
 *
 * /guides renders thirteen articles and its pager was a pair of buttons, so 587
 * of 630 published pieces had no link pointing at them from anywhere on the
 * site. They were in the sitemap — which says a page exists — with nothing
 * saying it mattered.
 *
 * Page one stays at /guides, static and cached; there is no /guides/page/1, so each
 * page keeps exactly one URL and the canonical below can point at itself
 * honestly.
 */
export const revalidate = 300;

type Props = { params: Promise<{ n: string }> };

function parsePage(raw: string): number | null {
    if (!/^[1-9][0-9]*$/.test(raw)) return null;

    const n = Number(raw);

    // Page one is /guides. Serving it here too would be the same list at two
    // addresses, which is the problem this is meant to avoid.
    return n >= 2 && n <= 500 ? n : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { n } = await params;
    const page = parsePage(n);

    if (page === null) return { title: "Not found", robots: { index: false, follow: false } };

    const base = await generatePageMetadata(`/guides/page/${page}`, {
        title: `Gaming Guides — page ${page}`,
        description: `Step-by-step guides, builds and walkthroughs. Page ${page} of the archive.`,
    });

    return { ...base, robots: ROBOTS_INDEX };
}

export default async function GuidesPagedPage({ params }: Props) {
    const { n } = await params;
    const page = parsePage(n);

    if (page === null) notFound();

    const data = await fetchSectionPage("guides", page);

    // Past the end of the archive is not a page. Without this, /guides/page/900
    // would answer 200 with an empty list for any number anyone typed.
    if (!data || page > data.lastPage) notFound();

    return (
        <SectionHub
            section="guides"
            initialData={data.body as never}
            initialPage={page}
            basePath="/guides"
        />
    );
}
