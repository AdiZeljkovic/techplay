import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    Modal,
    Pressable,
    RefreshControl,
    ScrollView,
    Share,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import { CommandButton } from '@/components/CommandButton';
import { ClockMark } from '@/components/Marks';
import { Body, Eyebrow, Notice, Screen, Title } from '@/components/Screen';
import { ShelfPicker } from '@/components/ShelfPicker';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { platformMarks } from '@/lib/calendar';
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
    /** Key art. Wider than a cover and made to sit behind something. */
    artworks?: { image: string; thumbnail_image?: string | null }[] | null;
    /** Plain YouTube URLs. */
    videos?: string[] | null;
}

interface Shot {
    image: string;
    thumbnail_image?: string | null;
    caption?: string | null;
}

interface Suggested {
    slug: string;
    name: string;
    cover_url: string | null;
    released?: string | null;
}

/**
 * The bundle's articles are not shaped like the feed's.
 *
 * `image`, not `featured_image_url` — the field that was assumed, which drew
 * four grey rectangles on the emulator and looked like four images failing to
 * load.
 *
 * `path` is the web section — news, reviews, guides — and is deliberately not
 * used for navigation. The app has one reader screen for all four and reaches
 * any of them by slug; `lib/feed.ts` says the same thing about feed items and
 * is the convention to follow rather than to work around.
 */
interface LinkedArticle {
    slug: string;
    title: string;
    image: string | null;
}

/**
 * One request for the whole screen.
 *
 * `/games/{slug}` answers with the game alone, and the screenshots, the
 * suggestions and the articles were three more calls. The site already learned
 * this the expensive way — its own comment records five of twelve pages
 * failing at fifteen requests a minute once each render fanned out — and the
 * bundle endpoint exists because of it. A phone on a train reopening a game is
 * the same shape of problem with a worse connection.
 */
interface Bundle {
    game: Game;
    screenshots?: Shot[] | null;
    suggested?: Suggested[] | null;
    articles?: LinkedArticle[] | null;
}

const SITE = 'https://techplay.gg';

