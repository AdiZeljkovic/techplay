import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ClockMark, SparklesMark, UserRoundMark } from '@/components/Marks';
import { routeForItem, SECTION_LABEL, type FeedItem } from '@/lib/feed';
import { colors, font, radius, size, space } from '@/theme/tokens';

/**
 * One piece in the mixed stream.
 *
 * Not `ArticleCard`: that one draws a list of news, where everything is the
 * same kind of thing. This is a feed of four kinds at once, and the site's own
 * note says why the badge is unconditional — in a mixed stream a reader needs
 * to know whether they are looking at news or a review before they tap.
 *
 * The score parse is the site's too, and its comment is worth carrying: the
 * score arrives as a string, so `!== null` was true for "9.6" while the number
 * printed bare and uncoloured.
 */
export function FeedCard({ item }: { item: FeedItem }) {
    const score = Number(item.review_score);
    const scored = Number.isFinite(score) && score > 0;

    return (
        <Pressable
            onPress={() => router.push(routeForItem(item) as never)}
            style={({ pressed }) => [styles.card, pressed && { borderColor: colors.accent }]}
            accessibilityRole="button"
            accessibilityLabel={`${SECTION_LABEL[item.section]}. ${item.title}`}
        >
            <View style={styles.cover}>
                {item.featured_image_url && (
                    <Image
                        source={{ uri: item.featured_image_url }}
                        style={styles.image}
                        contentFit="cover"
                        transition={160}
                    />
                )}

                <View style={styles.badge}>
                    <Text style={styles.badgeText}>{SECTION_LABEL[item.section]}</Text>
                </View>

                {scored && (
                    <View style={styles.score}>
                        <Text style={styles.scoreText}>{score}</Text>
                    </View>
                )}
            </View>

            <View style={styles.body}>
                {item.category && (
                    <Text style={styles.category} numberOfLines={1}>{item.category.name}</Text>
                )}

                <Text style={styles.title} numberOfLines={2}>{item.title}</Text>

                {item.excerpt && (
                    <Text style={styles.excerpt} numberOfLines={2}>{item.excerpt}</Text>
                )}

                {/* Only the personalised feed sends this, and it is the whole
                    argument for that feed: an order somebody can check. */}
                {item.reason && (
                    <View style={styles.reason}>
                        <SparklesMark size={12} color={colors.accentInk} />
                        <Text style={styles.reasonText} numberOfLines={1}>{item.reason}</Text>
                    </View>
                )}

                <View style={styles.meta}>
                    {item.author && (
                        <View style={styles.metaBit}>
                            <UserRoundMark size={12} color={colors.inkLow} />
                            <Text style={styles.metaText} numberOfLines={1}>{item.author.name}</Text>
                        </View>
                    )}

                    <View style={styles.metaBit}>
                        <ClockMark size={12} color={colors.inkLow} />
                        <Text style={styles.metaText}>{timeAgo(item.published_at)}</Text>
                    </View>
                </View>
            </View>
        </Pressable>
    );
}

/**
 * The feed sends `2026-09-07 19:45:28`, not the formatted string the article
 * endpoints send — so this screen does the sum, like the notification sheet.
 * The space instead of a `T` is not ISO and Safari refuses it, so it is
 * replaced before parsing.
 */
function timeAgo(value: string | null): string {
    if (!value) { return '—'; }

    const at = new Date(value.replace(' ', 'T') + 'Z').getTime();

    if (!Number.isFinite(at)) { return '—'; }

    const minutes = Math.max(0, (Date.now() - at) / 60000);

    if (minutes < 60) { return `${Math.floor(minutes) || 1} min ago`; }

    const hours = Math.floor(minutes / 60);

    if (hours < 24) { return `${hours} h ago`; }

    const days = Math.floor(hours / 24);

    if (days < 30) { return `${days} d ago`; }

    return new Date(at).toLocaleDateString();
}

const styles = StyleSheet.create({
    card: {
        borderRadius: radius.panel,
        borderColor: colors.line,
        borderWidth: StyleSheet.hairlineWidth,
        backgroundColor: colors.fill1,
        overflow: 'hidden',
    },
    cover: { height: 170, backgroundColor: colors.surface2 },
    image: { width: '100%', height: '100%' },
    badge: {
        position: 'absolute',
        top: 10,
        left: 10,
        height: 20,
        paddingHorizontal: 8,
        borderRadius: 5,
        backgroundColor: colors.accent,
        alignItems: 'center',
        justifyContent: 'center',
    },
    badgeText: {
        fontFamily: font.display,
        fontSize: 8.5,
        letterSpacing: 1,
        textTransform: 'uppercase',
        color: colors.inkHi,
    },
    score: {
        position: 'absolute',
        top: 10,
        right: 10,
        minWidth: 30,
        paddingHorizontal: 7,
        paddingVertical: 3,
        borderRadius: radius.inner,
        backgroundColor: colors.surface0,
        borderColor: colors.accent,
        borderWidth: StyleSheet.hairlineWidth,
        alignItems: 'center',
    },
    scoreText: {
        fontFamily: font.display,
        fontSize: size.caption,
        color: colors.accentInk,
    },
    body: { padding: 14, gap: 6 },
    category: {
        fontFamily: font.display,
        fontSize: 9,
        letterSpacing: 1.2,
        textTransform: 'uppercase',
        color: colors.inkLow,
    },
    title: {
        fontFamily: font.display,
        fontSize: 15,
        lineHeight: 19,
        color: colors.inkHi,
    },
    excerpt: {
        fontFamily: font.body,
        fontSize: 12,
        lineHeight: 16.5,
        color: colors.inkLow,
    },
    reason: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
    reasonText: { flex: 1, fontFamily: font.body, fontSize: 11, color: colors.accentInk },
    meta: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: space.sm,
        marginTop: 6,
    },
    metaBit: { flexDirection: 'row', alignItems: 'center', gap: 5, flexShrink: 1 },
    metaText: {
        fontFamily: font.mono,
        fontSize: 10,
        color: colors.inkLow,
        flexShrink: 1,
    },
});
