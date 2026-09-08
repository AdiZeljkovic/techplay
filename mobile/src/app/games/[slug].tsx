import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Pressable,
    RefreshControl,
    ScrollView,
    Share,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import { Button } from '@/components/Button';
import { ClockMark } from '@/components/Marks';
import { Body, Eyebrow, Notice, Screen, Title } from '@/components/Screen';
import { ShelfPicker } from '@/components/ShelfPicker';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { getShelfEntry, SHELF_STATUS, type ShelfStatus } from '@/lib/library';
import { colors, font, radius, size, space, TOUCH_TARGET } from '@/theme/tokens';

/**
 * Only what this screen draws.
 *
 * The endpoint sends forty fields — critic scores, artworks, player
 * perspectives, languages, time to beat. A phone showing all of it shows
 * nothing, and typing all of it would turn a field somebody trims into a
 * compile error here.
 */
interface Game {
    name: string;
    slug: string;
    description: string | null;
    cover_url: string | null;
    released: string | null;
    rating: number | null;
    techplay_score: number | null;
    genres: string[];
    platforms: string[];
    developers: string[];
    publishers: string[];
    /*
     * Both of these are objects, not scalars — read off the live payload for
     * elden-ring, not guessed. `esrb_rating` typed as a string is what crashed
     * this screen: React was handed `{name: 'M'}` as a Text child and threw
     * "Objects are not valid as a React child". `time_to_beat` did not crash,
     * which is worse — it rendered "[object Object] h" and looked like data.
     */
    time_to_beat: { hastily?: number; normally?: number; completely?: number; count: number } | null;
    esrb_rating: { name: string } | null;
}

const SITE = 'https://techplay.gg';

export default function GameScreen() {
    const { slug } = useLocalSearchParams<{ slug: string }>();
    const { user } = useAuth();

    const [game, setGame] = useState<Game | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);

    /** What this reader has already said about it, or null. */
    const [shelf, setShelf] = useState<ShelfStatus | null>(null);
    const [picking, setPicking] = useState(false);

    const load = useCallback(async (signal?: AbortSignal) => {
        setError(null);

        try {
            setGame(await api<Game>(`/games/${slug}`, { auth: false, signal }));
        } catch (e) {
            /*
             * A purged game answers 410, and that is not the same as a typo.
             * The API's own message says which, and saying "not found" over
             * the top of it would lose the distinction it is careful to make.
             */
            setError(e instanceof Error ? e.message : 'Could not open this game.');
        } finally {
            setRefreshing(false);
        }
    }, [slug]);

    useEffect(() => {
        const controller = new AbortController();
        load(controller.signal);

        return () => controller.abort();
    }, [load]);

    /*
     * The shelf state, asked for separately.
     *
     * It could ride along with the game, but it is the one part of this screen
     * that is about the reader rather than the game — so a signed-out visitor
     * never asks for it, and a failure here leaves the page intact rather than
     * taking it down over a button.
     */
    useEffect(() => {
        if (!user) { return; }

        const controller = new AbortController();

        getShelfEntry(slug, controller.signal)
            .then((entry) => setShelf(entry?.status ?? null))
            .catch(() => { /* The button simply reads "Add to shelf". */ });

        return () => controller.abort();
    }, [slug, user]);

    return (
        <Screen>
            <View style={styles.bar}>
                <Pressable
                    onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))}
                    hitSlop={12}
                    style={styles.barButton}
                    accessibilityRole="button"
                    accessibilityLabel="Back"
                >
                    <Text style={styles.barGlyph}>‹</Text>
                </Pressable>
                <Text style={styles.barTitle} numberOfLines={1}>Game</Text>
                <Pressable
                    onPress={() => game && Share.share({ message: `${game.name}\n${SITE}/games/${game.slug}` })}
                    hitSlop={12}
                    style={styles.barButton}
                    accessibilityRole="button"
                    accessibilityLabel="Share"
                >
                    <Text style={styles.barShare}>Share</Text>
                </Pressable>
            </View>

            {error ? (
                <View style={styles.centre}>
                    <Notice text={error} />
                    <Button label="Try again" onPress={() => load()} variant="quiet" />
                </View>
            ) : !game ? (
                <View style={styles.centre}>
                    <ActivityIndicator color={colors.accentInk} />
                </View>
            ) : (
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
                    <View style={styles.head}>
                        {game.cover_url && (
                            <Image source={{ uri: game.cover_url }} style={styles.cover} contentFit="cover" transition={160} />
                        )}
                        <View style={{ flex: 1, gap: space.xs }}>
                            {game.genres.length > 0 && <Eyebrow tone="accent">{game.genres[0]}</Eyebrow>}
                            <Title style={{ fontSize: size.title }}>{game.name}</Title>
                            <Text style={styles.year}>
                                {[
                                    game.released ? game.released.slice(0, 4) : null,
                                    game.developers[0] ?? null,
                                ].filter(Boolean).join('  ·  ')}
                            </Text>
                        </View>
                    </View>

                    {/*
                      * Two scores, and they are not the same thing.
                      *
                      * `rating` is the catalogue's, out of ten and imported;
                      * `techplay_score` is ours, from our own reviewers. Where
                      * both exist they are labelled, because an unlabelled
                      * number beside another unlabelled number is a reader
                      * guessing which is which.
                      */}
                    {(game.rating || game.techplay_score) && (
                        <View style={styles.scores}>
                            {game.techplay_score != null && (
                                <Score label="TechPlay" value={game.techplay_score} accent />
                            )}
                            {game.rating != null && <Score label="Catalogue" value={game.rating} />}
                        </View>
                    )}

                    {game.description && (
                        <View style={{ gap: space.sm }}>
                            <Eyebrow>About</Eyebrow>
                            {/* The field is HTML from the catalogue. This is a
                                summary rather than an article, so the tags are
                                stripped instead of rendering a second WebView
                                for two paragraphs. */}
                            <Body>{stripTags(game.description)}</Body>
                        </View>
                    )}

                    <TimeToBeat times={game.time_to_beat} />

                    <Facts game={game} />

                    {user ? (
                        <Button
                            label={shelf ? `On your shelf: ${SHELF_STATUS[shelf].label}` : 'Add to your shelf'}
                            onPress={() => setPicking(true)}
                        />
                    ) : (
                        <Body style={styles.footnote}>
                            Sign in to put this on your shelf.
                        </Body>
                    )}

                    <Button
                        label="Open on techplay.gg"
                        variant="quiet"
                        onPress={() => Share.share({ message: `${SITE}/games/${game.slug}` })}
                    />
                </ScrollView>
            )}

            {picking && game && (
                <ShelfPicker
                    slug={game.slug}
                    current={shelf}
                    onChanged={setShelf}
                    onClose={() => setPicking(false)}
                />
            )}
        </Screen>
    );
}

