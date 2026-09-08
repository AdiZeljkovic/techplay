import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import { Eyebrow } from '@/components/Screen';
import {
    getNotifications,
    markAllRead,
    markRead,
    routeFor,
    type Notification,
} from '@/lib/notifications';
import { colors, font, radius, size, space, TOUCH_TARGET } from '@/theme/tokens';

/**
 * The bell's sheet.
 *
 * A sheet rather than a screen, for the same reason the shelf picker is one:
 * you look, you deal with it, and you go back to what you were reading. A push
 * and a pop to glance at three lines is a journey.
 *
 * Reads are lazy — the list is fetched when this opens, never before. The
 * header carries a count all day and that costs one small call; twenty rows on
 * every launch would be the whole payload for a digit nobody tapped.
 */
export function NotificationSheet({
    onClose,
    onCountsChanged,
}: {
    onClose: () => void;
    /** So the header's badge follows what happened in here. */
    onCountsChanged: (unread: number) => void;
}) {
    const [items, setItems] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async (signal?: AbortSignal) => {
        try {
            const page = await getNotifications(signal);

            setItems(page.items);
            setError(null);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Could not load your notifications.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const controller = new AbortController();

        load(controller.signal);

        return () => controller.abort();
    }, [load]);

    const unread = items.filter((n) => !n.is_read).length;

    async function open(item: Notification) {
        const target = routeFor(item.link);

        /*
         * Marked read locally first, and the failure is swallowed.
         *
         * This is the one place optimism is right: the cost of being wrong is
         * a dot that comes back on the next load, and the alternative is a row
         * that stays bold for a second after you have plainly read it. The
         * shelf picker takes the opposite line because a wrong shelf can move
         * XP and money.
         */
        if (!item.is_read) {
            setItems((prev) => prev.map((n) => (n.id === item.id ? { ...n, is_read: true } : n)));
            onCountsChanged(Math.max(0, unread - 1));
            markRead(item.id).catch(() => {});
        }

        if (target) {
            onClose();
            router.push(target as never);
        }
    }

    async function clearAll() {
        setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
        onCountsChanged(0);
        markAllRead().catch(() => {});
    }

    return (
        <Modal visible transparent animationType="slide" onRequestClose={onClose}>
            <Pressable style={styles.scrim} onPress={onClose} accessibilityLabel="Close" />

            <View style={styles.sheet}>
                <View style={styles.grabber} />

                <View style={styles.head}>
                    <Eyebrow>Notifications</Eyebrow>

                    {unread > 0 && (
                        <Pressable
                            onPress={clearAll}
                            hitSlop={8}
                            accessibilityRole="button"
                            accessibilityLabel="Mark all as read"
                        >
                            <Text style={styles.clear}>Mark all read</Text>
                        </Pressable>
                    )}
                </View>

                {loading ? (
                    <View style={styles.centre}>
                        <ActivityIndicator color={colors.accentInk} />
                    </View>
                ) : error ? (
                    <Text style={styles.empty}>{error}</Text>
                ) : items.length === 0 ? (
                    <Text style={styles.empty}>Nothing yet. This is where replies, mentions and rewards land.</Text>
                ) : (
                    <FlatList
                        data={items}
                        keyExtractor={(item) => item.id}
                        style={styles.list}
                        contentContainerStyle={styles.listInner}
                        renderItem={({ item }) => {
                            const tappable = routeFor(item.link) !== null;

                            return (
                                <Pressable
                                    onPress={() => open(item)}
                                    style={({ pressed }) => [
                                        styles.row,
                                        pressed && tappable && { backgroundColor: colors.surface2 },
                                    ]}
                                    accessibilityRole={tappable ? 'button' : 'text'}
                                    accessibilityLabel={[item.title, item.message].filter(Boolean).join('. ')}
                                >
                                    {/* Unread is a crimson pip, and the space is
                                        held either way — a list whose rows shift
                                        sideways as you read them is a list that
                                        moves under your thumb. */}
                                    <View style={[styles.pip, !item.is_read && styles.pipOn]} />

                                    <View style={styles.rowBody}>
                                        {item.title && (
                                            <Text
                                                style={[styles.title, !item.is_read && styles.titleUnread]}
                                                numberOfLines={2}
                                            >
                                                {item.title}
                                            </Text>
                                        )}
                                        {item.message && (
                                            <Text style={styles.message} numberOfLines={3}>{item.message}</Text>
                                        )}
                                        {item.created_at && (
                                            <Text style={styles.when}>{ago(item.created_at)}</Text>
                                        )}
                                    </View>
                                </Pressable>
                            );
                        }}
                    />
                )}
            </View>
        </Modal>
    );
}

/**
 * How long ago, in the fewest words that are still true.
 *
 * The server sends an ISO timestamp here rather than the human string the
 * article endpoints send, so this is the one place the app has to do the sum
 * itself.
 */
function ago(iso: string): string {
    const seconds = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);

    if (seconds < 60) { return 'Just now'; }

    const minutes = Math.floor(seconds / 60);

    if (minutes < 60) { return `${minutes} min ago`; }

    const hours = Math.floor(minutes / 60);

    if (hours < 24) { return `${hours} h ago`; }

    const days = Math.floor(hours / 24);

    if (days < 30) { return `${days} d ago`; }

    return new Date(iso).toLocaleDateString();
}

const styles = StyleSheet.create({
    scrim: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.6)' },
    sheet: {
        maxHeight: '72%',
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
    head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    clear: {
        fontFamily: font.display,
        fontSize: 10,
        letterSpacing: 1.1,
        textTransform: 'uppercase',
        color: colors.accentInk,
    },
    centre: { paddingVertical: space.xxl, alignItems: 'center' },
    empty: {
        fontFamily: font.body,
        fontSize: size.small,
        lineHeight: size.small * 1.45,
        color: colors.inkLow,
        paddingVertical: space.lg,
    },
    list: { marginHorizontal: -space.sm },
    listInner: { paddingHorizontal: space.sm },
    row: {
        flexDirection: 'row',
        gap: space.md,
        paddingVertical: space.md,
        paddingHorizontal: space.sm,
        borderRadius: radius.card,
        borderBottomColor: colors.line,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    pip: {
        width: 7,
        height: 7,
        borderRadius: 3.5,
        marginTop: 5,
        backgroundColor: 'transparent',
    },
    pipOn: { backgroundColor: colors.accent },
    rowBody: { flex: 1, gap: 2 },
    title: {
        fontFamily: font.bodyMedium,
        fontSize: size.small,
        lineHeight: size.small * 1.35,
        color: colors.inkMid,
    },
    titleUnread: { fontFamily: font.bodySemi, color: colors.inkHi },
    message: {
        fontFamily: font.body,
        fontSize: 12.5,
        lineHeight: 17,
        color: colors.inkLow,
    },
    when: { fontFamily: font.mono, fontSize: 10.5, color: colors.inkFaint, marginTop: 2 },
});
