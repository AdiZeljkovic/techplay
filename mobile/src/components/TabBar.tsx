import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Tabs } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
    CalendarMark,
    GamepadMark,
    HouseMark,
    LayersMark,
    UserMark,
    type MarkProps,
} from '@/components/Marks';
import { useAuth } from '@/context/AuthContext';
import { colors, font } from '@/theme/tokens';

/**
 * The bottom bar, rebuilt as the site's console.
 *
 * The app shipped the platform default: a flat black strip, four text glyphs,
 * a tint change to say which one you were on. It works, and it belongs to no
 * product — put beside the site on the same phone it was the clearest tell
 * that these were two different things.
 *
 * `MobileTabBar.tsx` on the web is a considered object with a written history:
 * two earlier versions spent the crimson on the whole slab and then had
 * nowhere left to say "you are here". The one that stuck keeps the ground dark
 * and spends the red in three places —
 *
 *   the frame      a crimson hairline around the console, the glow pooling at
 *                  the two ends where it meets the edge of the screen
 *   the switch     a crimson tile under the mark of the tab you are on
 *   the portrait   a crimson ring around you, in the middle
 *
 * — and you sit raised out of the middle, because centre is the thumb's
 * easiest reach and a portrait is what turns a row of glyphs into something
 * that knows who is holding the phone.
 *
 * All of that is reproduced from that file's numbers rather than from a
 * screenshot. Two web-only things are dropped: `color-mix`, resolved to fixed
 * values below because the app has no per-profile accent yet, and the
 * hidden-on-checkout list, which is a route problem the app does not have.
 */

/*
 * Expo Router 57 vendors React Navigation rather than depending on it, so
 * `@react-navigation/bottom-tabs` is not a package here and its types cannot
 * be imported by name. Reaching into `expo-router/build/...` for them would
 * bind this file to a private path. Reading the type off the prop it is going
 * to be passed as cannot go stale: if the navigator's contract changes, this
 * changes with it.
 */
type TabBarProps = Parameters<NonNullable<React.ComponentProps<typeof Tabs>['tabBar']>>[0];

type Slot =
    | { name: string; label: string; Mark: (props: MarkProps) => React.JSX.Element }
    | { portrait: true };

/** The five slots, in the site's order, with you in the middle. */
const SLOTS: Slot[] = [
    { name: 'index', label: 'Home', Mark: HouseMark },
    { name: 'news', label: 'Feed', Mark: LayersMark },
    { portrait: true },
    /*
     * The site's fourth slot is the forum, which the app does not have yet.
     * The catalogue takes the place: this was `/search` — a text field and a
     * list — until the tab became the Game Database it is called after.
     */
    { name: 'games', label: 'Games', Mark: GamepadMark },
    { name: 'calendar', label: 'Calendar', Mark: CalendarMark },
];