function Score({ label, value, accent = false }: { label: string; value: number; accent?: boolean }) {
    return (
        <View style={styles.score}>
            <Text style={[styles.scoreValue, accent && { color: colors.accentInk }]}>{value}</Text>
            <Eyebrow>{label}</Eyebrow>
        </View>
    );
}

/**
 * How long to beat, in the site's three paces.
 *
 * It used to be one row in the facts table reading "[object Object] h". The
 * payload carries three figures and a report count, and the count is the part
 * that decides whether to believe the rest: three numbers from three people is
 * not the same claim as three from three thousand. The site says so plainly
 * below five reports rather than tucking it into grey, and so does this.
 */
function TimeToBeat({ times }: { times: Game['time_to_beat'] }) {
    if (!times) { return null; }

    const paces = [
        { key: 'hastily' as const, label: 'Rushed', note: 'main story only' },
        { key: 'normally' as const, label: 'Normally', note: 'story and some extras' },
        { key: 'completely' as const, label: 'Completionist', note: 'everything in it' },
    ].filter((p) => times[p.key]);

    if (!paces.length) { return null; }

    const thin = times.count > 0 && times.count < 5;

    return (
        <View style={styles.htb}>
            <View style={styles.htbHead}>
                <ClockMark size={13} color={colors.accent} />
                <Eyebrow>How long to beat</Eyebrow>
                {times.count > 0 && (
                    <View style={[styles.htbCount, thin && styles.htbCountThin]}>
                        <Text style={[styles.htbCountText, thin && { color: colors.warning }]}>
                            {thin
                                ? `only ${times.count} ${times.count === 1 ? 'report' : 'reports'}`
                                : `${times.count.toLocaleString()} players`}
                        </Text>
                    </View>
                )}
            </View>

            <View style={styles.htbRow}>
                {paces.map((pace) => (
                    <View key={pace.key} style={styles.htbPace}>
                        <Text style={styles.htbHours}>{times[pace.key]} h</Text>
                        <Text style={styles.htbLabel}>{pace.label}</Text>
                        <Text style={styles.htbNote}>{pace.note}</Text>
                    </View>
                ))}
            </View>
        </View>
    );
}

