import { ActivityIndicator, Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';

import { colors, font, radius, size, TOUCH_TARGET } from '@/theme/tokens';

/**
 * A button that always presses.
 *
 * `disabled` here means one thing only: the request it starts is already in
 * flight. It is never used to express "you have not filled this in properly",
 * because that is the mistake the web sign-up page made and it cost a reader
 * an account -- the button went dead, the form knew exactly why, and the
 * disabled state guaranteed nobody would ever be told.
 *
 * A screen that cannot proceed presses the button, fails, and says what is
 * missing. On a phone that is the only workable answer anyway: there is no
 * hover, no tooltip, and no cursor to turn into a "not allowed" sign.
 */
export function Button({
    label,
    onPress,
    busy = false,
    variant = 'primary',
    style,
}: {
    label: string;
    onPress: () => void;
    busy?: boolean;
    variant?: 'primary' | 'quiet';
    style?: StyleProp<ViewStyle>;
}) {
    return (
        <Pressable
            onPress={onPress}
            disabled={busy}
            accessibilityRole="button"
            accessibilityLabel={label}
            accessibilityState={{ busy }}
            style={({ pressed }) => [
                styles.base,
                variant === 'primary' ? styles.primary : styles.quiet,
                pressed && (variant === 'primary' ? styles.primaryPressed : styles.quietPressed),
                busy && styles.busy,
                style,
            ]}
        >
            {busy ? (
                <ActivityIndicator color={variant === 'primary' ? colors.inkHi : colors.inkMid} />
            ) : (
                <Text style={[styles.label, variant === 'quiet' && { color: colors.inkMid }]}>
                    {label}
                </Text>
            )}
        </Pressable>
    );
}

const styles = StyleSheet.create({
    base: {
        height: TOUCH_TARGET + 4,
        borderRadius: radius.card,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
    },
    primary: {
        backgroundColor: colors.accent,
    },
    primaryPressed: {
        backgroundColor: colors.accentHover,
    },
    quiet: {
        backgroundColor: 'transparent',
        borderColor: colors.lineStrong,
        borderWidth: StyleSheet.hairlineWidth,
    },
    quietPressed: {
        backgroundColor: colors.fill2,
    },
    busy: {
        opacity: 0.7,
    },
    label: {
        fontFamily: font.display,
        fontSize: 13,
        letterSpacing: 1.3,
        textTransform: 'uppercase',
        color: colors.inkHi,
    },
});