export function TabBar({ state, navigation }: TabBarProps) {
    const insets = useSafeAreaInsets();
    const { user } = useAuth();

    const current = state.routes[state.index]?.name;

    function go(name: string) {
        const route = state.routes.find((r: { name: string }) => r.name === name);

        if (!route) { return; }

        const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
        });

        if (!event.defaultPrevented) {
            navigation.navigate(route.name as never);
        }
    }

    return (
        <View style={[styles.shell, { paddingBottom: insets.bottom }]}>
            {/* The console's ground: surface-1 lifted a touch toward the accent
                at the top, falling to the page colour at the bottom. */}
            <LinearGradient
                colors={['#0D0E15', colors.surface0]}
                style={styles.ground}
                pointerEvents="none"
            />

            {/* The glow pools at the two ends and clears the middle, so the
                portrait is read against dark rather than against red. */}
            <LinearGradient
                colors={[
                    'rgba(220, 20, 60, 0.30)',
                    'transparent',
                    'transparent',
                    'rgba(220, 20, 60, 0.30)',
                ]}
                locations={[0, 0.26, 0.74, 1]}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={styles.ground}
                pointerEvents="none"
            />

            <View style={styles.row}>
                {SLOTS.map((slot) => {
                    if ('portrait' in slot) {
                        const active = current === 'profile';

                        return (
                            <Pressable
                                key="you"
                                onPress={() => go('profile')}
                                style={styles.slot}
                                accessibilityRole="button"
                                accessibilityState={{ selected: active }}
                                accessibilityLabel={user ? 'Your profile' : 'Sign in'}
                            >
                                {/* Raised out of the bar, with its own ring. On
                                    the crimson slab this replaced, the ring had
                                    to be white because red on red dissolved —
                                    which is the clearest argument for the dark
                                    ground the bar now has. */}
                                <View
                                    style={[
                                        styles.portrait,
                                        active ? styles.portraitOn : styles.portraitOff,
                                    ]}
                                >
                                    <View style={styles.portraitInner}>
                                        {user?.avatar_url ? (
                                            <Image
                                                source={{ uri: user.avatar_url }}
                                                style={styles.avatar}
                                                contentFit="cover"
                                            />
                                        ) : (
                                            <UserMark size={25} color="rgba(255, 255, 255, 0.75)" />
                                        )}
                                    </View>
                                </View>

                                {/* On the same baseline as the other four; the
                                    portrait is out of the flow above it. */}
                                <Text style={[styles.label, active && styles.labelOn]}>
                                    {user ? 'You' : 'Sign in'}
                                </Text>
                            </Pressable>
                        );
                    }

                    const active = current === slot.name;

                    return (
                        <Pressable
                            key={slot.name}
                            onPress={() => go(slot.name)}
                            style={styles.slot}
                            accessibilityRole="button"
                            accessibilityState={{ selected: active }}
                            accessibilityLabel={slot.label}
                        >
                            {/* Only the mark sits on the tile, not the label —
                                a tile the height of both reads as a button
                                somebody pressed rather than as tab state. */}
                            <View style={styles.tile}>
                                {active && (
                                    <LinearGradient
                                        colors={[colors.accent, '#9E0E2B']}
                                        style={styles.tileFill}
                                        pointerEvents="none"
                                    />
                                )}
                                <slot.Mark
                                    color={active ? colors.inkHi : 'rgba(255, 255, 255, 0.85)'}
                                />
                            </View>

                            <Text style={[styles.label, active && styles.labelOn]}>
                                {slot.label}
                            </Text>
                        </Pressable>
                    );
                })}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    shell: {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        borderTopWidth: 1,
        borderLeftWidth: 1,
        borderRightWidth: 1,
        borderColor: 'rgba(220, 20, 60, 0.55)',
        // The portrait is raised out of the bar, so nothing here may clip.
        overflow: 'visible',
        backgroundColor: colors.surface0,
    },
    /* Inset by the border, and clipped to the same corners — an absolute fill
       would paint over the crimson hairline and square off the top. */
    ground: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        borderTopLeftRadius: 19,
        borderTopRightRadius: 19,
    },
    row: { flexDirection: 'row', alignItems: 'stretch' },
    slot: {
        flex: 1,
        height: 64,
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: 6,
        paddingBottom: 10,
    },
    tile: {
        width: 34,
        height: 34,
        alignItems: 'center',
        justifyContent: 'center',
    },
    tileFill: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        borderRadius: 10,
    },
    label: {
        fontFamily: font.display,
        fontSize: 9,
        letterSpacing: 1,
        lineHeight: 10,
        textTransform: 'uppercase',
        color: 'rgba(255, 255, 255, 0.85)',
    },
    labelOn: { color: colors.inkHi },
    portrait: {
        position: 'absolute',
        top: -22,
        width: 58,
        height: 58,
        borderRadius: 29,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.surface0,
    },
    /* The web draws the ring as a spread shadow; React Native has no such
       thing, so it is a border — the same 2px, and it costs no extra layer on
       a view that is already lifted. */
    portraitOff: { borderWidth: 2, borderColor: 'rgba(220, 20, 60, 0.80)' },
    portraitOn: { borderWidth: 2.5, borderColor: colors.accent },
    portraitInner: {
        width: 50,
        height: 50,
        borderRadius: 25,
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.surface2,
    },
    avatar: { width: '100%', height: '100%' },
});
