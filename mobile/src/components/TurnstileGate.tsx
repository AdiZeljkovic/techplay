import { useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';

import { colors, font, radius, size, space } from '@/theme/tokens';

/**
 * The Turnstile challenge, hosted from our own domain.
 *
 * Cloudflare has no native SDK and the widget validates against the domain it
 * was served from, so this is the supported shape: a WebView pointed at
 * techplay.gg/app-check, which renders nothing but the widget and posts the
 * token back across the bridge.
 *
 * It is drawn rather than hidden. A silent check that fails leaves somebody
 * pressing a button that will not work and no way to see why — which is
 * exactly what happened on the web sign-up page, where a reader in the UK met
 * a permanently grey button because the widget never loaded. If the challenge
 * is what stands between a person and an account, they get to watch it happen.
 */
export function TurnstileGate({
    onToken,
    onFailed,
}: {
    onToken: (token: string) => void;
    onFailed: () => void;
}) {
    const [loading, setLoading] = useState(true);
    const [broken, setBroken] = useState(false);

    /*
     * A remount forces a fresh challenge.
     *
     * Turnstile tokens expire after about five minutes and are single-use, so
     * a form that sat open, or a registration that failed and is being tried
     * again, needs a new one. Changing the key is the whole mechanism.
     */
    const attempt = useRef(0);

    if (broken) {
        return (
            <View style={styles.failed}>
                <Text style={styles.failedText}>
                    The security check could not load. Sign up on techplay.gg instead — it is the
                    same account.
                </Text>
            </View>
        );
    }

    return (
        <View style={styles.frame}>
            {loading && (
                <View style={styles.loading}>
                    <ActivityIndicator color={colors.accentInk} />
                </View>
            )}

            <WebView
                key={attempt.current}
                source={{ uri: 'https://techplay.gg/app-check' }}
                style={styles.web}
                backgroundColor={colors.surface2}
                onLoadEnd={() => setLoading(false)}
                onError={() => { setBroken(true); onFailed(); }}
                onHttpError={() => { setBroken(true); onFailed(); }}
                onMessage={(event) => {
                    try {
                        const payload = JSON.parse(event.nativeEvent.data) as { type: string; token?: string };

                        if (payload.type === 'token' && payload.token) {
                            onToken(payload.token);
                        } else if (payload.type === 'expired') {
                            // Ask for another rather than let a dead token be
                            // sent and rejected by the API with a message
                            // nobody can act on.
                            attempt.current += 1;
                            onFailed();
                        } else if (payload.type === 'error') {
                            setBroken(true);
                            onFailed();
                        }
                    } catch {
                        // Not ours. The bridge carries anything the page
                        // chooses to post, and a malformed line is not a
                        // reason to fail a sign-up.
                    }
                }}
                javaScriptEnabled
                domStorageEnabled
                scrollEnabled={false}
                showsVerticalScrollIndicator={false}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    frame: {
        height: 78,
        borderRadius: radius.card,
        overflow: 'hidden',
        backgroundColor: colors.surface2,
        borderColor: colors.line,
        borderWidth: StyleSheet.hairlineWidth,
    },
    web: { flex: 1, backgroundColor: colors.surface2 },
    loading: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1,
    },
    failed: {
        padding: space.md,
        borderRadius: radius.card,
        backgroundColor: 'rgba(240, 180, 41, 0.10)',
        borderLeftColor: colors.warning,
        borderLeftWidth: 3,
    },
    failedText: {
        fontFamily: font.body,
        fontSize: size.small,
        lineHeight: size.small * 1.5,
        color: colors.inkMid,
    },
});
