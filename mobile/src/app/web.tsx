import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';

import { Screen } from '@/components/Screen';
import { useAuth } from '@/context/AuthContext';
import { getToken } from '@/lib/session';
import { colors, font, size, space, TOUCH_TARGET } from '@/theme/tokens';

/**
 * The parts of TechPlay that do not have a screen here yet.
 *
 * Leaderboard, the Social Hub, Giveaways, Frontiers, the WoW Analyzer, the
 * Backlog Advisor, the GTA 6 hub, The Last Disc, the Shop and Settings are all
 * real, built, working parts of the product with no native version. The choice
 * was to leave them out of the menu or to open them, and leaving them out made
 * an app menu that disagreed with the site's — which is what it did, and it
 * was wrong.
 *
 * They open here rather than in the phone's browser. The difference is not
 * cosmetic: a browser hand-off loses the session, drops the reader out of the
 * app with no way back except the task switcher, and shows them our cookie
 * banner and our header inside somebody else's chrome. This keeps the back
 * arrow, the title and the app around them, and it is honest about being a
 * page rather than pretending to be a screen.
 *
 * Each of these earns a native screen eventually; this is what it looks like
 * until then, not instead of it.
 */
const SITE = 'https://techplay.gg';

/**
 * The site's own chrome, hidden.
 *
 * Without this the reader gets two headers stacked — ours with the back arrow,
 * and the site's with its own back arrow, search and menu — plus the bottom
 * tab bar under the one they already have. Two navigations for one screen is
 * worse than either.
 *
 * `querySelector` returns the first match in document order, which for
 * `header` is the shell's, not a heading inside an article. The interval is
 * because this is a client-rendered app: the chrome mounts after first paint,
 * and again after a route change inside the view. It stops itself.
 *
 * The consent banner is deliberately left alone. Hiding a consent mechanism
 * because it is inconvenient in a frame is not a styling decision.
 */
const HIDE_CHROME = `
(function () {
    var tries = 0;
    var strip = function () {
        [
            document.querySelector('header'),
            document.querySelector('nav[aria-label="Main"]'),
            document.querySelector('footer'),
        ].forEach(function (el) { if (el) { el.style.display = 'none'; } });

        if (++tries > 20) { clearInterval(timer); }
    };
    var timer = setInterval(strip, 250);
    strip();
})();
true;
`;

export default function Web() {
    const { path, title } = useLocalSearchParams<{ path?: string; title?: string }>();
    const { user } = useAuth();

    const [loading, setLoading] = useState(true);
    const [failed, setFailed] = useState(false);
    /*
     * The session, handed across.
     *
     * The app keeps a Sanctum token in SecureStore; the website reads the same
     * kind of token out of `localStorage.token`, with the user beside it. So
     * the page can open signed in rather than showing a leaderboard that does
     * not know who is reading it and a Social Hub that cannot be used at all.
     *
     * Same token, same origin, our own site — this is handing our own key to
     * our own door. It is null until read, and the view waits for it, because
     * injecting after the page has booted is too late: the site's AuthContext
     * reads localStorage once, on mount.
     */
    const [primer, setPrimer] = useState<string | null>(null);
    const view = useRef<WebView>(null);

    useEffect(() => {
        let live = true;

        (async () => {
            const token = await getToken();

            if (!live) { return; }

            const session = token
                ? `try {
                    localStorage.setItem('token', ${JSON.stringify(token)});
                    localStorage.setItem('user', ${JSON.stringify(JSON.stringify(user ?? {}))});
                } catch (e) {}`
                : '';

            setPrimer(`${session}
true;`);
        })();

        return () => { live = false; };
    }, [user]);

    /*
     * An absolute URL is allowed through only for our own hosts. The parameter
     * arrives from a route, and a route can be reached by a deep link — so
     * without this, a crafted `techplay://web?path=https://…` would render
     * somebody else's page inside our frame, wearing our header.
     */
    const raw = path ?? '/';
    const url = /^https?:\/\//.test(raw)
        ? (/^https:\/\/([a-z0-9-]+\.)?techplay\.gg(\/|$)/.test(raw) ? raw : SITE)
        : `${SITE}${raw.startsWith('/') ? raw : `/${raw}`}`;

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

                <Text style={styles.barTitle} numberOfLines={1}>{title ?? 'TechPlay'}</Text>

                <View style={styles.barButton} />
            </View>

            {failed ? (
                <View style={styles.centre}>
                    <Text style={styles.message}>
                        That page would not load. Check your signal and try again.
                    </Text>
                    <Pressable
                        onPress={() => { setFailed(false); setLoading(true); view.current?.reload(); }}
                        style={({ pressed }) => [styles.retry, pressed && { backgroundColor: colors.surface3 }]}
                        accessibilityRole="button"
                    >
                        <Text style={styles.retryText}>Try again</Text>
                    </Pressable>
                </View>
            ) : primer === null ? (
                <View style={styles.centre}>
                    <ActivityIndicator color={colors.accentInk} />
                </View>
            ) : (
                <View style={styles.frame}>
                    <WebView
                        ref={view}
                        source={{ uri: url }}
                        injectedJavaScriptBeforeContentLoaded={primer ?? undefined}
                        injectedJavaScript={HIDE_CHROME}
                        // The page paints its own near-black; the default white
                        // would flash on every open of a dark site.
                        style={styles.web}
                        containerStyle={styles.web}
                        onLoadEnd={() => setLoading(false)}
                        onError={() => { setLoading(false); setFailed(true); }}
                        onHttpError={() => { setLoading(false); setFailed(true); }}
                        allowsBackForwardNavigationGestures
                    />

                    {loading && (
                        <View style={styles.overlay} pointerEvents="none">
                            <ActivityIndicator color={colors.accentInk} />
                        </View>
                    )}
                </View>
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
    frame: { flex: 1 },
    web: { flex: 1, backgroundColor: colors.surface0 },
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.surface0,
    },
    centre: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.lg, padding: space.xl },
    message: {
        fontFamily: font.body,
        fontSize: size.body,
        lineHeight: size.body * 1.5,
        color: colors.inkMid,
        textAlign: 'center',
    },
    retry: {
        height: TOUCH_TARGET,
        paddingHorizontal: space.xl,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.surface2,
        borderColor: colors.lineStrong,
        borderWidth: StyleSheet.hairlineWidth,
    },
    retryText: {
        fontFamily: font.display,
        fontSize: 12,
        letterSpacing: 1.2,
        textTransform: 'uppercase',
        color: colors.inkHi,
    },
});
