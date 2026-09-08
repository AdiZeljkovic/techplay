import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import { Button } from '@/components/Button';
import { FeedCard } from '@/components/FeedCard';
import {
    BookOpenMark,
    ClockMark,
    CpuMark,
    GamepadMark,
    InfoMark,
    LayersMark,
    NewspaperMark,
    SparklesMark,
    type MarkProps,
} from '@/components/Marks';
import { Masthead } from '@/components/Masthead';
import { Notice, Screen } from '@/components/Screen';
import { useAuth } from '@/context/AuthContext';
import { getFeed, getPersonalFeed, type FeedItem, type FeedPage } from '@/lib/feed';
import { colors, font, radius, space, TOUCH_TARGET } from '@/theme/tokens';

/**
 * The Feed — everything TechPlay publishes, in one stream.
 *
 * This tab read `/news` and titled itself "Everything", which was two things
 * wrong at once: reviews, hardware and guides never appeared in it, and the
 * heading said they did. The site's feed is `/latest`, a different endpoint
 * with a mixed stream, a section filter and a personalised ordering.
 *
 * All three are here now. "For you" is not a different set of articles — the
 * site's own note — it is the same feed in a different order with a line
 * saying why each piece is where it is, which is the part a reader can check.
 *
 * The filter is one scrolling row rather than a wrapped grid, for the reason
 * the web component measured: five sections wrapped into three centred rows on
 * a phone and cost 290px to ask one question. A row costs 60px, stays put
 * while the feed moves under it, and says "there is more this way" with its
 * cut-off edge.
 */
const VIEWS: Array<{ id: 'latest' | 'you'; label: string; Mark: (p: MarkProps) => React.JSX.Element }> = [
    { id: 'latest', label: 'Latest', Mark: ClockMark },
    { id: 'you', label: 'For you', Mark: SparklesMark },
];

const SECTIONS: Array<{ id: string; label: string; Mark: (p: MarkProps) => React.JSX.Element }> = [
    { id: 'all', label: 'Everything', Mark: LayersMark },
    { id: 'news', label: 'News', Mark: NewspaperMark },
    { id: 'reviews', label: 'Reviews', Mark: GamepadMark },
    { id: 'tech', label: 'Tech', Mark: CpuMark },
    { id: 'guides', label: 'Guides', Mark: BookOpenMark },
];

