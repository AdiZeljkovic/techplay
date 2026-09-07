import { ActivityIndicator, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, font, TOUCH_TARGET } from '@/theme/tokens';

/**
 * The site's own button: a notched corner and a hazard hatch.
 *
 * `.btn-command` in globals.css cuts 11px off the top-left and bottom-right
 * corners with `clip-path` and lays a -45° repeating gradient into the cut
 * corner. It is on every primary control on the site and it is the single
 * most recognisable thing about the design — an app without it reads as a
 * different product wearing the same colours, which is what this one did.
 *
 * Neither `clip-path` nor a repeating gradient exists in React Native, so both
 * are built: the notches are border triangles painted in the colour behind the
 * button, and the hatch is nine thin bars laid at -45° inside a clipped strip.
 * The numbers are the stylesheet's — 11px notch, 3px bar on a 7px pitch, 0.5
 * opacity — rather than eyeballed from a screenshot.
 */
export function CommandButton({
    label,
    onPress,
    busy = false,
    variant = 'primary',
    /**
     * `.btn-command` is on full-height controls and on the 32px CTA inside a
     * quick-link panel alike, so this carries both. The notch shrinks with the
     * button: 11px cut off a 32px control is a third of its height, and reads
     * as a broken corner rather than as the treatment.
     */
    compact = false,
    /** A mark after the label, as the panel CTAs have. */
    trailing,
    /**
     * What sits behind the button. The notch is drawn rather than cut, so it
     * has to be painted in the colour it is meant to reveal — on a panel that
     * is surface-1, not the page.
     */
    behind = colors.surface0,
    style,
}: {
    label: string;
    onPress: () => void;
    busy?: boolean;
    variant?: 'primary' | 'quiet';
    compact?: boolean;
    trailing?: React.ReactNode;
    behind?: string;
    style?: StyleProp<ViewStyle>;
}) {
    const primary = variant === 'primary';
    const notch = compact ? 7 : NOTCH;

    return (
        <Pressable
            onPress={onPress}
            disabled={busy}
            accessibilityRole="button"
            accessibilityLabel={label}
            accessibilityState={{ busy }}
            style={({ pressed }) => [
                styles.base,
                compact && styles.compact,
                primary ? styles.primary : styles.quiet,
                pressed && (primary ? styles.primaryPressed : styles.quietPressed),
                busy && { opacity: 0.7 },
                style,
            ]}
        >
            {busy ? (
                <ActivityIndicator color={primary ? colors.inkHi : colors.inkMid} />
            ) : (
                <View style={styles.labelRow}>
                    <Text
                        style={[
                            styles.label,
                            compact && styles.labelCompact,
                            !primary && { color: colors.inkHi },
                        ]}
                    >
                        {label}
                    </Text>
                    {trailing}
                </View>
            )}

            {/*
              * The two cut corners.
              *
              * Drawn as border triangles rather than rotated squares: a
              * rotated square positioned outside the frame is clipped by
              * `overflow: hidden` before it can cover anything, which is why
              * the first attempt produced square corners and a hatch with
              * nothing to sit in. A zero-size View with two borders — one
              * coloured, one transparent — is a triangle that cannot be
              * clipped away, because all of it is inside.
              */}
            <View
                pointerEvents="none"
                style={[
                    styles.notchTop,
                    { borderTopColor: behind, borderTopWidth: notch, borderRightWidth: notch },
                ]}
            />
            <View
                pointerEvents="none"
                style={[
                    styles.notchBottom,
                    { borderBottomColor: behind, borderBottomWidth: notch, borderLeftWidth: notch },
                ]}
            />

            {/* The hatch, in the corner the notch cuts through. */}
            <View
                pointerEvents="none"
                style={[styles.hatch, compact && { width: 34, height: notch * 1.35 }]}
            >
                {Array.from({ length: 9 }).map((_, i) => (
                    <View
                        key={i}
                        style={[
                            styles.bar,
                            { left: i * PITCH - 8 },
                            primary
                                ? { backgroundColor: 'rgba(0, 0, 0, 0.55)' }
                                : { backgroundColor: colors.accent, opacity: 0.6 },
                        ]}
                    />
                ))}
            </View>
        </Pressable>
    );
}

/** 11px notch and a 7px hatch pitch, both from globals.css. */
const NOTCH = 11;
const PITCH = 7;

const styles = StyleSheet.create({
    base: {
        height: TOUCH_TARGET + 4,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
        overflow: 'hidden',
        // Square, deliberately. The notch is the corner treatment; a radius
        // underneath it would fight the diagonal and round off the point.
        borderRadius: 0,
    },
    compact: { height: 32, paddingHorizontal: 14 },
    labelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    primary: { backgroundColor: colors.accent },
    primaryPressed: { backgroundColor: colors.accentHover },
    quiet: { backgroundColor: colors.fill2 },
    quietPressed: { backgroundColor: colors.fill3 },
    label: {
        fontFamily: font.display,
        fontSize: 13,
        letterSpacing: 1.3,
        textTransform: 'uppercase',
        color: colors.inkHi,
    },
    labelCompact: { fontSize: 9.5, letterSpacing: 1.1 },
    notchTop: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: 0,
        height: 0,
        borderTopWidth: NOTCH,
        borderRightWidth: NOTCH,
        borderRightColor: 'transparent',
    },
    notchBottom: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 0,
        height: 0,
        borderBottomWidth: NOTCH,
        borderLeftWidth: NOTCH,
        borderLeftColor: 'transparent',
    },
    hatch: {
        position: 'absolute',
        right: 0,
        bottom: 0,
        width: 58,
        height: NOTCH * 1.35,
        overflow: 'hidden',
        opacity: 0.5,
    },
    bar: {
        position: 'absolute',
        top: -10,
        width: 3,
        height: 40,
        transform: [{ rotate: '-45deg' }],
    },
});
