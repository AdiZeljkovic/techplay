import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Pressable,
    RefreshControl,
    ScrollView,
    SectionList,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import { CommandButton } from '@/components/CommandButton';
import { BellMark, BookmarkMark } from '@/components/Marks';
import { Masthead } from '@/components/Masthead';
import { Body, Eyebrow, Notice, Screen, Title } from '@/components/Screen';
import { useAuth } from '@/context/AuthContext';
import { CancelledError } from '@/lib/api';
import {
    Calendar,
    CalendarSort,
    Release,
    getCalendar,
    platformMarks,
    toggleReminder,
    toggleWishlist,
} from '@/lib/calendar';
import { colors, font, radius, size, space } from '@/theme/tokens';

/**
 * What is coming out, by the day it lands.
 *
 * The reason this belongs in an app rather than only on the site: a release
 * date is a thing you check repeatedly and forget about in between. It is the
 * one screen here with a reason to be opened on a Tuesday when nothing has
 * been published — and it is what push notifications will eventually be for.
 *
 * Until 27 September 2026 it was a list of days and nothing else, while the
 * endpoint had been returning the month's biggest release, the counts, the
 * platform and genre breakdowns, and `wishlisted` and `reminder` on every
 * game all along. The screen was throwing all of it away.
 *
 * The two buttons on each row are the point. Everything above them is a way
 * of getting to them.
 */



const SORTS: { value: CalendarSort; label: string }[] = [
    { value: 'date', label: 'By date' },
    { value: 'anticipated', label: 'Most wanted' },
];

