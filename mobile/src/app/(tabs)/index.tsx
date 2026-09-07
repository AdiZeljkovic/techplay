import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Pressable,
    RefreshControl,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import { ArticleCard } from '@/components/ArticleCard';
import { Button } from '@/components/Button';
import { Body, Eyebrow, Notice, Screen } from '@/components/Screen';
import { useAuth } from '@/context/AuthContext';
import { getHome, type Article } from '@/lib/content';
import { colors, font, size, space } from '@/theme/tokens';

/**
 * The feed, and the first screen anybody sees signed in.
 *
 * One list rather than a scroll view of sections: `FlatList` recycles rows,
 * and the mobile-web audit in August found the site's own front page running
 * to ten screens of markup. A phone should not be holding all of that in
 * memory to show the top of it.
 */
export default function Feed() {
    const { user } = useAuth();

    const [articles, setArticles] = useState<Article[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async (signal?: AbortSignal) => {
        try {
            const home = await getHome(signal);

            /*
             * Hero first, then the rest, without repeats.
             *
             * The rails overlap by design on the web — a piece can be in
             * `hero` and in `latest_global` — and a list that shows the same
             * article twice reads as a bug even when the data is right.
             */
            const seen = new Set<number>();
            const ordered: Article[] = [];

            for (const item of [...home.hero, ...home.latest_global, ...home.news, ...home.reviews, ...home.tech]) {
                if (!seen.has(item.id)) {
                    seen.add(item.id);
                    ordered.push(item);
                }
            }

            setArticles(ordered);
            setError(null);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Could not load the feed.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        const controller = new AbortController();
        load(controller.signal);

        return () => controller.abort();
    }, [load]);

    if (loading) {
        return (
            <Screen>
                <View style={styles.centre}>
                    <ActivityIndicator color={colors.accentInk} />
                </View>
            </Screen>
        );
    }

    return (
        <Screen>
            <FlatList
                data={articles}
                keyExtractor={(item) => String(item.id)}
                contentContainerStyle={styles.list}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => { setRefreshing(true); load(); }}
                        tintColor={colors.accentInk}
                    />
                }
                ListHeaderComponent={
                    <View style={styles.header}>
                        <View>
                            <Eyebrow tone="accent">TechPlay</Eyebrow>
                            <Text style={styles.greeting}>
                                {user?.display_name || user?.username || 'Reader'}
                            </Text>
                        </View>
                        {/* Search reaches 333,198 games and 638 articles, and
                            until it existed the only way to any of them was
                            scrolling. It belongs on the first screen. */}
                        <Pressable
                            onPress={() => router.push('/search')}
                            hitSlop={12}
                            style={styles.searchButton}
                            accessibilityRole="button"
                            accessibilityLabel="Search"
                        >
                            <Text style={styles.searchGlyph}>⌕</Text>
                        </Pressable>
                    </View>
                }
                ListEmptyComponent={
                    error ? (
                        <View style={{ gap: space.lg }}>
                            <Notice text={error} />
                            <Button label="Try again" onPress={() => { setLoading(true); load(); }} variant="quiet" />
                        </View>
                    ) : (
                        <Body>Nothing published yet.</Body>
                    )
                }
                renderItem={({ item, index }) => <ArticleCard article={item} lead={index === 0} />}
            />
        </Screen>
    );
}

const styles = StyleSheet.create({
    centre: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    list: { padding: space.lg, gap: space.lg, paddingBottom: space.xxl },
    header: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: space.sm,
    },
    greeting: {
        fontFamily: font.display,
        fontSize: size.title,
        color: colors.inkHi,
        marginTop: 2,
    },
    searchButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 20,
        borderColor: colors.lineStrong,
        borderWidth: StyleSheet.hairlineWidth,
    },
    searchGlyph: {
        fontSize: 22,
        lineHeight: 26,
        color: colors.inkMid,
    },
});
