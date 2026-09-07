import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { Body, Eyebrow, Screen } from '@/components/Screen';
import { readIndex, remove } from '@/lib/offline';
import { colors, font, radius, size, space, TOUCH_TARGET } from '@/theme/tokens';

/**
 * What is on the phone.
 *
 * Saving something nobody can find again is the same as not saving it, and a
 * list that cannot be pruned is a phone somebody eventually has to clear by
 * deleting the app.
 */
export default function Saved() {
    const [items, setItems] = useState<{ slug: string; title: string; saved_at: string }[]>([]);

    /*
     * Re-read whenever the screen comes back into view rather than once on
     * mount. Somebody saves an article, presses back, and expects to see it —
     * a list built on mount would still be showing what was there before.
     */
    useFocusEffect(
        useCallback(() => {
            readIndex().then(setItems);
        }, [])
    );

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
                <Text style={styles.barTitle}>Saved</Text>
                <View style={styles.barButton} />
            </View>

            <FlatList
                data={items}
                keyExtractor={(item) => item.slug}
                contentContainerStyle={styles.list}
                ListEmptyComponent={
                    <View style={{ padding: space.lg, gap: space.sm }}>
                        <Eyebrow>Nothing here yet</Eyebrow>
                        <Body>
                            Tap the star on any article to keep it on your phone. Saved pieces open
                            with no signal — on a plane, on the underground, anywhere.
                        </Body>
                    </View>
                }
                renderItem={({ item }) => (
                    <View style={styles.row}>
                        <Pressable
                            onPress={() => router.push(`/news/${item.slug}`)}
                            style={{ flex: 1, gap: 2 }}
                            accessibilityRole="button"
                            accessibilityLabel={item.title}
                        >
                            <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
                            <Text style={styles.date}>
                                Saved {new Date(item.saved_at).toLocaleDateString('en-GB')}
                            </Text>
                        </Pressable>

                        <Pressable
                            onPress={async () => {
                                await remove(item.slug);
                                setItems(await readIndex());
                            }}
                            hitSlop={10}
                            style={styles.remove}
                            accessibilityRole="button"
                            accessibilityLabel={`Remove ${item.title}`}
                        >
                            <Text style={styles.removeGlyph}>✕</Text>
                        </Pressable>
                    </View>
                )}
            />
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
        fontFamily: font.display,
        fontSize: size.label,
        letterSpacing: 1.4,
        textTransform: 'uppercase',
        color: colors.inkLow,
    },
    list: { padding: space.lg, gap: space.sm },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: space.md,
        backgroundColor: colors.surface1,
        borderColor: colors.line,
        borderWidth: StyleSheet.hairlineWidth,
        borderRadius: radius.card,
        padding: space.md,
        minHeight: TOUCH_TARGET,
    },
    title: {
        fontFamily: font.bodyMedium,
        fontSize: size.small,
        lineHeight: size.small * 1.35,
        color: colors.inkHi,
    },
    date: { fontFamily: font.mono, fontSize: 11, color: colors.inkLow },
    remove: {
        width: 36,
        height: 36,
        alignItems: 'center',
        justifyContent: 'center',
    },
    removeGlyph: { fontSize: 16, color: colors.inkLow },
});