export default function CalendarTab() {
    const { user } = useAuth();

    const [month, setMonth] = useState<string | null>(null);
    const [platform, setPlatform] = useState<string | null>(null);
    const [genre, setGenre] = useState<string | null>(null);
    const [sort, setSort] = useState<CalendarSort>('date');

    const [calendar, setCalendar] = useState<Calendar | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState<string | null>(null);

    const load = useCallback(
        async (signal?: AbortSignal) => {
            try {
                const next = await getCalendar({ month, platform, genre, sort }, signal);

                if (signal?.aborted) return;

                setCalendar(next);
                setError(null);
            } catch (e) {
                /*
                 * A cancelled request is not a broken one.
                 *
                 * A filter tapped twice in a second aborts the first request,
                 * and this screen used to answer that with "No connection".
                 * api.ts tells the two apart now — see CancelledError — so
                 * this is the same check every other screen makes rather than
                 * a signal test only two of them remembered.
                 */
                if (e instanceof CancelledError) return;

                setError(e instanceof Error ? e.message : 'Could not load the calendar.');
            } finally {
                if (!signal?.aborted) {
                    setLoading(false);
                    setRefreshing(false);
                }
            }
        },
        [month, platform, genre, sort]
    );

    useEffect(() => {
        const controller = new AbortController();
        load(controller.signal);

        return () => controller.abort();
    }, [load]);

    /** Both actions need an account, and saying so beats a silent 401. */
    const requireAccount = (): boolean => {
        if (user) return false;

        router.push('/sign-in');

        return true;
    };

    /**
     * The row changes first and the server is asked second.
     *
     * A bookmark that waits for a round trip before it fills reads as a tap
     * that did not register, and the tap most likely to be repeated is the one
     * that looked ignored. On a refusal it goes back exactly where it was.
     */
    const patch = (slug: string, change: Partial<Release>) => {
        setCalendar((c) =>
            c
                ? {
                      ...c,
                      hero: c.hero && c.hero.slug === slug ? { ...c.hero, ...change } : c.hero,
                      most_anticipated: c.most_anticipated.map((g) =>
                          g.slug === slug ? { ...g, ...change } : g
                      ),
                      days: c.days.map((d) => ({
                          ...d,
                          games: d.games.map((g) => (g.slug === slug ? { ...g, ...change } : g)),
                      })),
                  }
                : c
        );
    };

    const onWishlist = async (game: Release) => {
        if (requireAccount() || busy) return;

        const before = game.wishlisted;
        setBusy(game.slug);
        patch(game.slug, { wishlisted: !before, wishlists: game.wishlists + (before ? -1 : 1) });

        try {
            await toggleWishlist(game.slug, before);
        } catch {
            patch(game.slug, { wishlisted: before, wishlists: game.wishlists });
        } finally {
            setBusy(null);
        }
    };

    const onReminder = async (game: Release) => {
        if (requireAccount() || busy) return;

        const before = game.reminder;
        setBusy(game.slug);
        patch(game.slug, { reminder: !before });

        try {
            const settled = await toggleReminder(game.slug);
            patch(game.slug, { reminder: settled });
        } catch {
            patch(game.slug, { reminder: before });
        } finally {
            setBusy(null);
        }
    };

    /*
     * Empty days are dropped.
     *
     * The endpoint returns every day of the month so a grid can draw them.
     * A phone is not a grid — it is a list, and eighteen headings with nothing
     * under them is scrolling through nothing to reach something.
     */
    const sections = (calendar?.days ?? [])
        .filter((d) => d.games.length > 0)
        .map((d) => ({ ...d, data: d.games }));

    const filtered = Boolean(platform || genre);

    return (
        <Screen>
            <Masthead />

            <View style={styles.header}>
                <View style={{ flex: 1 }}>
                    <Eyebrow tone="accent">Coming out</Eyebrow>
                    <Title style={{ fontSize: size.title }}>
                        {calendar ? `${calendar.month.label} ${calendar.month.year}` : 'Calendar'}
                    </Title>
                </View>

                {calendar && (
                    <View style={styles.nav}>
                        <Step
                            back
                            onPress={() => {
                                setLoading(true);
                                setMonth(calendar.month.previous);
                            }}
                        />
                        {!calendar.month.is_current && (
                            <Pressable
                                onPress={() => {
                                    setLoading(true);
                                    setMonth(null);
                                }}
                                hitSlop={8}
                                accessibilityRole="button"
                                accessibilityLabel="This month"
                            >
                                <Text style={styles.today}>Today</Text>
                            </Pressable>
                        )}
                        <Step
                            onPress={() => {
                                setLoading(true);
                                setMonth(calendar.month.next);
                            }}
                        />
                    </View>
                )}
            </View>

            {loading ? (
                <View style={styles.centre}>
                    <ActivityIndicator color={colors.accentInk} />
                </View>
            ) : (
                <SectionList
                    sections={sections}
                    keyExtractor={(item, index) => `${item.slug}-${index}`}
                    contentContainerStyle={styles.list}
                    stickySectionHeadersEnabled={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={() => {
                                setRefreshing(true);
                                load();
                            }}
                            tintColor={colors.accentInk}
                        />
                    }
                    ListHeaderComponent={
                        calendar ? (
                            <View style={{ gap: space.lg, paddingBottom: space.md }}>
                                {/* A failed reload used to be invisible.
                                    ListEmptyComponent carries the error, and it only
                                    renders when there is nothing else — so a filter that
                                    came back 422 left the previous month's list on screen,
                                    looking like a filter that had simply matched
                                    everything. It says so here instead, above the stale
                                    list it is explaining. */}
                                {error ? <Notice text={error} /> : null}

                                {/* The hero is skipped while a filter is on: the month's
                                    biggest release is a fact about the month, and showing
                                    it above four indie titles somebody filtered down to is
                                    answering a question nobody asked. */}
                                {!filtered && calendar.hero ? <Hero game={calendar.hero} /> : null}

                                <Stats stats={calendar.stats} signedIn={Boolean(user)} />

                                <Chips
                                    label="Platform"
                                    options={[
                                        { value: null, label: 'All' },
                                        ...calendar.platform_breakdown.map((p) => ({
                                            value: p.key,
                                            label: `${p.label}  ${p.count}`,
                                        })),
                                    ]}
                                    value={platform}
                                    onChange={(v) => {
                                        setLoading(true);
                                        setPlatform(v);
                                    }}
                                />

                                <Chips
                                    label="Genre"
                                    options={[
                                        { value: null, label: 'All' },
                                        ...calendar.genres.slice(0, 10).map((g) => ({
                                            value: g.name,
                                            label: `${g.name}  ${g.count}`,
                                        })),
                                    ]}
                                    value={genre}
                                    onChange={(v) => {
                                        setLoading(true);
                                        setGenre(v);
                                    }}
                                />

                                <Chips
                                    label="Order"
                                    options={SORTS.map((s) => ({ value: s.value, label: s.label }))}
                                    value={sort}
                                    onChange={(v) => {
                                        setLoading(true);
                                        setSort(v ?? 'date');
                                    }}
                                />
                            </View>
                        ) : null
                    }
                    ListEmptyComponent={
                        error ? (
                            <View style={{ gap: space.lg }}>
                                <Notice text={error} />
                                <CommandButton
                                    label="Try again"
                                    onPress={() => {
                                        setLoading(true);
                                        load();
                                    }}
                                    variant="quiet"
                                />
                            </View>
                        ) : (
                            <Body>
                                {filtered ? 'Nothing matches that here.' : 'Nothing is dated this month.'}
                            </Body>
                        )
                    }
                    renderSectionHeader={({ section }) => (
                        <View style={styles.dayHead}>
                            <Text style={styles.dayNumber}>{String(section.day).padStart(2, '0')}</Text>
                            <View>
                                <Text style={styles.weekday}>{section.weekday}</Text>
                                <Text style={styles.dayCount}>
                                    {section.total} {section.total === 1 ? 'release' : 'releases'}
                                </Text>
                            </View>
                        </View>
                    )}
                    renderItem={({ item }) => (
                        <Row
                            game={item}
                            busy={busy === item.slug}
                            onOpen={() => router.push(`/games/${item.slug}`)}
                            onWishlist={() => onWishlist(item)}
                            onReminder={() => onReminder(item)}
                        />
                    )}
                />
            )}
        </Screen>
    );
}

