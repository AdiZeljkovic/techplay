import { Tabs } from 'expo-router';
import { StyleSheet, Text, View, type ColorValue } from 'react-native';

import { colors, font, size, TOUCH_TARGET } from '@/theme/tokens';

/**
 * Four tabs, and no more.
 *
 * The site has fourteen sections. Putting them all here would rebuild the
 * problem the mobile-web audit measured in August: two to four taps to reach
 * anything, because the way in was a menu rather than a place.
 *
 * The calendar earned the fourth place rather than being given it. It is the
 * only screen here with a reason to be opened on a day when nothing has been
 * published — a release date is checked repeatedly and forgotten in between —
 * and it is what push notifications will eventually be for. Everything else
 * is reached from inside one of these four.
 */
export default function TabsLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarStyle: styles.bar,
                tabBarActiveTintColor: colors.accentInk,
                tabBarInactiveTintColor: colors.inkLow,
                tabBarLabelStyle: styles.label,
                /* The bar is drawn, not tinted by the platform: a translucent
                   iOS bar over a near-black app shows the wrong grey. */
                tabBarBackground: () => <View style={styles.barFill} />,
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Read',
                    tabBarIcon: ({ color }) => <Glyph glyph="▤" color={color} />,
                }}
            />
            <Tabs.Screen
                name="news"
                options={{
                    title: 'News',
                    tabBarIcon: ({ color }) => <Glyph glyph="◈" color={color} />,
                }}
            />
            <Tabs.Screen
                name="calendar"
                options={{
                    title: 'Dates',
                    tabBarIcon: ({ color }) => <Glyph glyph="▦" color={color} />,
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'You',
                    tabBarIcon: ({ color }) => <Glyph glyph="◉" color={color} />,
                }}
            />
        </Tabs>
    );
}

/**
 * Glyphs rather than an icon package.
 *
 * Three icons is not worth 400 KB of vector font, and the site's own language
 * is geometric marks rather than outlined pictograms. When the tab bar grows
 * past this, it earns a proper set.
 */
function Glyph({ glyph, color }: { glyph: string; color: ColorValue }) {
    return <Text style={[styles.glyph, { color }]}>{glyph}</Text>;
}

const styles = StyleSheet.create({
    bar: {
        height: TOUCH_TARGET + 26,
        paddingTop: 6,
        borderTopColor: colors.line,
        borderTopWidth: StyleSheet.hairlineWidth,
        backgroundColor: 'transparent',
        elevation: 0,
    },
    barFill: {
        flex: 1,
        backgroundColor: colors.surface0,
    },
    label: {
        fontFamily: font.display,
        fontSize: 9.5,
        letterSpacing: 1.1,
        textTransform: 'uppercase',
        marginTop: 2,
    },
    glyph: {
        fontSize: size.lead,
        lineHeight: size.lead + 2,
    },
});
