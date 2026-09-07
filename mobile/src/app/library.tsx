import { Image } from 'expo-image';
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
import { Body, Eyebrow, Notice, Screen } from '@/components/Screen';
import { useAuth } from '@/context/AuthContext';
import { getShelf, SHELF_FILTERS, SHELF_STATUS, type ShelfEntry, type ShelfStatus } from '@/lib/library';
import { colors, font, radius, size, space, TOUCH_TARGET } from '@/theme/tokens';

/**
 * The shelf, two across.
 *
 * A grid rather than a list because a shelf is looked at, not read — covers
 * carry the recognition and the title is confirmation. Two columns rather
 * than three: at 390pt a third column puts a cover under 110pt wide, and the
 * art stops being readable.
 */
export default function Library() {
    const { user } = useAuth();

    const [entries, setEntries] = useState<ShelfEntry[]>([]);
    const [filter, setFilter] = useState<ShelfStatus | ''>('');
    const [page, setPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /* Same guard as the news list: onEndReached fires several times per scroll. */
    const fetching = useRef(false);

    const load = useCallback(async (
        target: number,
        status: ShelfStatus | '',
        mode: 'replace' | 'append',
        signal?: AbortSignal
    ) => {
        if (!user || fetching.current) { return; }

        fetching.current = true;

        try {
            const result = await getShelf(user.username, { page: target, status }, signal);

            setEntries((current) =>
                mode === 'replace'
                    ? result.items
                    : [...current, ...result.items.filter((e) => !current.some((c) => c.id === e.id))]
            );

            setPage(result.page);
            setLastPage(result.lastPage);
            setError(null);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Could not load your shelf.');
        } finally {
            fetching.current = false;
            setLoading(false);
            setLoadingMore(false);
            setRefreshing(false);
        }
    }, [user]);

    useEffect(() => {
        const controller = new AbortController();
        setLoading(true);
        load(1, filter, 'replace', controller.signal);

        return () => controller.abort();
    }, [load, filter]);

    /*
     * A shelf belongs to somebody. Signed out there is nothing to show and
     * nothing to fetch — so this says what the shelf is for rather than
     * drawing an empty grid with a spinner that never resolves.
     */
    if (!user) {
        return (
            <Screen>
                <View style={styles.guest}>
                    <Eyebrow tone="accent">Your shelf</Eyebrow>
                    <Body>
                        Sign in to keep track of what you are playing, what you have finished, and
                        what is still waiting. Connect Steam and it fills itself.
                    </Body>
                    <Button label="Sign in" onPress={() => router.replace('/sign-in')} style={{ marginTop: space.md }} />
                </View>
            </Screen>
        );
    }

    return (
        <Screen>
            <View style={styles.bar}>
                <Pressable
                    onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/profile'))}
                    hitSlop={12}
                    style={styles.barButton}
                    accessibilityRole="button"
                    accessibilityLabel="Back"
                >
                    <Text style={styles.barGlyph}>‹</Text>
                </Pressable>
                <Text style={styles.barTitle}>Your shelf</Text>
                <View style={styles.barButton} />
            </View>

            {/*
              * Filters as a rail rather than a dropdown.
              *
              * Seven of them, and on a phone a dropdown costs two taps and
              * hides which one is active. A rail shows the current state
              * without being opened, which is what the mobile-web audit found
              * missing across the site in August.
              */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filters}
            >
                {SHELF_FILTERS.map((f) => {
                    const on = filter === f.value;

                    return (
                        <Pressable
                            key={f.value || 'all'}
                            onPress={() => setFilter(f.value)}
                            style={[styles.chip, on && styles.chipOn]}
                            accessibilityRole="button"
                            accessibilityState={{ selected: on }}
                        >
                            <Text style={[styles.chipText, on && styles.chipTextOn]}>{f.label}</Text>
                        </Pressable>
                    );
                })}
            </ScrollView>

            {loading ? (
                <View style={styles.centre}>
                    <ActivityIndicator color={colors.accentInk} />
                </View>
            ) : (
                <FlatList
                    data={entries}
                    keyExtractor={(item) => String(item.id)}
                    numColumns={2}
                    columnWrapperStyle={{ gap: space.md }}
                    contentContainerStyle={styles.grid}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={() => { setRefreshing(true); load(1, filter, 'replace'); }}
                            tintColor={colors.accentInk}
                        />
                    }
                    ListEmptyComponent={
                        error ? (
                            <View style={{ gap: space.lg }}>
                                <Notice text={error} />
                                <Button label="Try again" onPress={() => { setLoading(true); load(1, filter, 'replace'); }} variant="quiet" />
                            </View>
                        ) : (
                            <Body>
                                {filter
                                    ? 'Nothing on this shelf yet.'
                                    : 'Your shelf is empty. Add games on techplay.gg, or connect Steam and let it fill itself.'}
                            </Body>
                        )
                    }
                    onEndReachedThreshold={0.6}
                    onEndReached={() => {
                        if (page < lastPage && !loadingMore && !fetching.current) {
                            setLoadingMore(true);
                            load(page + 1, filter, 'append');
                        }
                    }}
                    ListFooterComponent={
                        loadingMore
                            ? <ActivityIndicator color={colors.accentInk} style={{ marginVertical: space.lg }} />
                            : null
                    }
                    renderItem={({ item }) => <ShelfCard entry={item} />}
                />
            )}
        </Screen>
    );
}