/**
 * `2026-09-03` is a database field, not a date somebody reads.
 *
 * Built from the parts rather than through `new Date(...)`: a bare
 * `YYYY-MM-DD` is parsed as UTC midnight, so east of Greenwich it renders as
 * the day before. A release dated the 1st showing as the 31st is the kind of
 * wrong that looks like our data is bad.
 */
const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
];

function longDate(iso: string | null): string | null {
    if (!iso) return null;

    const [y, m, d] = iso.slice(0, 10).split('-').map(Number);

    if (!y || !m || !d) return iso;

    return `${d} ${MONTHS[m - 1]} ${y}`;
}

/** The month's biggest release, as the thing you see before the list. */
function Hero({ game }: { game: Release }) {
    return (
        <Pressable
            onPress={() => router.push(`/games/${game.slug}`)}
            style={styles.hero}
            accessibilityRole="button"
            accessibilityLabel={game.name}
        >
            {game.cover_url ? (
                <Image
                    source={{ uri: game.cover_url }}
                    style={styles.heroArt}
                    contentFit="cover"
                    transition={160}
                />
            ) : null}

            <LinearGradient
                colors={['transparent', 'rgba(8,8,10,0.55)', 'rgba(8,8,10,0.96)']}
                locations={[0, 0.45, 1]}
                style={styles.heroVeil}
            />

            <View style={styles.heroCopy}>
                <Text style={styles.heroEyebrow}>Biggest this month</Text>
                <Text style={styles.heroName} numberOfLines={2}>
                    {game.name}
                </Text>
                <Text style={styles.heroMeta}>
                    {[longDate(game.released), game.wishlists > 0 ? `${game.wishlists} waiting` : null]
                        .filter(Boolean)
                        .join('   ·   ')}
                </Text>
            </View>
        </Pressable>
    );
}

function Stats({
    stats,
    signedIn,
}: {
    stats: { releases: number; wishlisted: number; showing: number };
    signedIn: boolean;
}) {
    /* "Showing" only earns a cell when it disagrees with the total — otherwise
       it is the same number twice, which reads as a mistake rather than as a
       filter doing its job. */
    const cells = [
        { value: stats.releases, label: 'this month' },
        stats.showing !== stats.releases ? { value: stats.showing, label: 'showing' } : null,
        signedIn ? { value: stats.wishlisted, label: 'on your list' } : null,
    ].filter(Boolean) as { value: number; label: string }[];

    /* One number does not need a panel around it. A bordered box the width of
       the screen holding a single figure reads as a card with its contents
       missing; the same figure as a line of text reads as a fact. */
    if (cells.length === 1) {
        return (
            <Text style={styles.statLine}>
                <Text style={styles.statLineValue}>{cells[0].value.toLocaleString('en-GB')}</Text>
                {`  releases dated this month`}
            </Text>
        );
    }

    return (
        <View style={styles.stats}>
            {cells.map((c, i) => (
                <View key={c.label} style={[styles.statCell, i > 0 ? styles.statDivide : null]}>
                    <Text style={styles.statValue}>{c.value.toLocaleString('en-GB')}</Text>
                    <Text style={styles.statLabel}>{c.label}</Text>
                </View>
            ))}
        </View>
    );
}

function Chips<T extends string | null>({
    label,
    options,
    value,
    onChange,
}: {
    label: string;
    options: { value: T; label: string }[];
    value: T;
    onChange: (next: T) => void;
}) {
    return (
        <View style={{ gap: space.sm }}>
            <Text style={styles.chipLabel}>{label}</Text>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipRow}
            >
                {options.map((o) => {
                    const on = o.value === value;

                    return (
                        <Pressable
                            key={String(o.value)}
                            onPress={() => onChange(o.value)}
                            style={[styles.chip, on ? styles.chipOn : null]}
                            accessibilityRole="button"
                            accessibilityState={{ selected: on }}
                            accessibilityLabel={o.label}
                        >
                            <Text style={[styles.chipText, on ? styles.chipTextOn : null]} numberOfLines={1}>
                                {o.label}
                            </Text>
                        </Pressable>
                    );
                })}
            </ScrollView>
        </View>
    );
}

