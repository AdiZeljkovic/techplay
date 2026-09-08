import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CommandButton } from '@/components/CommandButton';
import { SearchMark } from '@/components/Marks';
import { colors, font, radius, size, space, TOUCH_TARGET } from '@/theme/tokens';

/**
 * The pitch, before the news.
 *
 * The site opens with this and the app did not: an eyebrow behind a crimson
 * bar, a two-line headline whose second line is crimson, the catalogue search,
 * and two commands. It is the panel that says what TechPlay is to somebody who
 * arrived without knowing — and on a phone, where there is no navigation to
 * infer it from, that job matters more rather than less.
 *
 * The copy is the site's, not a paraphrase. A product that describes itself
 * two different ways in two places has not decided what it is.
 */
export function HomeHero({ signedIn }: { signedIn: boolean }) {
    return (
        <View style={styles.panel}>
            <View style={styles.eyebrowRow}>
                <View style={styles.eyebrowBar} />
                <Text style={styles.eyebrow}>Gaming, on the record</Text>
            </View>

            <Text style={styles.headline}>
                One library for{'\n'}
                <Text style={{ color: colors.accentInk }}>everything you play.</Text>
            </Text>

            {/*
              * A button shaped like a search field rather than a real input.
              * Typing here would mean a keyboard opening over the front page
              * and a results list with nowhere to go; the search screen is one
              * tap away and does the job properly. The shape is the promise,
              * and it is kept immediately.
              */}
            <Pressable
                onPress={() => router.push('/search')}
                style={({ pressed }) => [styles.search, pressed && { borderColor: colors.accent }]}
                accessibilityRole="search"
                accessibilityLabel="Search the catalogue"
            >
                <SearchMark size={17} color={colors.inkLow} />
                <Text style={styles.searchText}>Search 333,000 games…</Text>
            </Pressable>

            <View style={styles.actions}>
                <CommandButton
                    label={signedIn ? 'Your library' : 'Start your library'}
                    onPress={() => router.push(signedIn ? '/library' : '/register')}
                    behind={colors.surface1}
                />
                <CommandButton
                    label="Browse the catalogue"
                    variant="quiet"
                    onPress={() => router.push('/(tabs)/catalogue')}
                    behind={colors.surface1}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    panel: {
        marginHorizontal: space.lg,
        padding: space.lg,
        gap: space.md,
        backgroundColor: colors.surface1,
        borderColor: colors.line,
        borderWidth: StyleSheet.hairlineWidth,
        borderRadius: radius.panel,
    },
    eyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
    /* The short crimson bar the site puts before this line. Small, and the
       thing that makes it a label rather than a sentence. */
    eyebrowBar: { width: 3, height: 13, backgroundColor: colors.accent },
    eyebrow: {
        fontFamily: font.display,
        fontSize: 10,
        letterSpacing: 2,
        textTransform: 'uppercase',
        color: colors.accentInk,
    },
    headline: {
        fontFamily: font.display,
        fontSize: 27,
        lineHeight: 32,
        letterSpacing: -0.4,
        color: colors.inkHi,
    },
    search: {
        height: TOUCH_TARGET,
        flexDirection: 'row',
        alignItems: 'center',
        gap: space.sm,
        paddingHorizontal: space.lg,
        backgroundColor: colors.surface2,
        borderColor: colors.line,
        borderWidth: StyleSheet.hairlineWidth,
        borderRadius: radius.card,
    },
    searchText: { fontFamily: font.body, fontSize: size.body, color: colors.inkFaint },
    actions: { gap: space.sm },
});
