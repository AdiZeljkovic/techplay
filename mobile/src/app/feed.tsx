import { Image } from 'expo-image';
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

import { Button } from '@/components/Button';
import { Body, Eyebrow, Notice, Screen } from '@/components/Screen';
import { useAuth } from '@/context/AuthContext';
import { getHome, type Article } from '@/lib/content';
import { colors, font, radius, size, space } from '@/theme/tokens';

/**
 * The feed, and the first screen anybody sees signed in.
 *
 * One list rather than a scroll view of sections: `FlatList` recycles rows,
 * and the mobile-web audit in August found the site's own front page running
 * to ten screens of markup. A phone should not be holding all of that in
 * memory to show the top of it.
 */
export default function Feed() {
    const { user, signOut } = useAuth();

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
                        <Pressable
                            onPress={async () => { await signOut(); router.replace('/sign-in'); }}
                            hitSlop={12}
                            accessibilityRole="button"
                            accessibilityLabel="Sign out"
                        >
                            <Text style={styles.signOut}>Sign out</Text>
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
                renderItem={({ item, index }) => <Card article={item} lead={index === 0} />}
            />
        </Screen>
    );
}

function Card({ article, lead }: { article: Article; lead: boolean }) {
    return (
        <Pressable
            style={({ pressed }) => [styles.card, pressed && { backgroundColor: colors.surface2 }]}
            accessibilityRole="button"
            accessibilityLabel={article.title}
        >
            {article.featured_image_url && (
                <Image
                    source={{ uri: article.featured_image_url }}
                    style={[styles.cover, lead && styles.coverLead]}
                    contentFit="cover"
                    /* A grey box while it arrives, not a flash of nothing. */
                    placeholder={{ blurhash: 'L02rjT00000000000000000000' }}
                    transition={160}
                    accessibilityLabel={article.featured_image_alt ?? undefined}
                />
            )}
            <View style={styles.cardBody}>
                {article.category && <Eyebrow tone="accent">{article.category.name}</Eyebrow>}
                <Text style={[styles.cardTitle, lead && styles.cardTitleLead]} numberOfLines={lead ? 4 : 3}>
                    {article.title}
                </Text>
                <Text style={styles.meta}>
                    {[article.published_at_human, article.reading_time ? `${article.reading_time} min` : null]
                        .filter(Boolean)
                        .join('  ·  ')}
                </Text>
            </View>
        </Pressable>
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
    signOut: {
        fontFamily: font.bodyMedium,
        fontSize: size.small,
        color: colors.inkLow,
    },
    card: {
        backgroundColor: colors.surface1,
        borderColor: colors.line,
        borderWidth: StyleSheet.hairlineWidth,
        borderRadius: radius.panel,
        overflow: 'hidden',
    },
    cover: { width: '100%', height: 150, backgroundColor: colors.surface2 },
    coverLead: { height: 210 },
    cardBody: { padding: space.lg, gap: space.xs },
    cardTitle: {
        fontFamily: font.bodySemi,
        fontSize: size.lead,
        lineHeight: size.lead * 1.32,
        color: colors.inkHi,
    },
    cardTitleLead: {
        fontFamily: font.display,
        fontSize: size.title,
        lineHeight: size.title * 1.22,
    },
    meta: {
        fontFamily: font.mono,
        fontSize: size.caption,
        color: colors.inkLow,
        marginTop: 2,
    },
});