function Row({
    game,
    busy,
    onOpen,
    onWishlist,
    onReminder,
}: {
    game: Release;
    busy: boolean;
    onOpen: () => void;
    onWishlist: () => void;
    onReminder: () => void;
}) {
    const marks = platformMarks(game.platforms);

    return (
        <View style={styles.row}>
            <Pressable
                onPress={onOpen}
                style={({ pressed }) => [styles.rowBody, pressed ? { opacity: 0.7 } : null]}
                accessibilityRole="button"
                accessibilityLabel={game.name}
            >
                {game.cover_url ? (
                    <Image
                        source={{ uri: game.cover_url }}
                        style={styles.cover}
                        contentFit="cover"
                        transition={120}
                    />
                ) : (
                    <View style={[styles.cover, styles.coverEmpty]}>
                        <Text style={styles.coverLetter}>{game.name.charAt(0).toUpperCase()}</Text>
                    </View>
                )}

                <View style={{ flex: 1, gap: 3 }}>
                    <Text style={styles.name} numberOfLines={2}>
                        {game.name}
                    </Text>

                    {game.publisher ? (
                        <Text style={styles.meta} numberOfLines={1}>
                            {game.publisher}
                        </Text>
                    ) : null}

                    {marks.length > 0 ? (
                        <View style={styles.marks}>
                            {marks.map((m) => (
                                <Text
                                    key={m.mark}
                                    style={[styles.mark, { color: m.tint, borderColor: m.tint }]}
                                >
                                    {m.mark}
                                </Text>
                            ))}
                        </View>
                    ) : null}
                </View>
            </Pressable>

            {/* Outside the pressable that opens the game, or a tap meant for the
                bell opens a page instead. */}
            <View style={styles.actions}>
                <Action
                    on={game.wishlisted}
                    busy={busy}
                    onPress={onWishlist}
                    label={
                        game.wishlisted
                            ? `Remove ${game.name} from your wishlist`
                            : `Add ${game.name} to your wishlist`
                    }
                >
                    <BookmarkMark size={16} color={game.wishlisted ? colors.accentInk : colors.inkLow} />
                </Action>

                <Action
                    on={game.reminder}
                    busy={busy}
                    onPress={onReminder}
                    label={
                        game.reminder
                            ? `Stop reminding me about ${game.name}`
                            : `Remind me when ${game.name} lands`
                    }
                >
                    <BellMark size={16} color={game.reminder ? colors.accentInk : colors.inkLow} />
                </Action>
            </View>
        </View>
    );
}

function Action({
    on,
    busy,
    onPress,
    label,
    children,
}: {
    on: boolean;
    busy: boolean;
    onPress: () => void;
    label: string;
    children: React.ReactNode;
}) {
    return (
        <Pressable
            onPress={onPress}
            disabled={busy}
            hitSlop={6}
            style={({ pressed }) => [
                styles.action,
                on ? styles.actionOn : null,
                pressed || busy ? { opacity: 0.6 } : null,
            ]}
            accessibilityRole="button"
            accessibilityState={{ selected: on, disabled: busy }}
            accessibilityLabel={label}
        >
            {children}
        </Pressable>
    );
}

