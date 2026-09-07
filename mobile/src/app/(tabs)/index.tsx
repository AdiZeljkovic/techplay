import { Image } from 'expo-image';
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

    const lead = home?.hero?.[0] ?? home?.latest_global?.[0] ?? null;

    /*
     * The hero's remaining pieces join the latest rail rather than sitting in
     * one of their own. Five hero slots is an editorial decision made for a
     * carousel a metre wide; on a phone the lead is the lead and the rest are
     * simply recent.
     */
    const latest = dedupe([...(home?.hero ?? []).slice(1), ...(home?.latest_global ?? [])], lead?.id);

    return (
        <Screen>
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
                <View style={styles.masthead}>
                    <View>
                        <Eyebrow tone="accent">TechPlay</Eyebrow>
                        {/* Signed out this is a masthead, signed in a greeting.
                            Neither pretends to be the other. */}
                        <Text style={styles.greeting}>
                            {user?.display_name || user?.username || 'Latest'}
                        </Text>
                    </View>

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

                {error && (
                    <View style={{ paddingHorizontal: space.lg, gap: space.md }}>
                        <Notice text={error} />
                        <Button label="Try again" onPress={() => { setLoading(true); load(); }} variant="quiet" />
                    </View>
                )}

                {lead && <Lead article={lead} />}

                {/*
                  * The quick links band, as the site has it — the four places
                  * somebody might have opened the app to reach, before any
                  * scrolling. On a phone this replaces a navigation menu
                  * nobody would otherwise find.
                  */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.links}
                >
                    <Quick label="Games" onPress={() => router.push('/search')} />
                    <Quick label="Calendar" onPress={() => router.push('/(tabs)/calendar')} />
                    <Quick label="All news" onPress={() => router.push('/(tabs)/news')} />
                    <Quick label={user ? 'Your shelf' : 'Sign in'} onPress={() => router.push(user ? '/library' : '/sign-in')} />
                </ScrollView>

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

/**
 * The lead, and it is allowed to be big.
 *
 * A front page that opens with five equal cards has decided nothing. This one
 * takes the full width and a taller image, because the difference between a
 * lead and the rest is the only thing that makes it a lead.
 */
function Lead({ article }: { article: Article }) {
    return (
        <Pressable
            onPress={() => router.push(`/news/${article.slug}`)}
            style={({ pressed }) => [styles.lead, pressed && { opacity: 0.8 }]}
            accessibilityRole="button"
            accessibilityLabel={article.title}
        >
            {article.featured_image_url && (
                <Image
                    source={{ uri: article.featured_image_url }}
                    style={styles.leadCover}
                    contentFit="cover"
                    transition={160}
                    accessibilityLabel={article.featured_image_alt ?? undefined}
                />
            )}
            <View style={styles.leadBody}>
                {article.category && <Eyebrow tone="accent">{article.category.name}</Eyebrow>}
                <Text style={styles.leadTitle} numberOfLines={3}>{article.title}</Text>
                <Text style={styles.leadMeta}>
                    {[article.published_at_human, article.reading_time].filter(Boolean).join('  ·  ')}
                </Text>
            </View>
        </Pressable>
    );
}

function Quick({ label, onPress }: { label: string; onPress: () => void }) {
    return (
        <Pressable
            onPress={onPress}
            style={({ pressed }) => [styles.quick, pressed && { backgroundColor: colors.surface2 }]}
            accessibilityRole="button"
        >
            <Text style={styles.quickText}>{label}</Text>
        </Pressable>
    );
}

/** The rails overlap by design; a piece must not appear twice on one screen. */
function dedupe(articles: Article[], excludeId?: number): Article[] {
    const seen = new Set<number>(excludeId ? [excludeId] : []);

    return articles.filter((article) => {
        if (seen.has(article.id)) { return false; }

        seen.add(article.id);

        return true;
    });
}

const styles = StyleSheet.create({
    centre: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    content: { gap: space.xl, paddingBottom: space.xxl },
    masthead: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        paddingHorizontal: space.lg,
        paddingTop: space.sm,
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
    searchGlyph: { fontSize: 22, lineHeight: 26, color: colors.inkMid },
    lead: {
        marginHorizontal: space.lg,
        backgroundColor: colors.surface1,
        borderColor: colors.line,
        borderWidth: StyleSheet.hairlineWidth,
        borderRadius: radius.panel,
        overflow: 'hidden',
    },
    leadCover: { width: '100%', height: 210, backgroundColor: colors.surface2 },
    leadBody: { padding: space.lg, gap: space.xs },
    leadTitle: {
        fontFamily: font.display,
        fontSize: 23,
        lineHeight: 28,
        letterSpacing: -0.3,
        color: colors.inkHi,
    },
    leadMeta: { fontFamily: font.mono, fontSize: size.caption, color: colors.inkLow, marginTop: 2 },
    links: { paddingHorizontal: space.lg, gap: space.sm },
    quick: {
        height: 38,
        paddingHorizontal: 16,
        borderRadius: radius.card,
        borderColor: colors.lineStrong,
        borderWidth: StyleSheet.hairlineWidth,
        alignItems: 'center',
        justifyContent: 'center',
    },
    quickText: {
        fontFamily: font.display,
        fontSize: 11,
        letterSpacing: 1.1,
        textTransform: 'uppercase',
        color: colors.inkMid,
    },
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
