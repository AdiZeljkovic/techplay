import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import { Button } from '@/components/Button';
import { FeaturedSlider } from '@/components/FeaturedSlider';
import { HomeHero } from '@/components/HomeHero';
import { Masthead } from '@/components/Masthead';
import { QuickLinks } from '@/components/QuickLinks';
import { Rail } from '@/components/Rail';
import { Body, Eyebrow, Notice, Screen } from '@/components/Screen';
import { useAuth } from '@/context/AuthContext';
import { getHome, type Article, type Home } from '@/lib/content';
import { colors, font, radius, size, space } from '@/theme/tokens';

/**
 * The front page, with the shape the front page has.
 *
 * The first version of this screen took all six rails the endpoint sends —
 * hero, news, reviews, tech, latest, popular — deduplicated them and drew one
 * flat list of identical cards. It scrolled well and it stopped looking like
 * TechPlay: a front page is an argument about what matters, and a list of
 * forty equal things makes no argument at all.
 *
 * So the sections are back, in the site's own order, changed in shape rather
 * than in substance: stacked vertically on a phone they ran to ten screens
 * before the end, which the mobile-web audit measured in August, so each
 * becomes a rail that is read sideways. A reader sees that Reviews exists
 * without scrolling past it.
 *
 * A ScrollView rather than a FlatList, deliberately. Forty items across six
 * rails is not a list worth virtualising, and each rail virtualises its own
 * row anyway — the ten-screen problem on the web was DOM nodes, which this
 * does not have.
 */
export default function Feed() {
    const { user } = useAuth();

    const [home, setHome] = useState<Home | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async (signal?: AbortSignal) => {
        try {
            setHome(await getHome(signal));
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

    /*
     * The five hero slots are a deck, not a lead and four spares — which is
     * how the site treats them, and why it prints "01 / 05". Flattening them
     * into one card threw away four editorial decisions.
     */
    const featured = home?.hero?.length ? home.hero : (home?.latest_global ?? []).slice(0, 5);

    const latest = dedupe(home?.latest_global ?? [], ...featured.map((a) => a.id));

    return (
        <Screen>
            <Masthead />

            <ScrollView
                contentContainerStyle={styles.content}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => { setRefreshing(true); load(); }}
                        tintColor={colors.accentInk}
                    />
                }
            >
                {/*
                  * The site's own order: the pitch, then what is featured,
                  * then the sections. The app used to open straight into
                  * cards, which is a feed rather than a front page — and left
                  * anybody who arrived without knowing what TechPlay is with
                  * no way to find out.
                  */}
                <HomeHero signedIn={!!user} />

                {error && (
                    <View style={{ paddingHorizontal: space.lg, gap: space.md }}>
                        <Notice text={error} />
                        <Button label="Try again" onPress={() => { setLoading(true); load(); }} variant="quiet" />
                    </View>
                )}

                <FeaturedSlider articles={featured} />

                {/*
                  * The quick links band, as the site has it — the four places
                  * somebody might have opened the app to reach, before any
                  * scrolling. This was a row of bare text pills: the same four
                  * words with none of the reason to tap any of them.
                  */}
                <QuickLinks />

                <Rail title="Latest" articles={latest} />
                <Rail title="Reviews" articles={home?.reviews ?? []} variant="score" />
                <Rail title="Tech" articles={home?.tech ?? []} />

                {/*
                  * Popular is a ranking, so it is drawn as one — numbered rows
                  * down the page rather than another rail. A rail says "here
                  * are some"; a numbered list says "these, in this order",
                  * which is what the data means.
                  */}
                {(home?.popular_global ?? []).length > 0 && (
                    <View style={styles.popular}>
                        <Eyebrow tone="accent">Most read</Eyebrow>

                        {(home?.popular_global ?? []).slice(0, 5).map((article, index) => (
                            <Pressable
                                key={article.id}
                                onPress={() => router.push(`/news/${article.slug}`)}
                                style={({ pressed }) => [styles.rank, pressed && { backgroundColor: colors.surface2 }]}
                                accessibilityRole="button"
                                accessibilityLabel={`${index + 1}. ${article.title}`}
                            >
                                <Text style={styles.rankNumber}>{index + 1}</Text>
                                <Text style={styles.rankTitle} numberOfLines={2}>{article.title}</Text>
                            </Pressable>
                        ))}
                    </View>
                )}

                {!home && !error && <Body style={{ padding: space.lg }}>Nothing published yet.</Body>}
            </ScrollView>
        </Screen>
    );
}

/** The rails overlap by design; a piece must not appear twice on one screen. */
function dedupe(articles: Article[], ...excludeIds: number[]): Article[] {
    const seen = new Set<number>(excludeIds);

    return articles.filter((article) => {
        if (seen.has(article.id)) { return false; }

        seen.add(article.id);

        return true;
    });
}

const styles = StyleSheet.create({
    centre: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    content: { gap: space.xl, paddingBottom: space.xxl },
    popular: { paddingHorizontal: space.lg, gap: space.xs },
    rank: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: space.md,
        paddingVertical: space.md,
        paddingHorizontal: space.sm,
        borderRadius: radius.card,
        borderBottomColor: colors.line,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    rankNumber: {
        fontFamily: font.mono,
        fontSize: 20,
        color: colors.accentInk,
        minWidth: 26,
    },
    rankTitle: {
        flex: 1,
        fontFamily: font.bodyMedium,
        fontSize: size.small,
        lineHeight: size.small * 1.32,
        color: colors.inkHi,
    },
});