function ShelfCard({ entry }: { entry: ShelfEntry }) {
    const status = SHELF_STATUS[entry.status];
    const hours = entry.hours_played ?? 0;

    /*
     * What this card says under the title, in one line.
     *
     * A replay says which lap it is on; a finished game says how many times,
     * but only once it is more than one — "finished 1×" is noise. Otherwise
     * the hours, if there are any. One fact, chosen, rather than three
     * crammed in.
     */
    const note =
        entry.status === 'replaying'
            ? `${ordinal(entry.playthroughs + 1)} run`
            : entry.playthroughs > 1
                ? `Finished ${entry.playthroughs}×`
                : hours > 0
                    ? `${hours} h`
                    : null;

    return (
        <Pressable
            onPress={() => entry.game && router.push(`/games/${entry.game.slug}`)}
            style={({ pressed }) => [styles.card, pressed && { opacity: 0.7 }]}
            accessibilityRole="button"
            accessibilityLabel={`${entry.game?.name ?? 'Game'}, ${status.label}`}
        >
            <View style={styles.coverWrap}>
                {entry.game?.cover_url ? (
                    <Image
                        source={{ uri: entry.game.cover_url }}
                        style={styles.cover}
                        contentFit="cover"
                        transition={140}
                    />
                ) : (
                    <View style={[styles.cover, styles.coverEmpty]}>
                        <Text style={styles.coverLetter}>
                            {(entry.game?.name ?? '?').charAt(0).toUpperCase()}
                        </Text>
                    </View>
                )}

                <View style={[styles.pip, { backgroundColor: status.color }]} />
            </View>

            <Text style={styles.name} numberOfLines={2}>{entry.game?.name ?? 'Unknown game'}</Text>
            <Text style={[styles.status, { color: status.color }]}>
                {status.label}{note ? `  ·  ${note}` : ''}
            </Text>
        </Pressable>
    );
}

/** "2nd", "8th" — a lap reads as a story, a number reads as a quantity. */
function ordinal(n: number): string {
    const tens = n % 100;

    if (tens >= 11 && tens <= 13) { return `${n}th`; }

    return `${n}${['th', 'st', 'nd', 'rd'][n % 10] ?? 'th'}`;
}

const styles = StyleSheet.create({
    bar: {
        height: TOUCH_TARGET,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: space.sm,
        borderBottomColor: colors.line,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    barButton: { minWidth: TOUCH_TARGET, height: TOUCH_TARGET, alignItems: 'center', justifyContent: 'center' },
    barGlyph: { fontSize: 30, lineHeight: 34, color: colors.inkHi },
    barTitle: {
        fontFamily: font.display,
        fontSize: size.label,
        letterSpacing: 1.4,
        textTransform: 'uppercase',
        color: colors.inkLow,
    },
    filters: {
        paddingHorizontal: space.lg,
        paddingVertical: space.md,
        gap: space.sm,
    },
    chip: {
        height: 34,
        paddingHorizontal: 14,
        borderRadius: radius.card,
        borderColor: colors.lineStrong,
        borderWidth: StyleSheet.hairlineWidth,
        alignItems: 'center',
        justifyContent: 'center',
    },
    chipOn: {
        backgroundColor: colors.accentSoft,
        borderColor: colors.accent,
    },
    chipText: {
        fontFamily: font.display,
        fontSize: 11,
        letterSpacing: 1,
        textTransform: 'uppercase',
        color: colors.inkLow,
    },
    chipTextOn: { color: colors.accentInk },
    centre: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    guest: { flex: 1, justifyContent: 'center', padding: space.xl, gap: space.sm },
    grid: { padding: space.lg, paddingTop: 0, gap: space.md, paddingBottom: space.xxl },
    card: { flex: 1, gap: 6 },
    coverWrap: { position: 'relative' },
    cover: {
        width: '100%',
        aspectRatio: 3 / 4,
        borderRadius: radius.card,
        backgroundColor: colors.surface2,
    },
    coverEmpty: { alignItems: 'center', justifyContent: 'center' },
    coverLetter: { fontFamily: font.display, fontSize: 34, color: colors.inkFaint },
    /* A dot rather than a label over the art: the status is repeated in words
       under the cover, and a badge across somebody's game art is a badge in
       the way of the thing they came to look at. */
    pip: {
        position: 'absolute',
        top: 8,
        left: 8,
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    name: {
        fontFamily: font.bodyMedium,
        fontSize: size.small,
        lineHeight: size.small * 1.3,
        color: colors.inkHi,
    },
    status: {
        fontFamily: font.mono,
        fontSize: 11,
    },
});
