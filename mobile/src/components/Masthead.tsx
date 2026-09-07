import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, space, TOUCH_TARGET } from '@/theme/tokens';

/**
 * The header the site has and this app did not.
 *
 * Every page on techplay.gg opens with the wordmark and a crimson hairline
 * under it. The app opened with a greeting, which is a perfectly good app
 * header and belongs to no particular product — somebody handed the phone
 * could not have told you whose app it was.
 *
 * The logo is bundled rather than fetched. It is 20 KB and it is the first
 * thing on the first screen; waiting on a network for it would mean the app
 * opens anonymous every time.
 */
export function Masthead({ onSearch }: { onSearch?: () => void }) {
    return (
        <View style={styles.wrap}>
            <View style={styles.bar}>
                <Pressable
                    onPress={() => router.push('/(tabs)')}
                    accessibilityRole="button"
                    accessibilityLabel="TechPlay, home"
                    hitSlop={8}
                >
                    <Image
                        source={require('../../assets/brand/logo.png')}
                        style={styles.logo}
                        contentFit="contain"
                        // It is the brand mark, so it must not fade in — a
                        // masthead that arrives late reads as a page still
                        // loading.
                        transition={0}
                    />
                </Pressable>

                <Pressable
                    onPress={onSearch ?? (() => router.push('/search'))}
                    hitSlop={12}
                    style={styles.action}
                    accessibilityRole="button"
                    accessibilityLabel="Search"
                >
                    <Text style={styles.glyph}>⌕</Text>
                </Pressable>
            </View>

            {/* The crimson hairline under the header, which the site draws as a
                gradient rule. It is what separates the chrome from the page. */}
            <View style={styles.rule} />
        </View>
    );
}

const styles = StyleSheet.create({
    wrap: { backgroundColor: colors.surface0 },
    bar: {
        height: TOUCH_TARGET + 4,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: space.lg,
    },
    logo: { width: 132, height: 26 },
    action: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    glyph: { fontSize: 22, lineHeight: 26, color: colors.inkMid },
    rule: {
        height: 1,
        backgroundColor: colors.accent,
        opacity: 0.55,
    },
});
