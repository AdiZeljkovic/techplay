import { router, useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';

import { Button } from '@/components/Button';
import { Notice, Screen } from '@/components/Screen';
import { api } from '@/lib/api';
import { readerHtml } from '@/lib/readerHtml';
import { colors, font, size, space, TOUCH_TARGET } from '@/theme/tokens';

interface FullArticle {
    title: string;
    slug: string;
    excerpt: string | null;
    content: string;
    featured_image_url: string | null;
    featured_image_alt: string | null;
    published_at_human: string | null;
    reading_time: number | null;
    category: { name: string } | null;
    author: { name?: string | null; username: string } | null;
}

const SITE = 'https://techplay.gg';

export default function ArticleScreen() {
    const { slug } = useLocalSearchParams<{ slug: string }>();

    const [article, setArticle] = useState<FullArticle | null>(null);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async (signal?: AbortSignal) => {
        setError(null);

        try {
            setArticle(await api<FullArticle>(`/news/${slug}`, { auth: false, signal }));
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Could not open this piece.');
        }
    }, [slug]);

    useEffect(() => {
        const controller = new AbortController();
        load(controller.signal);

        return () => controller.abort();
    }, [load]);

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

            {error ? (
                <View style={styles.centre}>
                    <Notice text={error} />
                    <Button label="Try again" onPress={() => load()} variant="quiet" />
                </View>
            ) : !article ? (
                <View style={styles.centre}>
                    <ActivityIndicator color={colors.accentInk} />
                </View>
            ) : (
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
                    style={styles.web}
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
            )}
        </Screen>
    );
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
