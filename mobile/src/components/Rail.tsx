import { Image } from 'expo-image';
import { router } from 'expo-router';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { Eyebrow } from '@/components/Screen';
import type { Article } from '@/lib/content';
import { colors, font, radius, size, space } from '@/theme/tokens';

/**
 * A section of the front page, read sideways.
 *
 * The site stacks its sections down the page — hero, discovery, editorial, the
 * review wall — which is right for a screen a metre wide and wrong for one
 * held in a hand: stacked, those same six sections were ten screens of
 * scrolling before anybody reached the end, which is what the mobile-web audit
 * measured in August.
 *
 * Sideways keeps the shape. A reader sees that there *is* a Reviews section
 * without having to scroll past it, and the rhythm of the site survives the
 * change of shape rather than being flattened into one undifferentiated list —
 * which is what this feed did until now, and why it stopped looking like the
 * front page it was built from.
 */
export function Rail({
    title,
    articles,
    variant = 'card',
}: {
    title: string;
    articles: Article[];
    /** `score` puts the review number on the cover, where a review wall has it. */
    variant?: 'card' | 'score';
}) {
    if (!articles.length) { return null; }

    return (
        <View style={styles.section}>
            <View style={styles.head}>
                <Eyebrow tone="accent">{title}</Eyebrow>
            </View>

            <FlatList
                horizontal
                data={articles}
                keyExtractor={(item) => String(item.id)}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.rail}
                /* Cards land on their own edge rather than stopping halfway
                   through one, which is the difference between a rail that
                   feels built and a row that happens to scroll. */
                snapToInterval={CARD + space.md}
                decelerationRate="fast"
                renderItem={({ item }) => (
                    <Pressable
                        onPress={() => router.push(`/news/${item.slug}`)}
                        style={({ pressed }) => [styles.card, pressed && { opacity: 0.75 }]}
                        accessibilityRole="button"
                        accessibilityLabel={item.title}
                    >
                        <View>
                            {item.featured_image_url ? (
                                <Image
                                    source={{ uri: item.featured_image_url }}
                                    style={styles.cover}
                                    contentFit="cover"
                                    transition={140}
                                />
                            ) : (
                                <View style={[styles.cover, styles.coverEmpty]} />
                            )}

                            {variant === 'score' && item.review_score != null && (
                                <View style={styles.score}>
                                    <Text style={styles.scoreText}>{item.review_score}</Text>
                                </View>
                            )}
                        </View>

                        <Text style={styles.title} numberOfLines={3}>{item.title}</Text>
                        {item.published_at_human && (
                            <Text style={styles.meta}>{item.published_at_human}</Text>
                        )}
                    </Pressable>
                )}
            />
        </View>
    );
}

/** Wide enough for a legible title at three lines, narrow enough that the next
 *  card peeks — which is what tells somebody the row scrolls at all. */
const CARD = 210;

const styles = StyleSheet.create({
    section: { gap: space.sm },
    head: { paddingHorizontal: space.lg },
    rail: { paddingHorizontal: space.lg, gap: space.md },
    card: { width: CARD, gap: 6 },
    cover: {
        width: CARD,
        height: 118,
        borderRadius: radius.card,
        backgroundColor: colors.surface2,
    },
    coverEmpty: { backgroundColor: colors.surface2 },
    score: {
        position: 'absolute',
        bottom: 8,
        left: 8,
        minWidth: 30,
        paddingHorizontal: 7,
        paddingVertical: 3,
        borderRadius: radius.inner,
        backgroundColor: colors.surface0,
        borderColor: colors.accent,
        borderWidth: StyleSheet.hairlineWidth,
    },
    scoreText: {
        fontFamily: font.display,
        fontSize: size.caption,
        color: colors.accentInk,
        textAlign: 'center',
    },
    title: {
        fontFamily: font.bodySemi,
        fontSize: size.small,
        lineHeight: size.small * 1.32,
        color: colors.inkHi,
    },
    meta: { fontFamily: font.mono, fontSize: 11, color: colors.inkLow },
});
