import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ArrowRightMark, BookmarkMark } from '@/components/Marks';
import { CommandButton } from '@/components/CommandButton';
import { colors, font, radius, space } from '@/theme/tokens';

/**
 * The four doors, as the site draws them.
 *
 * `QuickLinksBand.tsx` gives each destination a panel: its own painted mark, a
 * name, one line saying what is behind the door, and a crimson command button.
 * The app had a row of text pills — the same four words with none of the
 * reason to tap any of them, and nothing of the site's look.
 *
 * The art is the site's own file, bundled. All four together are 80 KB, which
 * is less than one article thumbnail, and each one already carries its own
 * tile and glow — so there is no plate to draw behind it, exactly as the web
 * component's comment says.
 *
 * Two up rather than the site's single column. On a phone the web stacks these
 * full-width and they run past a screen on their own; the same audit that sent
 * the front page's sections sideways applies here. The card is unchanged — it
 * is the grid that differs.
 */
const LINKS = [
    {
        art: require('../../assets/quicklinks/game-database.webp'),
        title: 'Game Database',
        sub: 'Every release, with the detail to decide',
        cta: 'Browse games',
        go: () => router.push('/search'),
    },
    {
        art: require('../../assets/quicklinks/release-calendar.webp'),
        title: 'Release Calendar',
        sub: 'What is coming, and when',
        cta: "See what's next",
        go: () => router.push('/(tabs)/calendar'),
    },
    {
        art: require('../../assets/quicklinks/my-games.webp'),
        title: 'My Games',
        sub: 'Your collection, hours and backlog',
        cta: 'Open your library',
        go: () => router.push('/library'),
    },
    /*
     * The site's fourth door is the forum, and its art is three people under a
     * speech bubble. The app has no forum, and Saved — offline reading, which
     * only the app has — is the honest thing to put in the slot. It does not
     * get the forum's picture: a card that shows a crowd and says "Saved" is
     * worse than one with no picture at all.
     *
     * So it draws its mark instead, thinned to the weight of the painted four
     * so it belongs to the same set. When the forum lands, this becomes the
     * site's fourth card and the file is already in the repo.
     */
    {
        mark: BookmarkMark,
        title: 'Saved',
        sub: 'What you kept to read offline',
        cta: 'Open saved',
        go: () => router.push('/saved'),
    },
];

export function QuickLinks() {
    return (
        <View style={styles.grid}>
            {LINKS.map((link) => (
                <View key={link.title} style={styles.cell}>
                    <Pressable
                        onPress={link.go}
                        style={({ pressed }) => [styles.panel, pressed && { borderColor: colors.lineStrong }]}
                        accessibilityRole="button"
                        accessibilityLabel={`${link.title}. ${link.sub}`}
                    >
                        {'art' in link ? (
                            <Image
                                source={link.art}
                                style={styles.art}
                                contentFit="contain"
                                transition={0}
                            />
                        ) : (
                            <View style={styles.art}>
                                <link.mark size={56} stroke={0.9} color={colors.accent} />
                            </View>
                        )}

                        <Text style={styles.title} numberOfLines={1}>{link.title}</Text>
                        <Text style={styles.sub} numberOfLines={2}>{link.sub}</Text>

                        {/*
                          * The button is the affordance, so it carries the
                          * accent at rest rather than waiting to earn it — the
                          * web component's own reasoning, and the reason it is
                          * a real CommandButton here and not a coloured strip.
                          *
                          * `pointerEvents="none"` because the whole panel is
                          * the target: two nested pressables would give the
                          * card a dead centre and a live corner.
                          */}
                        <View pointerEvents="none" style={styles.ctaWrap}>
                            <CommandButton
                                label={link.cta}
                                compact
                                onPress={link.go}
                                behind={colors.surface1}
                                trailing={<ArrowRightMark size={10} color={colors.inkHi} />}
                            />
                        </View>
                    </Pressable>
                </View>
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: space.lg,
        gap: space.md,
    },
    /* Two up, and the gap taken out of the cell rather than the panel, so both
       columns are the same width whatever the labels do. */
    cell: { width: '48%', flexGrow: 1 },
    panel: {
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: space.md,
        paddingTop: space.lg,
        paddingBottom: space.md,
        backgroundColor: colors.surface1,
        borderColor: colors.line,
        borderWidth: StyleSheet.hairlineWidth,
        borderRadius: radius.card,
    },
    art: { width: 56, height: 56 },
    title: {
        marginTop: space.md,
        fontFamily: font.display,
        fontSize: 14,
        lineHeight: 17,
        color: colors.inkHi,
        textAlign: 'center',
    },
    sub: {
        fontFamily: font.body,
        fontSize: 11.5,
        lineHeight: 15,
        color: colors.inkLow,
        textAlign: 'center',
        /* Two lines' worth, whether the line wraps or not. Without it a
           one-line card puts its button 15px higher than the card beside it,
           and four buttons on three different baselines is the first thing the
           eye finds on the grid. */
        minHeight: 30,
    },
    ctaWrap: { marginTop: space.md, alignSelf: 'stretch' },
});
