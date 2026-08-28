import { Metadata } from "next";
import CalendarClient from "./CalendarClient";
import { generatePageMetadata } from "@/lib/seo";
import { getServerApiUrl, serverHeaders } from "@/lib/api";

/*
 * Routed through the site's own metadata builder rather than a static object.
 *
 * A plain `export const metadata` cannot await anything, so this page had no
 * canonical at all — nothing protected it from ?utm_source and every other
 * parameter anyone shares it with. generatePageMetadata always emits one, and
 * brings the robots block, x-default and the admin's PageSeo override with it.
 */
export async function generateMetadata(): Promise<Metadata> {
    return generatePageMetadata("/calendar", {
        title: "Game Release Calendar",
        description: "Every game launch in one place. Browse upcoming and past game releases by month and platform — PC, PlayStation, Xbox and Nintendo.",
    });
}

/**
 * The current month, fetched here so the page has links in it.
 *
 * CalendarClient draws everything from SWR, which answers in the browser and
 * nowhere else, so /calendar shipped 75 KB of chrome and not one anchor to a
 * release — an indexed hub pointing at nothing. The unfiltered request is what
 * the client asks for on its first render too, so seeding it costs no extra
 * round trip and the view does not change on hydration.
 *
 * A failure returns nothing rather than throwing: the calendar then behaves
 * exactly as it did before, which is the situation this improves on.
 */
async function currentMonth() {
    try {
        const res = await fetch(`${getServerApiUrl()}/calendar`, {
            next: { revalidate: 900 },
            headers: serverHeaders(),
        });

        if (!res.ok) return undefined;

        const json = await res.json();

        return json.data ?? undefined;
    } catch {
        return undefined;
    }
}

export default async function CalendarPage() {
    const initial = await currentMonth();

    return <CalendarClient initial={initial} />;
}