function Facts({ game }: { game: Game }) {
    const rows: [string, string][] = [];

    if (game.platforms.length) { rows.push(['Platforms', game.platforms.join(', ')]); }
    if (game.genres.length > 1) { rows.push(['Genres', game.genres.join(', ')]); }
    if (game.developers.length) { rows.push(['Developer', game.developers.join(', ')]); }
    if (game.publishers.length) { rows.push(['Publisher', game.publishers.join(', ')]); }
    if (game.released) { rows.push(['Released', game.released]); }
    if (game.esrb_rating?.name) { rows.push(['Rated', game.esrb_rating.name]); }

    if (!rows.length) { return null; }

    return (
        <View style={styles.facts}>
            {rows.map(([label, value]) => (
                <View key={label} style={styles.fact}>
                    <Text style={styles.factLabel}>{label}</Text>
                    <Text style={styles.factValue}>{value}</Text>
                </View>
            ))}
        </View>
    );
}

/** The catalogue stores descriptions as HTML; this screen wants the words. */
function stripTags(html: string): string {
    return html
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/p>/gi, '\n\n')
        .replace(/<[^>]+>/g, '')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&nbsp;/g, ' ')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}

const styles = StyleSheet.create({
    htb: {
        gap: space.md,
        padding: space.lg,
        borderRadius: 14,
        borderColor: colors.line,
        borderWidth: StyleSheet.hairlineWidth,
        backgroundColor: colors.fill1,
    },
    htbHead: { flexDirection: 'row', alignItems: 'center', gap: space.sm, flexWrap: 'wrap' },
    htbCount: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 5,
        backgroundColor: colors.fill2,
    },
    htbCountThin: {
        backgroundColor: 'rgba(240, 180, 41, 0.10)',
        borderColor: 'rgba(240, 180, 41, 0.25)',
        borderWidth: StyleSheet.hairlineWidth,
    },
    htbCountText: { fontFamily: font.display, fontSize: 9.5, color: colors.inkLow },
    htbRow: { flexDirection: 'row' },
    htbPace: { flex: 1, gap: 1 },
    htbHours: { fontFamily: font.display, fontSize: 19, color: colors.inkHi },
    htbLabel: {
        fontFamily: font.display,
        fontSize: 9.5,
        letterSpacing: 1.1,
        textTransform: 'uppercase',
        color: colors.accentInk,
    },
    htbNote: { fontFamily: font.body, fontSize: 10.5, lineHeight: 14, color: colors.inkLow },
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
        flex: 1,
        textAlign: 'center',
        fontFamily: font.display,
        fontSize: size.label,
        letterSpacing: 1.4,
        textTransform: 'uppercase',
        color: colors.inkLow,
    },
    barShare: { fontFamily: font.bodyMedium, fontSize: size.small, color: colors.accentInk },
    centre: { flex: 1, justifyContent: 'center', padding: space.xl, gap: space.lg },
    content: { padding: space.lg, gap: space.xl, paddingBottom: space.xxl },
    head: { flexDirection: 'row', gap: space.lg },
    cover: {
        width: 104,
        aspectRatio: 3 / 4,
        borderRadius: radius.card,
        backgroundColor: colors.surface2,
    },
    year: { fontFamily: font.mono, fontSize: size.caption, color: colors.inkLow },
    scores: { flexDirection: 'row', gap: space.md },
    score: {
        flex: 1,
        backgroundColor: colors.surface1,
        borderColor: colors.line,
        borderWidth: StyleSheet.hairlineWidth,
        borderRadius: radius.panel,
        padding: space.md,
        gap: 2,
    },
    scoreValue: { fontFamily: font.display, fontSize: size.display, color: colors.inkHi },
    facts: {
        backgroundColor: colors.surface1,
        borderColor: colors.line,
        borderWidth: StyleSheet.hairlineWidth,
        borderRadius: radius.panel,
        overflow: 'hidden',
    },
    fact: {
        paddingVertical: space.md,
        paddingHorizontal: space.lg,
        borderBottomColor: colors.line,
        borderBottomWidth: StyleSheet.hairlineWidth,
        gap: 2,
    },
    factLabel: {
        fontFamily: font.display,
        fontSize: size.label,
        letterSpacing: 1.3,
        textTransform: 'uppercase',
        color: colors.inkLow,
    },
    factValue: { fontFamily: font.body, fontSize: size.small, color: colors.inkHi },
    footnote: { fontSize: size.caption, color: colors.inkLow },
});
