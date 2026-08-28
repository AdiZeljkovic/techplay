import SectionHubSkeleton from "@/components/editorial/SectionHubSkeleton";

/**
 * The skeleton belongs to the listing, not to everything under /news.
 *
 * It used to sit at app/news/loading.tsx, which wraps the whole subtree in a
 * Suspense boundary — including /news/{slug}. Next flushes the shell as soon
 * as that boundary is reached, so the 200 was already committed by the time
 * the article route called notFound(), and a piece that does not exist
 * answered "this is fine" with a body reading "Article Not Found".
 *
 * Measured across seven routes: news, reviews, guides and hardware each had a
 * loading.tsx and each answered 200; studios, lists and games had none and
 * each answered 404. No exceptions either way.
 *
 * In a route group the skeleton covers only the listing, which is where it was
 * ever visible — the article route has its own shell and never showed this.
 */
export default function Loading() {
    return <SectionHubSkeleton />;
}
