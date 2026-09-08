import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BellMark, MoreMark, SearchMark } from '@/components/Marks';
import { MoreSheet } from '@/components/MoreSheet';
import { NotificationSheet } from '@/components/NotificationSheet';
import { useAuth } from '@/context/AuthContext';
import { getCounts } from '@/lib/notifications';
import { colors, font, space, TOUCH_TARGET } from '@/theme/tokens';

/**
 * The header the site has.
 *
 * Every page on techplay.gg opens with the wordmark, a crimson hairline, and
 * three targets on the right: search, the bell, and more. This carried only
 * the wordmark and search — so a notification had nowhere to arrive and the
 * things the tab bar does not hold had no door at all.
 *
 * Three 44px targets and a logo is what fits at 390px, which is the site's own
 * note on this row, and the bell earns its place there for the reason written
 * beside it: a notification nobody can see is a notification that did not
 * happen.
 *
 * The logo is bundled rather than fetched. It is 20 KB and it is the first
 * thing on the first screen; waiting on a network for it would mean the app
 * opens anonymous every time.
 */
export function Masthead({ onSearch }: { onSearch?: () => void }) {
    const { user } = useAuth();

    const [unread, setUnread] = useState(0);
    const [sheet, setSheet] = useState<'bell' | 'more' | null>(null);

    /*
     * One small call for the badge, and only when somebody is signed in.
     * Signed out there is nothing to count and the endpoint is behind auth,
     * so asking would spend a 401 to learn what we already know.
     */
    const refreshCounts = useCallback(async (signal?: AbortSignal) => {
        if (!user) {
            setUnread(0);

            return;
        }

        try {
            const counts = await getCounts(signal);

            setUnread(counts.unread_notifications ?? 0);
        } catch {
            // A badge is not worth an error message. It stays as it was.
        }
    }, [user]);

    useEffect(() => {
        const controller = new AbortController();

        refreshCounts(controller.signal);

        return () => controller.abort();
    }, [refreshCounts]);

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

                <View style={styles.actions}>
                    <Pressable
                        onPress={onSearch ?? (() => router.push('/search'))}
                        style={({ pressed }) => [styles.action, pressed && styles.actionOn]}
                        accessibilityRole="button"
                        accessibilityLabel="Search"
                    >
                        <SearchMark size={21} color={colors.inkMid} />
                    </Pressable>

                    {/* Signed out there is no bell, exactly as on the site.
                        An empty bell that can only ever tell you to sign in is
                        a control that wastes one of three places. */}
                    {user && (
                        <Pressable
                            onPress={() => setSheet('bell')}
                            style={({ pressed }) => [styles.action, pressed && styles.actionOn]}
                            accessibilityRole="button"
                            accessibilityLabel={
                                unread > 0 ? `Notifications, ${unread} unread` : 'Notifications'
                            }
                        >
                            <BellMark size={21} color={colors.inkMid} active={unread > 0} />

                            {unread > 0 && (
                                <View style={styles.badge}>
                                    <Text style={styles.badgeText}>
                                        {unread > 9 ? '9+' : unread}
                                    </Text>
                                </View>
                            )}
                        </Pressable>
                    )}

                    <Pressable
                        onPress={() => setSheet('more')}
                        style={({ pressed }) => [styles.action, pressed && styles.actionOn]}
                        accessibilityRole="button"
                        accessibilityLabel="More"
                    >
                        <MoreMark size={21} color={colors.inkMid} />
                    </Pressable>
                </View>
            </View>

            {/* The crimson hairline under the header, which the site draws as a
                gradient rule. It is what separates the chrome from the page. */}
            <View style={styles.rule} />

            {sheet === 'bell' && (
                <NotificationSheet
                    onClose={() => setSheet(null)}
                    onCountsChanged={setUnread}
                />
            )}

            {sheet === 'more' && <MoreSheet onClose={() => setSheet(null)} />}
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
        paddingLeft: space.lg,
        // Less on the right: the three targets carry their own padding, and a
        // full gutter on top of it pushes the logo off centre.
        paddingRight: space.sm,
    },
    logo: { width: 132, height: 26 },
    actions: { flexDirection: 'row', alignItems: 'center' },
    action: {
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 6,
    },
    actionOn: { backgroundColor: colors.fill2 },
    /* The count sits on the bell rather than beside it — a badge in the row
       would move the other two targets every time something arrived. */
    badge: {
        position: 'absolute',
        top: 6,
        right: 6,
        minWidth: 15,
        height: 15,
        paddingHorizontal: 3,
        borderRadius: 7.5,
        backgroundColor: colors.accent,
        alignItems: 'center',
        justifyContent: 'center',
        borderColor: colors.surface0,
        borderWidth: 1.5,
    },
    badgeText: {
        fontFamily: font.display,
        fontSize: 8.5,
        lineHeight: 11,
        color: colors.inkHi,
    },
    rule: {
        height: 1,
        backgroundColor: colors.accent,
        opacity: 0.55,
    },
});
