import type { Metadata } from "next";
import { getApiUrl, serverHeaders } from "@/lib/api";
import { decodeHtml } from "@/lib/decode";
import ThreadClient, { type ThreadData } from "./ThreadClient";

/**
 * A thread, rendered on the server.
 *
 * This is the page the forum exists to produce, and until now it shipped none
 * of itself: 65 KB of HTML with not one word of the conversation in it, under a
 * title shared with every other page on the forum. A search engine had nothing
 * to index and no reason to keep the URL.
 *
 * Now the opening post and the first fifteen replies are in the document, the
 * page carries the thread's own title and an excerpt of what was actually
 * asked, and a DiscussionForumPosting record describes it in the terms a search
 * engine already understands. Everything interactive — replying, reactions,
 * the poll, moderation, live updates — is unchanged in the client half.
 */

export const dynamic = "force-dynamic";

async function loadThread(slug: string): Promise<ThreadData | null> {
    try {
        const res = await fetch(`${getApiUrl()}/forum/threads/${slug}`, {
            // serverHeaders, not a bare Accept: the API meters `api` at sixty
            // requests a minute keyed on the caller's IP, and every server
            // render leaves this process from one address — so without the
            // shared secret the whole forum renders out of one visitor's
            // budget, and a crawler walking it exhausts that in seconds.
            headers: serverHeaders(),
            cache: "no-store",
        });

        // A thread in a private board answers 404 to this unauthenticated
        // request, which is the point: it should not reach anyone's HTML. The
        // client half then fetches it with the reader's own token.
        if (!res.ok) return null;

        return (await res.json()) as ThreadData;
    } catch {
        return null;
    }
}

/** Plain text, collapsed, trimmed at a word — for meta tags and JSON-LD. */
function excerpt(html: string | null | undefined, limit = 160): string {
    const text = decodeHtml((html ?? "").replace(/<[^>]*>/g, " "))
        .replace(/\s+/g, " ")
        .trim();

    if (text.length <= limit) return text;

    const cut = text.slice(0, limit);
    const lastSpace = cut.lastIndexOf(" ");

    return (lastSpace > 60 ? cut.slice(0, lastSpace) : cut).trimEnd() + "…";
}

export async function generateMetadata({
    params,
}: {
    params: Promise<{ slug: string }>;
}): Promise<Metadata> {
    const { slug } = await params;
    const data = await loadThread(slug);

    if (!data?.thread) {
        return { title: "Thread" };
    }

    const title = decodeHtml(data.thread.title);
    const board = data.thread.category?.name ? decodeHtml(data.thread.category.name) : "the forum";
    const description = excerpt(data.thread.content) || `A discussion in ${board} on the TechPlay community forum.`;

    return {
        title,
        description,
        alternates: { canonical: `/forum/thread/${slug}` },
        openGraph: {
            title,
            description,
            type: "article",
            publishedTime: data.thread.created_at,
        },
    };
}

export default async function ThreadPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    const initial = await loadThread(slug);

    /**
     * Described in the vocabulary search engines already have for this.
     *
     * DiscussionForumPosting is the schema.org type for exactly this page, and
     * it is what earns a forum thread its own treatment in results rather than
     * being read as a generic article. Emitted only when the server actually
     * has the thread — a private one produces nothing, which is correct.
     */
    const jsonLd = initial?.thread
        ? {
            "@context": "https://schema.org",
            "@type": "DiscussionForumPosting",
            headline: decodeHtml(initial.thread.title),
            text: excerpt(initial.thread.content, 500),
            datePublished: initial.thread.created_at,
            author: initial.thread.author?.username
                ? { "@type": "Person", name: initial.thread.author.username }
                : undefined,
            interactionStatistic: [
                {
                    "@type": "InteractionCounter",
                    interactionType: "https://schema.org/CommentAction",
                    userInteractionCount: initial.thread.posts_count ?? 0,
                },
                {
                    "@type": "InteractionCounter",
                    interactionType: "https://schema.org/ViewAction",
                    userInteractionCount: initial.thread.view_count ?? 0,
                },
            ],
        }
        : null;

    return (
        <>
            {jsonLd && (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
                />
            )}
            <ThreadClient initial={initial} />
        </>
    );
}
