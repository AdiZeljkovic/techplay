import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, View } from 'react-native';

import { ArticleCard } from '@/components/ArticleCard';
import { Button } from '@/components/Button';
import { Body, Eyebrow, Notice, Title } from '@/components/Screen';
import type { Article } from '@/lib/content';
import type { Paged } from '@/lib/paging';
import { colors, space } from '@/theme/tokens';

/**
 * A run of articles, newest first, a page at a time.
 *
 * This was the Feed tab's body and nothing else's. The More sheet then added
 * four section screens that want exactly the same thing from a different
 * endpoint — and the machinery here is not boilerplate, it is four bugs
 * already paid for: the double-fetch guard on `onEndReached`, the de-dupe when
 * a publish shifts every later page by one, keeping what is already read when
 * page four fails, and refresh not fighting append. Copying that five times is
 * copying the bugs' absence and then losing it one file at a time.
 *
 * So the caller passes the fetch and the words, and this owns the rest.
 */
export function ArticleFeed({
    fetchPage,
    eyebrow,
    title,
    emptyText = 'Nothing published yet.',
    errorText = 'Could not load this section.',
    /** Anything that sits above the heading — a masthead, a back bar. */
    above,
}: {
    fetchPage: (page: number, signal?: AbortSignal) => Promise<Paged<Article>>;
    eyebrow: string;
    title: string;
    emptyText?: string;
    errorText?: string;
    above?: React.ReactNode;
}) {
    const [articles, setArticles] = useState<Article[]>([]);
    const [page, setPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /*
     * Guards the end of the list.
     *
     * `onEndReached` fires more than once for a single scroll to the bottom —
     * on layout, on momentum, on the content growing — and without this the
     * same page is fetched three times and appended three times.
     */
    const fetching = useRef(false);

    const load = useCallback(async (target: number, mode: 'replace' | 'append', signal?: AbortSignal) => {
        if (fetching.current) { return; }

        fetching.current = true;

        try {
            const result = await fetchPage(target, signal);

            setArticles((current) =>
                mode === 'replace'
                    ? result.items
                    // A piece published while somebody is scrolling shifts
                    // every later page by one, so the same article can arrive
                    // twice. The list must not show it twice.
                    : [...current, ...result.items.filter((a) => !current.some((c) => c.id === a.id))]
            );

            setPage(result.page);
            setLastPage(result.lastPage);
            setError(null);
        } catch (e) {
            setError(e instanceof Error ? e.message : errorText);
        } finally {
            fetching.current = false;
            setLoading(false);
            setLoadingMore(false);
            setRefreshing(false);
        }
    }, [fetchPage, errorText]);

    useEffect(() => {
        const controller = new AbortController();

        setLoading(true);
        load(1, 'replace', controller.signal);

        return () => controller.abort();
    }, [load]);

    if (loading) {
        return (
            <>
                {above}

                <View style={styles.centre}>
                    <ActivityIndicator color={colors.accentInk} />
                </View>
            </>
        );
    }

    return (
        <>
            {above}

            <FlatList
                data={articles}
                keyExtractor={(item) => String(item.id)}
                contentContainerStyle={styles.list}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => { setRefreshing(true); load(1, 'replace'); }}
                        tintColor={colors.accentInk}
                    />
                }
                ListHeaderComponent={
                    <View style={styles.header}>
                        <Eyebrow tone="accent">{eyebrow}</Eyebrow>
                        <Title>{title}</Title>
                    </View>
                }
                ListEmptyComponent={
                    error ? (
                        <View style={{ gap: space.lg }}>
                            <Notice text={error} />
                            <Button label="Try again" onPress={() => { setLoading(true); load(1, 'replace'); }} variant="quiet" />
                        </View>
                    ) : (
                        <Body>{emptyText}</Body>
                    )
                }
                onEndReachedThreshold={0.6}
                onEndReached={() => {
                    if (page < lastPage && !loadingMore && !fetching.current) {
                        setLoadingMore(true);
                        load(page + 1, 'append');
                    }
                }}
                ListFooterComponent={
                    loadingMore ? (
                        <ActivityIndicator color={colors.accentInk} style={{ marginVertical: space.lg }} />
                    ) : error && articles.length > 0 ? (
                        // A failure part-way down must not wipe what is already
                        // read — the list stays and the message sits under it.
                        <View style={{ gap: space.md, marginTop: space.sm }}>
                            <Notice text={error} />
                            <Button label="Load more" onPress={() => { setLoadingMore(true); load(page + 1, 'append'); }} variant="quiet" />
                        </View>
                    ) : null
                }
                renderItem={({ item }) => <ArticleCard article={item} />}
            />
        </>
    );
}

const styles = StyleSheet.create({
    centre: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    list: { padding: space.lg, gap: space.lg, paddingBottom: space.xxl },
    header: { gap: 2, marginBottom: space.sm },
});
