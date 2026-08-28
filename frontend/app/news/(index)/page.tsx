
import SectionHub from "@/components/editorial/SectionHub";
import { generatePageMetadata } from "@/lib/seo";
import { getServerApiUrl, serverHeaders } from "@/lib/api";
import { Metadata } from "next";

// Revalidate every 5 minutes
export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
    /**
     * The defaults matter here, they are not decoration.
     *
     * This called the no-defaults form, and there is no `/news` row in
     * page_seo — so the title fell all the way through to the site name, the
     * root template appended it again, and the section that is supposed to
     * carry the site's search traffic went out as "TechPlay | TechPlay".
     * A hub's title is the one thing a search engine has to tell it apart from
     * the homepage.
     */
    return generatePageMetadata('/news', {
        title: "Gaming News",
        description: "Game announcements, release dates, patches and industry news — written short and kept current.",
        keywords: ["gaming news", "game announcements", "release dates", "video game industry"],
    });
}

async function getInitialNews() {
    try {
        const res = await fetch(`${getServerApiUrl()}/news?page=1`, {
            next: { revalidate: 300, tags: ['news'] },
            headers: serverHeaders(),
        });
        if (!res.ok) return null;
        return await res.json();
    } catch {
        return null;
    }
}

export default async function NewsPage() {
    const initialData = await getInitialNews();

    return <SectionHub section="news" initialData={initialData} />;
}
