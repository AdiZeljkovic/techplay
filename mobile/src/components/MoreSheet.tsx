import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import {
    BookmarkMark,
    GamepadMark,
    LifeBuoyMark,
    LogInMark,
    LogOutMark,
    type MarkProps,
} from '@/components/Marks';
import { Eyebrow } from '@/components/Screen';
import { useAuth } from '@/context/AuthContext';
import { colors, font, radius, size, space, TOUCH_TARGET } from '@/theme/tokens';

/**
 * More — everything the five tabs do not carry.
 *
 * The site's `MoreSheet.tsx` holds thirteen destinations across four groups,
 * and its own docblock explains that this is what is *left* once the tab bar
 * took the rest. The app's tab bar took the same five, so the same idea
 * applies — but the leftovers are not the same leftovers, because most of the
 * site's thirteen have no screen here yet.
 *
 * What is listed below is what the app can actually open. Leaderboard, Social
 * Hub, Giveaways, Frontiers, the WoW Analyzer, the Backlog Advisor, the GTA 6
 * hub, The Last Disc, Studios, the Forum and the Shop are not here, and are
 * not quietly linked out to the mobile site either: a row in an app's own menu
 * that throws you into a browser is a row that lied about being part of the
 * app. They arrive here as they get built.
 *
 * The Help Centre is the exception and is marked as one. It lives on its own
 * host on the web by design, there is no version of it that could be in the
 * app, and it is where somebody goes when something is broken — which is a bad
 * moment to hide the only door.
 */
const HELP_URL = 'https://help.techplay.gg';

type Row = {
    label: string;
    hint: string;
    Mark: (props: MarkProps) => React.JSX.Element;
    go: () => void | Promise<unknown>;
    /** Drawn in crimson, and last. */
    danger?: boolean;
    /** Gets the "opens in your browser" note. */
    external?: boolean;
};

export function MoreSheet({ onClose }: { onClose: () => void }) {
    const { user, signOut } = useAuth();

    function close(then: () => void) {
        onClose();
        then();
    }

    const rows: Row[] = [
        ...(user
            ? [{
                label: 'Your library',
                hint: 'Everything you are playing, finished or parked',
                Mark: GamepadMark,
                go: () => close(() => router.push('/library')),
            }]
            : []),
        {
            label: 'Saved for offline',
            hint: 'What you kept to read without a signal',
            Mark: BookmarkMark,
            go: () => close(() => router.push('/saved')),
        },
        {
            label: 'Help centre',
            hint: 'Accounts, connected platforms, XP and your data',
            Mark: LifeBuoyMark,
            external: true,
            go: () => WebBrowser.openBrowserAsync(HELP_URL),
        },
        user
            ? {
                label: 'Sign out',
                hint: `Signed in as ${user.display_name || user.username}`,
                Mark: LogOutMark,
                danger: true,
                go: () => close(() => { signOut(); }),
            }
            : {
                label: 'Sign in',
                hint: 'Your shelf, your XP and everything you follow',
                Mark: LogInMark,
                go: () => close(() => router.push('/sign-in')),
            },
    ];

    return (
        <Modal visible transparent animationType="slide" onRequestClose={onClose}>
            <Pressable style={styles.scrim} onPress={onClose} accessibilityLabel="Close" />

            <View style={styles.sheet}>
                <View style={styles.grabber} />

                <Eyebrow>More</Eyebrow>

                <View style={styles.rows}>
                    {rows.map((row) => (
                        <Pressable
                            key={row.label}
                            onPress={row.go}
                            style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.surface2 }]}
                            accessibilityRole="button"
                            accessibilityLabel={`${row.label}. ${row.hint}`}
                        >
                            <row.Mark size={20} color={row.danger ? colors.danger : colors.accentInk} />

                            <View style={styles.rowBody}>
                                <Text style={[styles.label, row.danger && { color: colors.danger }]}>
                                    {row.label}
                                </Text>
                                <Text style={styles.hint} numberOfLines={2}>
                                    {row.hint}
                                    {row.external ? '  ·  opens in your browser' : ''}
                                </Text>
                            </View>
                        </Pressable>
                    ))}
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    scrim: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.6)' },
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
    rows: { gap: space.xs },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: space.md,
        minHeight: TOUCH_TARGET,
        paddingVertical: space.sm,
        paddingHorizontal: space.md,
        borderRadius: radius.card,
    },
    rowBody: { flex: 1, gap: 1 },
    label: {
        fontFamily: font.bodySemi,
        fontSize: size.small,
        color: colors.inkHi,
    },
    hint: {
        fontFamily: font.body,
        fontSize: 12,
        lineHeight: 16,
        color: colors.inkLow,
    },
});
