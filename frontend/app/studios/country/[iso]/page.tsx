import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getApiUrl } from "@/lib/api";
import { fetchContent } from "@/lib/fetchContent";
import StudiosClient, { type StudioCard, type Pagination } from "../../StudiosClient";

/**
 * Studios of one country, as its own address.
 *
 * A query string would have done the same filtering, but `?country=JP` is not a
 * page anyone links to or that a search engine keeps. The catalogue holds
 * studios from 135 countries; six of them account for most of it, and each is
 * a page worth having.
 */
export const revalidate = 3600;

interface Listing {
    data: StudioCard[];
    pagination: Pagination;
}

/** Enough to name the page before the API answers. The API is the authority. */
const NAMES: Record<string, string> = {
    us: "the United States",
    jp: "Japan",
    gb: "the United Kingdom",
    de: "Germany",
    fr: "France",
    ca: "Canada",
    se: "Sweden",
    pl: "Poland",
};

function load(iso: string) {
    return fetchContent<Listing>(`${getApiUrl()}/studios?sort=games&country=${encodeURIComponent(iso)}`, {
        next: { revalidate: 3600 },
    });
}

export async function generateMetadata({ params }: { params: Promise<{ iso: string }> }): Promise<Metadata> {
    const { iso } = await params;
    const listing = await load(iso).catch(() => null);
    const where = listing?.data?.[0]?.country?.name ?? NAMES[iso.toLowerCase()] ?? iso.toUpperCase();

    return {
        title: `Game studios in ${where}`,
        description: `Developers and publishers based in ${where}, and every game of theirs in the TechPlay database.`,
        alternates: { canonical: `/studios/country/${iso.toLowerCase()}` },
    };
}

export default async function StudiosByCountryPage({ params }: { params: Promise<{ iso: string }> }) {
    const { iso } = await params;
    const listing = await load(iso);

    /* An ISO code nobody in the catalogue is from is not a page. */
    if (!listing || listing.data.length === 0) notFound();

    return (
        <StudiosClient
            initialStudios={listing.data}
            initialPagination={listing.pagination}
            country={{
                iso: iso.toLowerCase(),
                name: listing.data[0]?.country?.name ?? NAMES[iso.toLowerCase()] ?? iso.toUpperCase(),
            }}
        />
    );
}
