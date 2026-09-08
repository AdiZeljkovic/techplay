import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';

import { CatalogueFilters } from '@/components/CatalogueFilters';
import {
    ArrowDownUpMark,
    CalendarDaysMark,
    CheckMark,
    SearchMark,
    SlidersHorizontalMark,
    SparklesMark,
    StarMark,
    TrendingUpMark,
    type MarkProps,
} from '@/components/Marks';
import { Masthead } from '@/components/Masthead';
import { Button } from '@/components/Button';
import { Notice, Screen } from '@/components/Screen';
import {
    activeCount,
    getGames,
    getHub,
    NO_FILTERS,
    releaseYear,
    SHELVES,
    SORTS,
    type CatalogueGame,
    type Filters,
    type Hub,
} from '@/lib/catalogue';
import { colors, font, radius, space, TOUCH_TARGET } from '@/theme/tokens';

/**
 * The Game Database.
 *
 * This tab was the article-and-game search screen: a text field and a list of
 * results. A catalogue you can only reach by already knowing what you want is
 * not a catalogue, it is a lookup — and it meant the largest thing TechPlay has,
 * 333,198 games, had no way in from the app at all.
 *
 * The site's page is the shape this follows: the count in the heading, a search
 * field, four ways in, a facet filter and a grid of covers. The search screen it
 * replaced is not gone — it went back to being pushed from the masthead, where
 * it also searches articles, which a games catalogue does not.
 *
 * The route is `/catalogue`, not `/games`, and that is not cosmetic. A tab file
 * named `games.tsx` claims `/games`, which shadowed `/games/[slug]` — every
 * cover in this very grid stopped opening, and `techplay://games/<slug>` landed
 * back here. `app.json` declares an Android intent filter on
 * `techplay.gg/games`, so that also silently broke every shared game link into
 * the app. The tab is still labelled Games; only the path moved.
 */
const SHELF_MARKS: Record<string, (p: MarkProps) => React.JSX.Element> = {
    '-rating': StarMark,
    '-released': SparklesMark,
    upcoming: CalendarDaysMark,
    '-popularity': TrendingUpMark,
};

/** Three across at 390px leaves a cover wide enough to read its art. */
const COLUMNS = 3;