export default function GameScreen() {
    const { slug } = useLocalSearchParams<{ slug: string }>();
    const { user } = useAuth();

    const [bundle, setBundle] = useState<Bundle | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);

    /** Which screenshot is open full-screen, or null. */
    const [viewing, setViewing] = useState<number | null>(null);

    const game = bundle?.game ?? null;
    const shots = bundle?.screenshots ?? [];
    const suggested = bundle?.suggested ?? [];
    const articles = bundle?.articles ?? [];

    /*
     * Key art if there is any, then a screenshot, then nothing.
     *
     * Not the cover: it is portrait and made to be seen whole, so stretching
     * it across the top crops the title off its own art. A game with neither
     * gets no backdrop rather than a blurred cover, which is a way of saying
     * "we had no picture" that costs a reader a second to decode.
     */
    const backdrop = game?.artworks?.[0]?.image ?? shots[0]?.image ?? null;

    const trailer = (game?.videos ?? []).find((v) => typeof v === 'string' && v.length > 0) ?? null;

    /** What this reader has already said about it, or null. */
    const [shelf, setShelf] = useState<ShelfStatus | null>(null);
    const [picking, setPicking] = useState(false);

    const load = useCallback(async (signal?: AbortSignal) => {
        setError(null);

        try {
            setBundle(await api<Bundle>(`/games/${slug}/bundle`, { auth: false, signal }));
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
                    <CommandButton label="Try again" onPress={() => load()} variant="quiet" />
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
                    {/* Key art behind the title, where the site puts it.

                        Artwork first and a screenshot second: they are
                        different pictures. Key art is drawn to be sat behind
                        something and has room for text; a screenshot is a
                        moment of play and puts a HUD under the headline. */}
                    {backdrop ? (
                        <View style={styles.backdropWrap} pointerEvents="none">
                            <Image source={{ uri: backdrop }} style={styles.backdrop} contentFit="cover" transition={200} />
                            <LinearGradient
                                colors={['rgba(8,8,10,0.35)', 'rgba(8,8,10,0.86)', colors.surface0]}
                                locations={[0, 0.6, 1]}
                                style={styles.backdropVeil}
                            />
                        </View>
                    ) : null}

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

                            <View style={styles.badges}>
                                {platformMarks(game.platforms).map((m) => (
                                    <Text key={m.mark} style={[styles.mark, { color: m.tint, borderColor: m.tint }]}>
                                        {m.mark}
                                    </Text>
                                ))}

                                {/* The age rating carries its own colour on the
                                    site, and it is the one badge here a parent
                                    is actually looking for. */}
                                {game.esrb_rating?.name ? (
                                    <Text style={[styles.mark, styles.esrb]}>{game.esrb_rating.name}</Text>
                                ) : null}
                            </View>
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

                    {/* The trailer, as a link rather than a player.

                        An inline YouTube embed on this screen would be a third
                        WebView on a page that already renders one for nothing
                        else; the system player is better at video than we are
                        and already knows the reader's account. */}
                    {trailer ? (
                        <CommandButton
                            label="Watch the trailer"
                            variant="quiet"
                            onPress={() => WebBrowser.openBrowserAsync(trailer)}
                        />
                    ) : null}

                    {shots.length > 0 ? (
                        <View style={{ gap: space.sm }}>
                            <Eyebrow>Screenshots</Eyebrow>
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={{ gap: space.sm }}
                            >
                                {shots.map((s, i) => (
                                    <Pressable
                                        key={s.image}
                                        onPress={() => setViewing(i)}
                                        accessibilityRole="imagebutton"
                                        accessibilityLabel={s.caption || `Screenshot ${i + 1}`}
                                    >
                                        <Image
                                            source={{ uri: s.thumbnail_image || s.image }}
                                            style={styles.shot}
                                            contentFit="cover"
                                            transition={140}
                                        />
                                    </Pressable>
                                ))}
                            </ScrollView>
                        </View>
                    ) : null}

                    <Facts game={game} />

                    {user ? (
                        <CommandButton
                            label={shelf ? `On your shelf: ${SHELF_STATUS[shelf].label}` : 'Add to your shelf'}
                            onPress={() => setPicking(true)}
                        />
                    ) : (
                        <Body style={styles.footnote}>
                            Sign in to put this on your shelf.
                        </Body>
                    )}

                    <CommandButton
                        label="Open on techplay.gg"
                        variant="quiet"
                        onPress={() => Share.share({ message: `${SITE}/games/${game.slug}` })}
                    />

                    {suggested.length > 0 ? (
                        <View style={{ gap: space.sm }}>
                            <Eyebrow>If you liked this</Eyebrow>
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={{ gap: space.md }}
                            >
                                {suggested.map((s) => (
                                    <Pressable
                                        key={s.slug}
                                        onPress={() => router.push(`/games/${s.slug}`)}
                                        style={({ pressed }) => [styles.suggest, pressed ? { opacity: 0.7 } : null]}
                                        accessibilityRole="button"
                                        accessibilityLabel={s.name}
                                    >
                                        {s.cover_url ? (
                                            <Image source={{ uri: s.cover_url }} style={styles.suggestArt} contentFit="cover" transition={140} />
                                        ) : (
                                            <View style={[styles.suggestArt, { backgroundColor: colors.surface2 }]} />
                                        )}
                                        <Text style={styles.suggestName} numberOfLines={2}>{s.name}</Text>
                                    </Pressable>
                                ))}
                            </ScrollView>
                        </View>
                    ) : null}

                    {articles.length > 0 ? (
                        <View style={{ gap: space.md }}>
                            <Eyebrow>We wrote about it</Eyebrow>

                            {articles.slice(0, 4).map((a) => (
                                <Pressable
                                    key={a.slug}
                                    onPress={() => router.push(`/news/${a.slug}`)}
                                    style={({ pressed }) => [styles.linked, pressed ? { opacity: 0.7 } : null]}
                                    accessibilityRole="button"
                                    accessibilityLabel={a.title}
                                >
                                    {a.image ? (
                                        <Image source={{ uri: a.image }} style={styles.linkedArt} contentFit="cover" transition={120} />
                                    ) : (
                                        <View style={[styles.linkedArt, { backgroundColor: colors.surface2 }]} />
                                    )}
                                    <Text style={styles.linkedTitle} numberOfLines={3}>{a.title}</Text>
                                </Pressable>
                            ))}
                        </View>
                    ) : null}

                    {/* A screenshot, full width, with the rest swipeable.

                        Opening it in the browser was the cheaper option and the
                        wrong one: it hands the reader to Chrome and a back
                        button that leaves the app rather than the picture. */}
                    <Modal
                        visible={viewing !== null}
                        animationType="fade"
                        onRequestClose={() => setViewing(null)}
                        statusBarTranslucent
                    >
                        <View style={styles.viewer}>
                            <ScrollView
                                horizontal
                                pagingEnabled
                                showsHorizontalScrollIndicator={false}
                                contentOffset={{ x: (viewing ?? 0) * Dimensions.get('window').width, y: 0 }}
                            >
                                {shots.map((s) => (
                                    <View key={s.image} style={styles.viewerPage}>
                                        <Image
                                            source={{ uri: s.image }}
                                            style={styles.viewerArt}
                                            contentFit="contain"
                                            transition={160}
                                        />
                                        {s.caption ? <Text style={styles.viewerCaption}>{s.caption}</Text> : null}
                                    </View>
                                ))}
                            </ScrollView>

                            <Pressable
                                onPress={() => setViewing(null)}
                                style={styles.viewerClose}
                                hitSlop={12}
                                accessibilityRole="button"
                                accessibilityLabel="Close"
                            >
                                <Text style={styles.viewerCloseGlyph}>×</Text>
                            </Pressable>
                        </View>
                    </Modal>
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

const VIEWPORT = Dimensions.get('window').width;

const styles = StyleSheet.create({
    backdropWrap: { position: 'absolute', top: 0, left: 0, right: 0, height: 260 },
    backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
    backdropVeil: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },

    badges: { flexDirection: 'row', gap: 5, marginTop: 4, flexWrap: 'wrap' },
    mark: {
        fontFamily: font.mono,
        fontSize: 9,
        lineHeight: 14,
        paddingHorizontal: 5,
        borderRadius: 3,
        borderWidth: StyleSheet.hairlineWidth,
        overflow: 'hidden',
    },
    esrb: { color: colors.warning, borderColor: colors.warning },

    shot: { width: 232, height: 131, borderRadius: radius.inner, backgroundColor: colors.surface2 },

    suggest: { width: 104, gap: 6 },
    suggestArt: { width: 104, height: 139, borderRadius: radius.inner },
    suggestName: { fontFamily: font.bodyMedium, fontSize: 12, lineHeight: 15, color: colors.inkMid },

    linked: { flexDirection: 'row', gap: space.md, alignItems: 'center' },
    linkedArt: { width: 96, height: 60, borderRadius: 8 },
    linkedTitle: {
        flex: 1,
        fontFamily: font.bodyMedium,
        fontSize: size.small,
        lineHeight: size.small * 1.32,
        color: colors.inkHi,
    },

    viewer: { flex: 1, backgroundColor: '#000' },
    /* A column: the picture takes what is left, the caption takes what it
       needs. Two earlier attempts got this wrong in ways only the device
       showed — a fixed 72% frame stranded the caption a third of a screen
       below its image, and an absolutely positioned caption inside a paging
       ScrollView drew itself twice, once at each end. */
    viewerPage: { width: VIEWPORT, flex: 1, flexDirection: 'column' },
    viewerArt: { width: VIEWPORT, flex: 1 },
    viewerCaption: {
        fontFamily: font.body,
        fontSize: 12,
        lineHeight: 18,
        color: colors.inkLow,
        paddingHorizontal: space.lg,
        paddingBottom: space.xl,
        paddingTop: space.md,
        textAlign: 'center',
    },
    viewerClose: {
        position: 'absolute',
        top: 44,
        right: space.lg,
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.55)',
    },
    viewerCloseGlyph: { fontSize: 26, lineHeight: 30, color: '#fff' },

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
