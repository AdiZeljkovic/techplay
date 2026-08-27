import { Metadata } from "next";
import CalendarClient from "./CalendarClient";
import { generatePageMetadata } from "@/lib/seo";

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

export default function CalendarPage() {
    return <CalendarClient />;
}