export default function Games() {
    const [hub, setHub] = useState<Hub | null>(null);
    const [filters, setFilters] = useState<Filters>(NO_FILTERS);
    const [typed, setTyped] = useState('');

    const [games, setGames] = useState<CatalogueGame[]>([]);
    const [count, setCount] = useState<number | null>(null);
    const [more, setMore] = useState(false);
    const [page, setPage] = useState(1);

    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [sheet, setSheet] = useState<'filters' | 'sort' | null>(null);

    const fetching = useRef(false);

    useEffect(() => {
        const controller = new AbortController();

        getHub(controller.signal).then(setHub).catch(() => {
            // The hub only supplies facets and a count. Without it the grid
            // still works; the filter sheet is simply empty rather than the
            // screen being broken.
        });

        return () => controller.abort();
    }, []);

    /* Typing must not fire a query per keystroke against 333,198 rows. */
    useEffect(() => {
        const timer = setTimeout(() => {
            setFilters((f) => (f.search === typed.trim() ? f : { ...f, search: typed.trim() }));
        }, 350);

        return () => clearTimeout(timer);
    }, [typed]);

    /*
     * The eras live in a ref, not in `load`'s dependencies.
     *
     * They arrive from `/games/hub`, a second or so after the first grid
     * request has already gone out. As a dependency they rebuilt `load`, which
     * re-ran the effect, which aborted the in-flight request — and the
     * `fetching` guard then swallowed the replacement, because the abort had
     * not rejected yet. What was left on screen was the abort, reported as
     * "No connection", on a screen whose heading had just counted 333,198
     * games out of the same network.
     *
     * They are only read at request time, and only when an era is chosen —
     * which cannot happen before the hub has loaded, since the filter sheet is
     * what sets it.
     */
    const eras = useRef<Hub['facets']['eras'] | undefined>(undefined);

    eras.current = hub?.facets.eras;

    const load = useCallback(async (target: number, mode: 'replace' | 'append', signal?: AbortSignal) => {
        if (fetching.current) { return; }

        fetching.current = true;

        try {
            const result = await getGames(filters, target, eras.current, signal);

            setGames((current) =>
                mode === 'replace'
                    ? result.results
                    : [...current, ...result.results.filter((g) => !current.some((c) => c.id === g.id))]
            );

            setCount(result.count);
            // `next` is the end marker here — this endpoint sends no last_page.
            setMore(!!result.next);
            setPage(target);
            setError(null);
        } catch (e) {
            // A request this screen cancelled is not a failure to report. The
            // client turns every aborted fetch into an OfflineError, so the
            // signal is the only thing that can tell the two apart.
            if (!signal?.aborted) {
                setError(e instanceof Error ? e.message : 'Could not load the catalogue.');
            }
        } finally {
            fetching.current = false;
            setLoading(false);
            setLoadingMore(false);
        }
    }, [filters]);

    // Any change of question starts over: page four of Action is not page four
    // of Everything, and appending across a change mixes the two.
    useEffect(() => {
        const controller = new AbortController();

        setLoading(true);
        setGames([]);
        load(1, 'replace', controller.signal);

        return () => controller.abort();
    }, [load]);

    const chosen = activeCount(filters);
    const sortLabel = useMemo(
        () => SORTS.find((s) => s.value === filters.sort)?.label ?? 'Sort',
        [filters.sort]
    );

    const header = (
        <View style={styles.head}>
            <View style={styles.hero}>
                <Text style={styles.heroTitle}>
                    Game <Text style={{ color: colors.accentInk }}>Database</Text>
                </Text>
                <Text style={styles.heroText}>
                    {hub
                        ? `Discover, explore and track ${hub.stats.games.toLocaleString()} games across every generation.`
                        : 'Discover, explore and track games across every generation.'}
                </Text>

                <View style={styles.search}>
                    <SearchMark size={16} color={colors.inkFaint} />
                    <TextInput
                        style={styles.input}
                        value={typed}
                        onChangeText={setTyped}
                        placeholder="Search games, genres, platforms…"
                        placeholderTextColor={colors.inkFaint}
                        autoCorrect={false}
                        autoCapitalize="none"
                        returnKeyType="search"
                        clearButtonMode="while-editing"
                    />
                </View>
            </View>

            {/* Four ways in, for anyone who arrived without a title in mind. */}
            <View style={styles.shelves}>
                {SHELVES.map((shelf) => {
                    const Mark = SHELF_MARKS[shelf.key];
                    const on = shelf.key === 'upcoming'
                        ? filters.status === 'upcoming'
                        : filters.status === 'all' && filters.sort === shelf.key;

                    return (
                        <Pressable
                            key={shelf.key}
                            onPress={() => setFilters((f) => (
                                shelf.key === 'upcoming'
                                    ? { ...f, status: 'upcoming', sort: 'released' }
                                    : { ...f, status: 'all', sort: shelf.key }
                            ))}
                            style={({ pressed }) => [styles.shelf, on && styles.shelfOn, pressed && !on && { borderColor: colors.lineStrong }]}
                            accessibilityRole="button"
                            accessibilityState={{ selected: on }}
                        >
                            <Mark size={30} stroke={1.3} color={colors.accent} />
                            <Text style={styles.shelfTitle}>{shelf.title}</Text>
                            <Text style={styles.shelfLine} numberOfLines={2}>{shelf.line}</Text>

                            {/* Which way in you took is not obvious from a grid
                                that only ever reorders itself, so the tile says
                                it — the site draws the same rule. */}
                            {on && <View style={styles.shelfRule} />}
                        </Pressable>
                    );
                })}
            </View>

            <View style={styles.controls}>
                <Pressable
                    onPress={() => setSheet('filters')}
                    style={({ pressed }) => [styles.control, pressed && { backgroundColor: colors.fill2 }]}
                    accessibilityRole="button"
                    accessibilityLabel={chosen > 0 ? `Filters, ${chosen} applied` : 'Filters'}
                >
                    <SlidersHorizontalMark size={14} color={colors.accent} />
                    <Text style={styles.controlText}>Filters</Text>
                    {chosen > 0 && (
                        <View style={styles.pip}><Text style={styles.pipText}>{chosen}</Text></View>
                    )}
                </Pressable>

                <Pressable
                    onPress={() => setSheet('sort')}
                    style={({ pressed }) => [styles.control, pressed && { backgroundColor: colors.fill2 }]}
                    accessibilityRole="button"
                    accessibilityLabel={`Sort, ${sortLabel}`}
                >
                    <ArrowDownUpMark size={14} color={colors.accent} />
                    <Text style={styles.controlText}>{sortLabel}</Text>
                </Pressable>
            </View>

            {count !== null && !loading && (
                <Text style={styles.count}>
                    {count.toLocaleString()} {count === 1 ? 'game' : 'games'}
                </Text>
            )}
        </View>
    );

    return (
        <Screen>
            <Masthead />

            <FlatList
                data={games}
                key={COLUMNS}
                numColumns={COLUMNS}
                keyExtractor={(item) => String(item.id)}
                columnWrapperStyle={styles.row}
                contentContainerStyle={styles.list}
                ListHeaderComponent={header}
                ListEmptyComponent={
                    loading ? (
                        <ActivityIndicator color={colors.accentInk} style={{ marginTop: space.xxl }} />
                    ) : error ? (
                        <View style={{ gap: space.lg }}>
                            <Notice text={error} />
                            <Button label="Try again" onPress={() => { setLoading(true); load(1, 'replace'); }} variant="quiet" />
                        </View>
                    ) : (
                        <Text style={styles.empty}>
                            Nothing matches that. Try fewer filters, or a different spelling.
                        </Text>
                    )
                }
                onEndReachedThreshold={0.7}
                onEndReached={() => {
                    if (more && !loadingMore && !fetching.current && games.length > 0) {
                        setLoadingMore(true);
                        load(page + 1, 'append');
                    }
                }}
                ListFooterComponent={
                    loadingMore
                        ? <ActivityIndicator color={colors.accentInk} style={{ marginVertical: space.lg }} />
                        : null
                }
                renderItem={({ item }) => <Cover game={item} />}
            />

            {sheet === 'filters' && (
                <CatalogueFilters
                    hub={hub}
                    value={filters}
                    onChange={setFilters}
                    onClose={() => setSheet(null)}
                />
            )}

            {sheet === 'sort' && (
                <SortSheet
                    value={filters.sort}
                    onPick={(sort) => { setFilters((f) => ({ ...f, sort })); setSheet(null); }}
                    onClose={() => setSheet(null)}
                />
            )}
        </Screen>
    );
}