export default function Feed() {
    const { user } = useAuth();

    const [tab, setTab] = useState<'latest' | 'you'>('latest');
    const [section, setSection] = useState('all');

    const [items, setItems] = useState<FeedItem[]>([]);
    const [meta, setMeta] = useState<FeedPage['meta'] | null>(null);
    const [personalised, setPersonalised] = useState<boolean | undefined>(undefined);
    const [interests, setInterests] = useState<string[]>([]);

    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /* `onEndReached` fires more than once per scroll to the bottom. */
    const fetching = useRef(false);

    /** Signing out with "For you" open must not leave a 401 on screen. */
    const mine = tab === 'you' && !!user;

    const load = useCallback(async (page: number, mode: 'replace' | 'append', signal?: AbortSignal) => {
        if (fetching.current) { return; }

        fetching.current = true;

        try {
            const result = mine
                ? await getPersonalFeed(page, signal)
                : await getFeed(section, page, signal);

            setItems((current) =>
                mode === 'replace'
                    ? result.items
                    // A publish while somebody is scrolling shifts every later
                    // page by one, so the same piece can arrive twice.
                    : [...current, ...result.items.filter((i) => !current.some((c) => c.id === i.id))]
            );

            setMeta(result.meta);
            setPersonalised(result.personalised);
            setInterests(result.interests ?? []);
            setError(null);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Could not load the feed.');
        } finally {
            fetching.current = false;
            setLoading(false);
            setLoadingMore(false);
            setRefreshing(false);
        }
    }, [mine, section]);

    // Switching feed or section starts over: page four of Reviews is not page
    // four of Everything, and appending across a change mixes the two.
    useEffect(() => {
        const controller = new AbortController();

        setLoading(true);
        setItems([]);
        load(1, 'replace', controller.signal);

        return () => controller.abort();
    }, [load]);

    const page = meta?.current_page ?? 1;
    const lastPage = meta?.last_page ?? 1;

    const header = (
        <View style={styles.head}>
            {/* Which feed you are reading is the page's first question, so it
                is asked at the top rather than under the cards. */}
            <View style={styles.hero}>
                <Text style={styles.heroTitle}>
                    The <Text style={{ color: colors.accentInk }}>Feed</Text>
                </Text>
                <Text style={styles.heroText}>
                    Everything we publish, in one place — news, reviews, tech and guides as they land.
                </Text>

                <View style={styles.views}>
                    {VIEWS.map((v) => {
                        const on = tab === v.id;

                        return (
                            <Pressable
                                key={v.id}
                                onPress={() => setTab(v.id)}
                                style={({ pressed }) => [
                                    styles.view,
                                    on && styles.viewOn,
                                    pressed && !on && { backgroundColor: colors.surface2 },
                                ]}
                                accessibilityRole="button"
                                accessibilityState={{ selected: on }}
                            >
                                <v.Mark size={14} color={on ? colors.inkHi : colors.inkLow} />
                                <Text style={[styles.viewText, on && { color: colors.inkHi }]}>{v.label}</Text>
                            </Pressable>
                        );
                    })}
                </View>
            </View>

            {tab === 'latest' ? (
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.tabs}
                    style={styles.tabsBox}
                >
                    {SECTIONS.map((s) => {
                        const on = section === s.id;

                        return (
                            <Pressable
                                key={s.id}
                                onPress={() => setSection(s.id)}
                                style={({ pressed }) => [
                                    styles.tab,
                                    on && styles.tabOn,
                                    pressed && !on && { backgroundColor: colors.fill2 },
                                ]}
                                accessibilityRole="button"
                                accessibilityState={{ selected: on }}
                            >
                                <s.Mark size={13} color={on ? colors.inkHi : colors.inkLow} />
                                <Text style={[styles.tabText, on && { color: colors.inkHi }]}>{s.label}</Text>
                            </Pressable>
                        );
                    })}
                </ScrollView>
            ) : (
                <FeedNote
                    user={!!user}
                    personalised={personalised}
                    interests={interests}
                />
            )}
        </View>
    );

    return (
        <Screen>
            <Masthead />

            <FlatList
                data={items}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
                ListHeaderComponent={header}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => { setRefreshing(true); load(1, 'replace'); }}
                        tintColor={colors.accentInk}
                    />
                }
                ListEmptyComponent={
                    loading ? (
                        <ActivityIndicator color={colors.accentInk} style={{ marginTop: space.xxl }} />
                    ) : error ? (
                        <View style={{ gap: space.lg }}>
                            <Notice text={error} />
                            <Button label="Try again" onPress={() => { setLoading(true); load(1, 'replace'); }} variant="quiet" />
                        </View>
                    ) : (
                        <Text style={styles.empty}>Nothing published here yet.</Text>
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
                    items.length === 0 ? null : loadingMore ? (
                        <ActivityIndicator color={colors.accentInk} style={{ marginVertical: space.lg }} />
                    ) : error ? (
                        <View style={{ gap: space.md, marginTop: space.sm }}>
                            <Notice text={error} />
                            <Button label="Load more" onPress={() => { setLoadingMore(true); load(page + 1, 'append'); }} variant="quiet" />
                        </View>
                    ) : page >= lastPage && meta ? (
                        <Text style={styles.done}>
                            That is all {meta.total.toLocaleString()} pieces
                        </Text>
                    ) : null
                }
                renderItem={({ item }) => <FeedCard item={item} />}
            />
        </Screen>
    );
}

