import { router, useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useCallback, useEffect, useState } from 'react';
import { Image } from 'expo-image';
import { ActivityIndicator, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';

import { Comments } from '@/components/Comments';
import { CommandButton } from '@/components/CommandButton';
import { Notice, Screen } from '@/components/Screen';
import { api, OfflineError } from '@/lib/api';
import { isSaved, read as readSaved, remove as removeSaved, save as saveArticle } from '@/lib/offline';
import { readerHtml } from '@/lib/readerHtml';
import { colors, font, size, space, TOUCH_TARGET } from '@/theme/tokens';

interface Related {
    id: number;
    title: string;
    slug: string;
    featured_image_url: string | null;
}

interface FullArticle {
    /**
     * Optional because a copy read off the phone has none.
     *
     * `SavedArticle` stores what is needed to render the piece, and an id is
     * not part of that — so the comment thread, which is keyed on it, is not
     * offered offline. Making this required instead would mean inventing an id
     * for a saved article, and an invented id posts a comment onto somebody
     * else's piece.
     */
    id?: number;
    title: string;
    slug: string;
    related_articles?: Related[] | null;
    excerpt: string | null;
    content: string;
    featured_image_url: string | null;
    featured_image_alt: string | null;
    published_at_human: string | null;
    /** Already formatted by the API: "8 min read". */
    reading_time: string | null;
    category: { name: string } | null;
    author: { name?: string | null; username: string } | null;
}

const SITE = 'https://techplay.gg';

export default function ArticleScreen() {
    const { slug } = useLocalSearchParams<{ slug: string }>();

    const [article, setArticle] = useState<FullArticle | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [saved, setSaved] = useState(false);

    /** Set when the copy on screen came off the phone rather than the network. */
    const [fromDisk, setFromDisk] = useState<string | null>(null);

    /*
     * How tall the article turned out.
     *
     * The reader used to be the whole screen and scrolled itself. Comments and
     * related articles live underneath it now, in one native scroller, so the
     * WebView has to be exactly as tall as its content — two scrollers in one
     * gesture is a page that fights the thumb.
     *
     * The starting height is a guess that keeps the first paint from being an
     * empty strip; the document corrects it as soon as it has laid out, and
     * again whenever an image lands.
     */
    const [webHeight, setWebHeight] = useState(900);

    const load = useCallback(async (signal?: AbortSignal) => {
        setError(null);

        try {
            setArticle(await api<FullArticle>(`/news/${slug}`, { auth: false, signal }));
            setFromDisk(null);
        } catch (e) {
            /*
             * The saved copy is a fallback, not the truth.
             *
             * With a signal the article is fetched fresh every time, because a
             * piece can be corrected after somebody saved it and quietly
             * serving them the stale one is worse than not having saved it at
             * all. Only when the network fails does the phone answer — and the
             * screen says when that copy was taken.
             */
            if (e instanceof OfflineError) {
                const copy = await readSaved(slug);

                if (copy) {
                    setArticle(copy);
                    setFromDisk(copy.saved_at);

                    return;
                }
            }

            setError(e instanceof Error ? e.message : 'Could not open this piece.');
        }
    }, [slug]);

    useEffect(() => {
        const controller = new AbortController();
        load(controller.signal);

        return () => controller.abort();
    }, [load]);

    useEffect(() => { isSaved(slug).then(setSaved); }, [slug]);

    return (
        <Screen>
            {/*
              * Native chrome over a rendered body.
              *
              * Back and share stay outside the WebView on purpose: they must
              * work the instant the screen appears, before any HTML has been
              * parsed, and they must feel like the system's own.
              */}
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

                <Text style={styles.barTitle} numberOfLines={1}>
                    {article?.category?.name ?? 'TechPlay'}
                </Text>

                <Pressable
                    onPress={async () => {
                        if (!article) { return; }

                        if (saved) {
                            await removeSaved(slug);
                            setSaved(false);
                        } else {
                            await saveArticle({ ...article, slug });
                            setSaved(true);
                        }
                    }}
                    hitSlop={12}
                    style={styles.barButton}
                    accessibilityRole="button"
                    accessibilityLabel={saved ? 'Remove from saved' : 'Save for offline'}
                >
                    <Text style={[styles.barSave, saved && { color: colors.accentInk }]}>
                        {saved ? '★' : '☆'}
                    </Text>
                </Pressable>

                <Pressable
                    onPress={() => {
                        if (!article) { return; }

                        // The system sheet, with the canonical URL — what gets
                        // pasted into a chat should open on the web for people
                        // who do not have the app.
                        Share.share({
                            message: `${article.title}\n${SITE}/news/${article.slug}`,
                        });
                    }}
                    hitSlop={12}
                    style={styles.barButton}
                    accessibilityRole="button"
                    accessibilityLabel="Share"
                >
                    <Text style={styles.barShare}>Share</Text>
                </Pressable>
            </View>

            {fromDisk && (
                <View style={styles.offline}>
                    <Text style={styles.offlineText}>
                        Saved copy · {new Date(fromDisk).toLocaleDateString('en-GB')}
                    </Text>
                </View>
            )}

            {error ? (
                <View style={styles.centre}>
                    <Notice text={error} />
                    <CommandButton label="Try again" onPress={() => load()} variant="quiet" />
                </View>
            ) : !article ? (
                <View style={styles.centre}>
                    <ActivityIndicator color={colors.accentInk} />
                </View>
            ) : (
                <ScrollView
                    contentContainerStyle={{ paddingBottom: space.xxl }}
                    showsVerticalScrollIndicator={false}
                >
                <WebView
                    originWhitelist={['*']}
                    source={{
                        html: readerHtml({
                            title: article.title,
                            excerpt: article.excerpt,
                            image: article.featured_image_url,
                            imageAlt: article.featured_image_alt,
                            category: article.category?.name ?? null,
                            author: article.author?.name || article.author?.username || null,
                            published: article.published_at_human,
                            readingTime: article.reading_time,
                            content: article.content,
                        }),
                        baseUrl: SITE,
                    }}
                    style={[styles.web, { height: webHeight }]}
                    /* The document scrolls nothing; the ScrollView around it
                       does. Left on, a drag inside the article would move the
                       WebView's own viewport and the page under it would sit
                       still. */
                    scrollEnabled={false}
                    nestedScrollEnabled={false}
                    onMessage={(event) => {
                        try {
                            const message = JSON.parse(event.nativeEvent.data);

                            if (message?.type === 'height' && Number.isFinite(message.value)) {
                                setWebHeight(Math.max(240, Math.ceil(message.value)));
                            }
                        } catch {
                            // The reader posts nothing else. Anything that is not
                            // ours is not worth a crash.
                        }
                    }}
                    /* Without this the WebView paints white for a frame before
                       the document's own background lands, which on a dark app
                       reads as a flash of broken. */
                    backgroundColor={colors.surface0}
                    /*
                     * A link inside the article opens in the system browser,
                     * not inside the reader. Letting the WebView navigate
                     * would strand somebody on a page with our back button
                     * and none of the site's own chrome.
                     */
                    onShouldStartLoadWithRequest={(request) => {
                        if (request.url === 'about:blank' || request.url.startsWith('data:')) {
                            return true;
                        }

                        WebBrowser.openBrowserAsync(request.url);

                        return false;
                    }}
                    /* An article is text. Nothing here needs to know where the
                       reader is, use the camera, or run in the background. */
                    mediaPlaybackRequiresUserAction
                    allowsInlineMediaPlayback
                    javaScriptEnabled
                    domStorageEnabled={false}
                    showsVerticalScrollIndicator={false}
                />

                {/* Everything the article used to end without.

                    Related first, then the conversation: somebody who finished
                    the piece is more likely to want another one than to want to
                    argue, and the ones who came to argue will scroll past four
                    cards without noticing them. */}
                {(article.related_articles ?? []).length > 0 ? (
                    <View style={styles.after}>
                        <Text style={styles.afterHead}>Read next</Text>

                        <View style={{ gap: space.md }}>
                            {(article.related_articles ?? []).slice(0, 4).map((r) => (
                                <Pressable
                                    key={r.id}
                                    onPress={() => router.push(`/news/${r.slug}`)}
                                    style={({ pressed }) => [styles.related, pressed ? { opacity: 0.7 } : null]}
                                    accessibilityRole="button"
                                    accessibilityLabel={r.title}
                                >
                                    {r.featured_image_url ? (
                                        <Image
                                            source={{ uri: r.featured_image_url }}
                                            style={styles.relatedArt}
                                            contentFit="cover"
                                            transition={120}
                                        />
                                    ) : (
                                        <View style={[styles.relatedArt, { backgroundColor: colors.surface2 }]} />
                                    )}

                                    <Text style={styles.relatedTitle} numberOfLines={3}>
                                        {r.title}
                                    </Text>
                                </Pressable>
                            ))}
                        </View>
                    </View>
                ) : null}

                {/* Offline, the saved copy has no id to hang a thread on — and
                    a comment box with no network behind it is a promise the
                    screen cannot keep. */}
                {!fromDisk && article.id ? (
                    <Comments type="article" id={article.id} title={article.title} />
                ) : null}
                </ScrollView>
            )}
        </Screen>
    );
}

const styles = StyleSheet.create({
    after: { gap: space.md, paddingHorizontal: space.lg, paddingTop: space.xl },
    afterHead: {
        fontFamily: font.display,
        fontSize: size.lead,
        letterSpacing: -0.2,
        color: colors.inkHi,
    },
    related: { flexDirection: 'row', gap: space.md, alignItems: 'center' },
    relatedArt: { width: 96, height: 60, borderRadius: 8 },
    relatedTitle: {
        flex: 1,
        fontFamily: font.bodyMedium,
        fontSize: size.small,
        lineHeight: size.small * 1.32,
        color: colors.inkHi,
    },

    bar: {
        height: TOUCH_TARGET,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: space.sm,
        borderBottomColor: colors.line,
        borderBottomWidth: StyleSheet.hairlineWidth,
        backgroundColor: colors.surface0,
    },
    barButton: {
        minWidth: TOUCH_TARGET,
        height: TOUCH_TARGET,
        alignItems: 'center',
        justifyContent: 'center',
    },
    barGlyph: {
        fontSize: 30,
        lineHeight: 34,
        color: colors.inkHi,
    },
    barTitle: {
        flex: 1,
        textAlign: 'center',
        fontFamily: font.display,
        fontSize: size.label,
        letterSpacing: 1.4,
        textTransform: 'uppercase',
        color: colors.inkLow,
    },
    barShare: {
        fontFamily: font.bodyMedium,
        fontSize: size.small,
        color: colors.accentInk,
    },
    barSave: { fontSize: 20, lineHeight: 24, color: colors.inkLow },
    /* A quiet strip rather than a banner. It is a fact about where the words
       came from, not a warning — the article underneath is still the article. */
    offline: {
        paddingVertical: space.sm,
        paddingHorizontal: space.lg,
        backgroundColor: colors.fill1,
        borderBottomColor: colors.line,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    offlineText: {
        fontFamily: font.mono,
        fontSize: 11,
        color: colors.inkLow,
    },
    web: {
        flex: 1,
        backgroundColor: colors.surface0,
    },
    centre: {
        flex: 1,
        justifyContent: 'center',
        padding: space.xl,
        gap: space.lg,
    },
});
