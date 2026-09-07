import { StyleSheet, Text, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, font, radius, size, space, TOUCH_TARGET } from '@/theme/tokens';

/**
 * The pieces every screen is built from.
 *
 * Kept together rather than spread across files because they are one visual
 * language, and the fastest way to lose a design system is to let each screen
 * re-derive it. If a screen needs a variant, it belongs here.
 */

export function Screen({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
    return (
        <SafeAreaView style={[styles.screen, style]} edges={['top', 'left', 'right']}>
            {children}
        </SafeAreaView>
    );
}

/**
 * The site's micro-label: small, heavy, uppercase, widely tracked.
 *
 * It appears above almost every block on the web — "NEW PLAYER", "SECURITY
 * LEVEL", "CHARACTER CREATION" — and it is the single most recognisable piece
 * of the visual language, so it is a component rather than a set of props
 * repeated forty times.
 */
export function Eyebrow({ children, tone = 'low' }: { children: React.ReactNode; tone?: 'low' | 'accent' }) {
    return (
        <Text style={[styles.eyebrow, tone === 'accent' && { color: colors.accentInk }]}>
            {children}
        </Text>
    );
}

export function Title({ children, style }: { children: React.ReactNode; style?: StyleProp<TextStyle> }) {
    return <Text style={[styles.title, style]}>{children}</Text>;
}

export function Body({ children, style }: { children: React.ReactNode; style?: StyleProp<TextStyle> }) {
    return <Text style={[styles.body, style]}>{children}</Text>;
}

export function Panel({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
    return <View style={[styles.panel, style]}>{children}</View>;
}

/**
 * A message the reader has to be able to act on.
 *
 * Errors on this platform have a history of saying nothing useful — a dead
 * button, a generic "couldn't connect" — so there is one component for them
 * and it always shows the server's own words, which are written for readers.
 */
export function Notice({ text, tone = 'error' }: { text: string; tone?: 'error' | 'info' }) {
    return (
        <View style={[styles.notice, tone === 'info' && styles.noticeInfo]}>
            <Text style={[styles.noticeText, tone === 'info' && { color: colors.inkMid }]}>{text}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: colors.surface0,
    },
    eyebrow: {
        fontFamily: font.display,
        fontSize: size.label,
        letterSpacing: 1.4,
        textTransform: 'uppercase',
        color: colors.inkLow,
    },
    title: {
        fontFamily: font.display,
        fontSize: size.display,
        lineHeight: size.display * 1.15,
        letterSpacing: -0.5,
        color: colors.inkHi,
    },
    body: {
        fontFamily: font.body,
        fontSize: size.body,
        lineHeight: size.body * 1.6,
        color: colors.inkMid,
    },
    panel: {
        backgroundColor: colors.surface1,
        borderColor: colors.line,
        borderWidth: StyleSheet.hairlineWidth,
        borderRadius: radius.panel,
        padding: space.lg,
    },
    notice: {
        backgroundColor: 'rgba(239, 68, 68, 0.10)',
        borderLeftColor: colors.danger,
        borderLeftWidth: 3,
        borderRadius: radius.card,
        paddingVertical: space.md,
        paddingHorizontal: space.lg,
        minHeight: TOUCH_TARGET,
        justifyContent: 'center',
    },
    noticeInfo: {
        backgroundColor: colors.fill1,
        borderLeftColor: colors.lineStrong,
    },
    noticeText: {
        fontFamily: font.body,
        fontSize: size.small,
        lineHeight: size.small * 1.5,
        color: colors.danger,
    },
});