/** The line under "For you" that says what it is doing, or why it cannot. */
function FeedNote({
    user,
    personalised,
    interests,
}: {
    user: boolean;
    personalised: boolean | undefined;
    interests: string[];
}) {
    let text: React.ReactNode = null;

    if (!user) {
        text = 'Sign in to get a feed built around what you read.';
    } else if (personalised === false) {
        text = 'Not enough to go on yet — read a few pieces, save what you like, or add games to your collection, and this becomes yours.';
    } else if (interests.length > 0) {
        const named = interests.slice(0, 3).join(', ');
        const rest = interests.length > 3 ? ` and ${interests.length - 3} more` : '';

        text = `Ordered around ${named}${rest} — picked up from what you read and collect.`;
    }

    if (!text) { return null; }

    return (
        <View style={styles.note}>
            <InfoMark size={15} color={colors.accentInk} />
            <Text style={styles.noteText}>{text}</Text>

            {!user && (
                <Pressable
                    onPress={() => router.push('/sign-in')}
                    hitSlop={8}
                    accessibilityRole="button"
                >
                    <Text style={styles.noteLink}>Sign in</Text>
                </Pressable>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    list: { padding: space.lg, gap: space.lg, paddingBottom: space.xxl },
    head: { gap: space.lg },
    hero: { gap: space.sm, paddingTop: space.sm },
    heroTitle: {
        fontFamily: font.display,
        fontSize: 30,
        letterSpacing: -0.4,
        textTransform: 'uppercase',
        color: colors.inkHi,
    },
    heroText: {
        fontFamily: font.body,
        fontSize: 12.5,
        lineHeight: 18,
        color: colors.inkLow,
    },
    views: { flexDirection: 'row', gap: space.sm, marginTop: space.xs },
    view: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 7,
        height: 40,
        paddingHorizontal: 18,
        borderRadius: radius.card,
        borderColor: colors.line,
        borderWidth: StyleSheet.hairlineWidth,
        backgroundColor: colors.surface1,
    },
    viewOn: { backgroundColor: colors.accent, borderColor: colors.accent },
    viewText: {
        fontFamily: font.display,
        fontSize: 11,
        letterSpacing: 1.1,
        textTransform: 'uppercase',
        color: colors.inkLow,
    },
    /* The rail is inset by the list's own padding, so it is pulled back out —
       a filter that stops short of the edge does not read as scrollable. */
    tabsBox: {
        marginHorizontal: -space.lg,
        borderRadius: 12,
    },
    tabs: { paddingHorizontal: space.lg, gap: 6 },
    tab: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 7,
        height: TOUCH_TARGET,
        paddingHorizontal: 16,
        borderRadius: 8,
        backgroundColor: colors.surface1,
    },
    tabOn: { backgroundColor: colors.accent },
    tabText: {
        fontFamily: font.display,
        fontSize: 11,
        letterSpacing: 0.6,
        textTransform: 'uppercase',
        color: colors.inkLow,
    },
    note: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
        padding: 14,
        borderRadius: 10,
        borderColor: colors.line,
        borderWidth: StyleSheet.hairlineWidth,
        backgroundColor: colors.fill1,
    },
    noteText: {
        flex: 1,
        fontFamily: font.body,
        fontSize: 12.5,
        lineHeight: 18,
        color: colors.inkLow,
    },
    noteLink: {
        fontFamily: font.bodySemi,
        fontSize: 12.5,
        color: colors.accentInk,
    },
    empty: {
        fontFamily: font.body,
        fontSize: 13,
        color: colors.inkLow,
        textAlign: 'center',
        paddingVertical: space.xxl,
    },
    done: {
        fontFamily: font.display,
        fontSize: 10.5,
        letterSpacing: 1.1,
        textTransform: 'uppercase',
        color: colors.inkFaint,
        textAlign: 'center',
        marginTop: space.lg,
    },
});