function Cover({ game }: { game: CatalogueGame }) {
    const year = releaseYear(game.released);
    const rating = Number(game.rating);

    return (
        <Pressable
            onPress={() => router.push(`/games/${game.slug}` as never)}
            style={({ pressed }) => [styles.tile, pressed && { opacity: 0.75 }]}
            accessibilityRole="button"
            accessibilityLabel={game.name}
        >
            <View style={styles.art}>
                {game.cover_url && (
                    <Image
                        source={{ uri: game.cover_url }}
                        style={styles.artImage}
                        contentFit="cover"
                        transition={140}
                    />
                )}

                {Number.isFinite(rating) && rating > 0 && (
                    <View style={styles.rating}>
                        <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
                    </View>
                )}
            </View>

            <Text style={styles.name} numberOfLines={2}>{game.name}</Text>
            {year && <Text style={styles.year}>{year}</Text>}
        </Pressable>
    );
}

function SortSheet({
    value,
    onPick,
    onClose,
}: {
    value: string;
    onPick: (value: string) => void;
    onClose: () => void;
}) {
    return (
        <Modal visible transparent animationType="slide" onRequestClose={onClose}>
            <Pressable style={styles.scrim} onPress={onClose} accessibilityLabel="Close" />

            <View style={styles.sortSheet}>
                <View style={styles.grabber} />
                <Text style={styles.sortHeading}>Sort by</Text>

                {SORTS.map((s) => {
                    const on = s.value === value;

                    return (
                        <Pressable
                            key={s.value}
                            onPress={() => onPick(s.value)}
                            style={({ pressed }) => [styles.sortRow, pressed && { backgroundColor: colors.surface2 }]}
                            accessibilityRole="button"
                            accessibilityState={{ selected: on }}
                        >
                            <Text style={[styles.sortText, on && { color: colors.inkHi }]}>{s.label}</Text>
                            {on && <CheckMark size={16} color={colors.accentInk} />}
                        </Pressable>
                    );
                })}
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    list: { padding: space.lg, paddingBottom: space.xxl, gap: space.md },
    row: { gap: space.sm },
    head: { gap: space.lg, marginBottom: space.xs },

    hero: { gap: space.sm, paddingTop: space.sm },
    heroTitle: {
        fontFamily: font.display,
        fontSize: 28,
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
    search: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: space.sm,
        height: TOUCH_TARGET,
        paddingHorizontal: space.lg,
        marginTop: space.xs,
        borderRadius: radius.card,
        borderColor: colors.lineStrong,
        borderWidth: StyleSheet.hairlineWidth,
        backgroundColor: colors.surface2,
    },
    input: {
        flex: 1,
        fontFamily: font.body,
        fontSize: 13.5,
        color: colors.inkHi,
        padding: 0,
    },

    shelves: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
    shelf: {
        width: '48%',
        flexGrow: 1,
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: space.md,
        paddingTop: space.lg,
        paddingBottom: 18,
        borderRadius: 14,
        borderColor: colors.line,
        borderWidth: StyleSheet.hairlineWidth,
        backgroundColor: colors.fill1,
        overflow: 'hidden',
    },
    shelfOn: { borderColor: colors.accent, backgroundColor: 'rgba(220, 20, 60, 0.09)' },
    shelfTitle: {
        marginTop: space.sm,
        fontFamily: font.display,
        fontSize: 13,
        color: colors.inkHi,
        textAlign: 'center',
    },
    shelfLine: {
        fontFamily: font.body,
        fontSize: 11,
        lineHeight: 15,
        color: colors.inkLow,
        textAlign: 'center',
    },
    shelfRule: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: 3,
        backgroundColor: colors.accent,
    },

    controls: { flexDirection: 'row', gap: space.sm },
    control: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 7,
        height: 40,
        borderRadius: radius.card,
        borderColor: colors.line,
        borderWidth: StyleSheet.hairlineWidth,
        backgroundColor: colors.surface1,
    },
    controlText: {
        fontFamily: font.display,
        fontSize: 11,
        letterSpacing: 0.8,
        textTransform: 'uppercase',
        color: colors.inkMid,
    },
    pip: {
        minWidth: 16,
        height: 16,
        paddingHorizontal: 4,
        borderRadius: 8,
        backgroundColor: colors.accent,
        alignItems: 'center',
        justifyContent: 'center',
    },
    pipText: { fontFamily: font.display, fontSize: 9, lineHeight: 12, color: colors.inkHi },
    count: {
        fontFamily: font.mono,
        fontSize: 11,
        color: colors.inkFaint,
    },

    tile: { flex: 1 / COLUMNS, gap: 5 },
    art: {
        aspectRatio: 3 / 4,
        borderRadius: radius.card,
        overflow: 'hidden',
        backgroundColor: colors.surface2,
    },
    artImage: { width: '100%', height: '100%' },
    rating: {
        position: 'absolute',
        top: 5,
        right: 5,
        paddingHorizontal: 5,
        paddingVertical: 2,
        borderRadius: radius.inner,
        backgroundColor: 'rgba(5, 7, 10, 0.85)',
        borderColor: colors.accent,
        borderWidth: StyleSheet.hairlineWidth,
    },
    ratingText: { fontFamily: font.display, fontSize: 9, color: colors.accentInk },
    name: {
        fontFamily: font.bodyMedium,
        fontSize: 11,
        lineHeight: 14,
        color: colors.inkMid,
    },
    year: { fontFamily: font.mono, fontSize: 9.5, color: colors.inkFaint },

    empty: {
        fontFamily: font.body,
        fontSize: 13,
        lineHeight: 19,
        color: colors.inkLow,
        textAlign: 'center',
        paddingVertical: space.xxl,
    },

    scrim: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.6)' },
    sortSheet: {
        backgroundColor: colors.surface1,
        borderTopLeftRadius: radius.sheet,
        borderTopRightRadius: radius.sheet,
        borderTopColor: colors.lineStrong,
        borderTopWidth: StyleSheet.hairlineWidth,
        padding: space.lg,
        paddingBottom: space.xxl,
        gap: space.xs,
    },
    grabber: {
        alignSelf: 'center',
        width: 36,
        height: 4,
        borderRadius: 2,
        backgroundColor: colors.lineStrong,
        marginBottom: space.sm,
    },
    sortHeading: {
        fontFamily: font.display,
        fontSize: 10,
        letterSpacing: 1.7,
        textTransform: 'uppercase',
        color: colors.inkLow,
        marginBottom: space.xs,
    },
    sortRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: TOUCH_TARGET,
        paddingHorizontal: space.md,
        borderRadius: radius.card,
    },
    sortText: {
        fontFamily: font.bodyMedium,
        fontSize: 14,
        color: colors.inkMid,
    },
});
