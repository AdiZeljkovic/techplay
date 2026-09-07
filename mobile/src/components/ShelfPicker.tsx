import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { Body, Eyebrow } from '@/components/Screen';
import { removeFromShelf, setShelfStatus, SHELF_CHOICES, SHELF_STATUS, type ShelfStatus } from '@/lib/library';
import { colors, font, radius, size, space, TOUCH_TARGET } from '@/theme/tokens';

/**
 * Putting a game on a shelf, from the game's own page.
 *
 * A sheet rather than a screen: it is one choice out of seven and the reader
 * has to come straight back to what they were looking at. A push and a pop
 * for a single tap is a journey.
 *
 * The write is not optimistic. Every status change here can move XP, a quest
 * step and a Bounty payment on the server, and a card that shows "Completed"
 * before the server has agreed is a card that may have to take it back — in
 * front of somebody who has just been told they earned something.
 */
export function ShelfPicker({
    slug,
    current,
    onChanged,
    onClose,
}: {
    slug: string;
    current: ShelfStatus | null;
    onChanged: (status: ShelfStatus | null) => void;
    onClose: () => void;
}) {
    const [busy, setBusy] = useState<ShelfStatus | 'remove' | null>(null);
    const [error, setError] = useState<string | null>(null);

    async function choose(status: ShelfStatus) {
        // Choosing the shelf it is already on is not a change. Sending it
        // would spend one of sixty writes a minute to say nothing.
        if (status === current) {
            onClose();

            return;
        }

        setBusy(status);
        setError(null);

        try {
            await setShelfStatus(slug, status);
            onChanged(status);
            onClose();
        } catch (e) {
            setError(e instanceof Error ? e.message : 'That did not save. Try again.');
        } finally {
            setBusy(null);
        }
    }

    async function remove() {
        setBusy('remove');
        setError(null);

        try {
            await removeFromShelf(slug);
            onChanged(null);
            onClose();
        } catch (e) {
            setError(e instanceof Error ? e.message : 'That did not save. Try again.');
        } finally {
            setBusy(null);
        }
    }

    return (
        <Modal visible transparent animationType="slide" onRequestClose={onClose}>
            {/* The scrim closes it. On a phone, tapping away from a sheet is
                the gesture people try first — and a sheet that ignores it
                reads as stuck. */}
            <Pressable style={styles.scrim} onPress={onClose} accessibilityLabel="Close" />

            <View style={styles.sheet}>
                <View style={styles.grabber} />

                <Eyebrow>Put it on a shelf</Eyebrow>

                {error && (
                    <View style={styles.error}>
                        <Text style={styles.errorText}>{error}</Text>
                    </View>
                )}

                <View style={styles.choices}>
                    {SHELF_CHOICES.map((status) => {
                        const meta = SHELF_STATUS[status];
                        const on = status === current;

                        return (
                            <Pressable
                                key={status}
                                onPress={() => choose(status)}
                                disabled={busy !== null}
                                style={({ pressed }) => [
                                    styles.choice,
                                    on && { borderColor: meta.color, backgroundColor: colors.surface2 },
                                    pressed && { backgroundColor: colors.surface3 },
                                    busy !== null && busy !== status && { opacity: 0.4 },
                                ]}
                                accessibilityRole="button"
                                accessibilityState={{ selected: on, busy: busy === status }}
                            >
                                <View style={[styles.pip, { backgroundColor: meta.color }]} />
                                <Text style={[styles.choiceText, on && { color: colors.inkHi }]}>
                                    {meta.label}
                                </Text>
                                {on && <Text style={[styles.tick, { color: meta.color }]}>✓</Text>}
                            </Pressable>
                        );
                    })}
                </View>

                {current && (
                    <Pressable
                        onPress={remove}
                        disabled={busy !== null}
                        style={({ pressed }) => [styles.remove, pressed && { backgroundColor: colors.surface2 }]}
                        accessibilityRole="button"
                    >
                        <Text style={styles.removeText}>
                            {busy === 'remove' ? 'Removing…' : 'Take it off my shelf'}
                        </Text>
                    </Pressable>
                )}

                <Body style={styles.footnote}>
                    Finishing a game pays 50 Bounty and 15 XP — once per game, ever.
                </Body>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    scrim: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
    },
    sheet: {
        backgroundColor: colors.surface1,
        borderTopLeftRadius: radius.sheet,
        borderTopRightRadius: radius.sheet,
        borderTopColor: colors.lineStrong,
        borderTopWidth: StyleSheet.hairlineWidth,
        padding: space.lg,
        paddingBottom: space.xxl,
        gap: space.md,
    },
    grabber: {
        alignSelf: 'center',
        width: 36,
        height: 4,
        borderRadius: 2,
        backgroundColor: colors.lineStrong,
        marginBottom: space.sm,
    },
    choices: { gap: space.sm },
    choice: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: space.md,
        height: TOUCH_TARGET,
        paddingHorizontal: space.lg,
        borderRadius: radius.card,
        borderColor: colors.line,
        borderWidth: StyleSheet.hairlineWidth,
        backgroundColor: colors.surface0,
    },
    pip: { width: 8, height: 8, borderRadius: 4 },
    choiceText: {
        flex: 1,
        fontFamily: font.bodyMedium,
        fontSize: size.body,
        color: colors.inkMid,
    },
    tick: { fontFamily: font.body, fontSize: size.body },
    remove: {
        height: TOUCH_TARGET,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: radius.card,
    },
    removeText: {
        fontFamily: font.bodyMedium,
        fontSize: size.small,
        color: colors.danger,
    },
    error: {
        backgroundColor: 'rgba(239, 68, 68, 0.10)',
        borderLeftColor: colors.danger,
        borderLeftWidth: 3,
        borderRadius: radius.card,
        padding: space.md,
    },
    errorText: {
        fontFamily: font.body,
        fontSize: size.small,
        color: colors.danger,
    },
    footnote: {
        fontSize: size.caption,
        color: colors.inkLow,
        textAlign: 'center',
    },
});
