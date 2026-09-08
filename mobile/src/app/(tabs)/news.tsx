import { ArticleFeed } from '@/components/ArticleFeed';
import { Masthead } from '@/components/Masthead';
import { Screen } from '@/components/Screen';
import { getNews } from '@/lib/content';

/**
 * Everything, newest first, a page at a time.
 *
 * The front page is edited — hero, rails, a shape somebody chose. This is the
 * other thing a reader wants: the full run, in order, without anybody's
 * opinion about what leads.
 *
 * The list machinery moved to `ArticleFeed` when the four section screens
 * arrived wanting the same thing from different endpoints. It is the same
 * code, in one place, with the four bugs it already fixed still fixed.
 */
export default function News() {
    return (
        <Screen>
            <ArticleFeed
                above={<Masthead />}
                fetchPage={getNews}
                eyebrow="Everything"
                title="News"
                errorText="Could not load the news."
            />
        </Screen>
    );
}