function Step({ back = false, onPress }: { back?: boolean; onPress: () => void }) {
    return (
        <Pressable
            onPress={onPress}
            hitSlop={10}
            style={styles.step}
            accessibilityRole="button"
            accessibilityLabel={back ? 'Previous month' : 'Next month'}
        >
            <Text style={styles.stepGlyph}>{back ? '‹' : '›'}</Text>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: space.lg,
        paddingTop: space.sm,
        paddingBottom: space.md,
        gap: space.md,
    },
    nav: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
    step: {
        width: 36,
        height: 36,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: radius.card,
        borderColor: colors.lineStrong,
        borderWidth: StyleSheet.hairlineWidth,
    },
    stepGlyph: { fontSize: 22, lineHeight: 26, color: colors.inkMid },
    today: {
        fontFamily: font.display,
        fontSize: 10,
        letterSpacing: 1.2,
        textTransform: 'uppercase',
        color: colors.accentInk,
    },
    centre: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    list: { paddingHorizontal: space.lg, paddingBottom: space.xxl },

    hero: {
        height: 190,
        borderRadius: radius.card,
        overflow: 'hidden',
        backgroundColor: colors.surface2,
    },
    heroArt: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
    heroVeil: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
    heroCopy: { marginTop: 'auto', padding: space.md, gap: 3 },
    heroEyebrow: {
        fontFamily: font.display,
        fontSize: 9.5,
        letterSpacing: 1.4,
        textTransform: 'uppercase',
        color: colors.accentInk,
    },
    heroName: {
        fontFamily: font.display,
        fontSize: size.lead,
        lineHeight: size.lead * 1.12,
        color: colors.inkHi,
    },
    heroMeta: { fontFamily: font.mono, fontSize: 11, color: colors.inkLow },

    stats: {
        flexDirection: 'row',
        borderRadius: radius.card,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: colors.line,
        backgroundColor: colors.surface1,
    },
    statCell: {
        flex: 1,
        paddingVertical: space.md,
        paddingHorizontal: space.sm,
        alignItems: 'center',
        gap: 2,
    },
    statLine: { fontFamily: font.body, fontSize: 13, color: colors.inkLow, paddingHorizontal: 2 },
    statLineValue: { fontFamily: font.mono, fontSize: size.lead, color: colors.accentInk },
    statDivide: { borderLeftWidth: StyleSheet.hairlineWidth, borderLeftColor: colors.line },
    statValue: { fontFamily: font.mono, fontSize: size.lead, color: colors.accentInk },
    statLabel: {
        fontFamily: font.display,
        fontSize: 9.5,
        letterSpacing: 1.1,
        textTransform: 'uppercase',
        color: colors.inkLow,
    },

    chipLabel: {
        fontFamily: font.display,
        fontSize: 9.5,
        letterSpacing: 1.3,
        textTransform: 'uppercase',
        color: colors.inkFaint,
    },
    chipRow: { gap: space.sm, paddingRight: space.lg },
    chip: {
        paddingHorizontal: space.md,
        paddingVertical: 7,
        borderRadius: radius.inner,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: colors.line,
        backgroundColor: colors.surface1,
    },
    chipOn: { borderColor: colors.accent, backgroundColor: colors.accentSoft },
    chipText: { fontFamily: font.bodyMedium, fontSize: 12, color: colors.inkMid },
    chipTextOn: { color: colors.inkHi },

    dayHead: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: space.md,
        paddingTop: space.lg,
        paddingBottom: space.sm,
        backgroundColor: colors.surface0,
    },
    /* The date leads, in mono, because this list is read down the left edge —
       somebody scanning for "when" wants a column of numbers, not a column of
       titles with dates hidden inside them. */
    dayNumber: {
        fontFamily: font.mono,
        fontSize: 26,
        color: colors.accentInk,
        minWidth: 38,
    },
    weekday: {
        fontFamily: font.display,
        fontSize: size.label,
        letterSpacing: 1.3,
        textTransform: 'uppercase',
        color: colors.inkHi,
    },
    dayCount: { fontFamily: font.mono, fontSize: 11, color: colors.inkLow },

    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: space.sm,
        paddingVertical: space.sm,
        paddingHorizontal: space.sm,
        borderRadius: radius.card,
    },
    rowBody: { flexDirection: 'row', gap: space.md, alignItems: 'center', flex: 1 },
    cover: { width: 42, height: 56, borderRadius: radius.inner, backgroundColor: colors.surface2 },
    coverEmpty: { alignItems: 'center', justifyContent: 'center' },
    coverLetter: { fontFamily: font.display, fontSize: size.lead, color: colors.inkFaint },
    name: {
        fontFamily: font.bodyMedium,
        fontSize: size.small,
        lineHeight: size.small * 1.3,
        color: colors.inkHi,
    },
    meta: { fontFamily: font.mono, fontSize: 11, color: colors.inkLow },
    marks: { flexDirection: 'row', gap: 5, marginTop: 1 },
    mark: {
        fontFamily: font.mono,
        fontSize: 9,
        lineHeight: 13,
        paddingHorizontal: 4,
        borderRadius: 3,
        borderWidth: StyleSheet.hairlineWidth,
        overflow: 'hidden',
    },

    actions: { flexDirection: 'row', gap: 6 },
    action: {
        width: 34,
        height: 34,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: radius.inner,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: colors.line,
        backgroundColor: colors.surface1,
    },
    actionOn: { borderColor: colors.accent, backgroundColor: colors.accentSoft },
});
