import { router, useLocalSearchParams } from 'expo-router';
import { useCallback } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ArticleFeed } from '@/components/ArticleFeed';
import { Screen } from '@/components/Screen';
import { getSection, isSection, SECTIONS } from '@/lib/content';
import { colors, font, size, space, TOUCH_TARGET } from '@/theme/tokens';

/**
 * One section: News, Reviews, Tech or Guides.
 *
 * A pushed screen rather than a mode of the Feed tab, which is how the site
 * has it — `/latest` is the tab and these four are pages of their own. Folding
 * them into the tab would mean a tab whose contents depend on how you last
 * arrived at it, and no way to tell from looking.
 */
export default function Section() {
    const { slug } = useLocalSearchParams<{ slug: string }>();

    const valid = isSection(slug);
    const meta = valid ? SECTIONS[slug] : null;

    const fetchPage = useCallback(
        (page: number, signal?: AbortSignal) => getSection(slug as never, page, signal),
        [slug]
    );

    const bar = (
        <View style={styles.bar}>
            <Pressable
                onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/news'))}
                hitSlop={12}
                style={styles.barButton}
                accessibilityRole="button"
                accessibilityLabel="Back"
            >
                <Text style={styles.barGlyph}>‹</Text>
            </Pressable>
            <Text style={styles.barTitle}>{meta?.title ?? 'Section'}</Text>
            <View style={styles.barButton} />
        </View>
    );

    /*
     * A slug that is not one of the four. It cannot happen from the menu, and
     * it can happen from a deep link somebody typed — so it says so rather
     * than spinning against an endpoint that will 404.
     */
    if (!valid || !meta) {
        return (
            <Screen>
                {bar}
                <Text style={styles.missing}>There is no section by that name.</Text>
            </Screen>
        );
    }

    return (
        <Screen>
            <ArticleFeed
                above={bar}
                fetchPage={fetchPage}
                eyebrow={meta.eyebrow}
                title={meta.title}
                errorText={`Could not load ${meta.title}.`}
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
    missing: {
        fontFamily: font.body,
        fontSize: size.body,
        color: colors.inkLow,
        padding: space.lg,
    },
});
