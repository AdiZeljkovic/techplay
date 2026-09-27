import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Eyebrow } from '@/components/Screen';
import { api } from '@/lib/api';
import { colors, font, radius, size, space } from '@/theme/tokens';

/**
 * What the forum is saying about this game.
 *
 * Asked for only when the game says there is something to ask about. The
 * catalogue is 332,455 games and all but a handful have no thread at all, so
 * a request per game page would be a request that almost always answers with
 * an empty array — and the API meters per person.
 *
 * A thread opens on the site inside the app's own WebView. The app has no
 * forum screens and building one to show a thread that, today, exists for no
 * game at all would be the wrong order to do the work in.
 */

interface Thread {
    id: number;
    title: string;
    slug: string;
    is_pinned: boolean;
    is_locked: boolean;
    posts_count: number;
    category?: { name: string; slug: string } | null;
}

export function GameThreads({ gameSlug, count }: { gameSlug: string; count: number }) {
    const [threads, setThreads] = useState<Thread[] | null>(null);

    useEffect(() => {
        if (count <= 0) return;

        const controller = new AbortController();

        api<Thread[]>(`/games/${gameSlug}/threads`, { auth: false, signal: controller.signal })
            .then((rows) => {
                if (!controller.signal.aborted) setThreads(Array.isArray(rows) ? rows : []);
            })
            .catch(() => {
                /*
                 * Silence, deliberately.
                 *
                 * This is the last section on a page that has already drawn
                 * everything a reader came for. A red notice under the
                 * suggestions for a list of discussions that may well be empty
                 * makes the page look broken over the least important thing on
                 * it.
                 */
            });

        return () => controller.abort();
    }, [gameSlug, count]);

    // Nothing was asked for, or nothing came back.
    if (count <= 0 || !threads || threads.length === 0) return null;

    return (
        <View style={{ gap: space.sm }}>
            <Eyebrow>Community discussion</Eyebrow>

            <View style={{ gap: space.sm }}>
                {threads.slice(0, 5).map((t) => (
                    <Pressable
                        key={t.id}
                        onPress={() =>
                            router.push(
                                `/web?path=${encodeURIComponent(`/forum/thread/${t.slug}`)}&title=${encodeURIComponent(t.title)}`
                            )
                        }
                        style={({ pressed }) => [styles.row, pressed ? { opacity: 0.7 } : null]}
                        accessibilityRole="button"
                        accessibilityLabel={t.title}
                    >
                        <View style={{ flex: 1, gap: 3 }}>
                            <Text style={styles.title} numberOfLines={2}>
                                {t.is_pinned ? '📌  ' : ''}
                                {t.title}
                            </Text>

                            <Text style={styles.meta} numberOfLines={1}>
                                {[
                                    t.category?.name,
                                    `${t.posts_count} ${t.posts_count === 1 ? 'reply' : 'replies'}`,
                                    t.is_locked ? 'locked' : null,
                                ]
                                    .filter(Boolean)
                                    .join('  ·  ')}
                            </Text>
                        </View>
                    </Pressable>
                ))}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    row: {
        padding: space.md,
        borderRadius: radius.card,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: colors.line,
        backgroundColor: colors.surface1,
    },
    title: {
        fontFamily: font.bodyMedium,
        fontSize: size.small,
        lineHeight: size.small * 1.32,
        color: colors.inkHi,
    },
    meta: { fontFamily: font.mono, fontSize: 11, color: colors.inkLow },
});
