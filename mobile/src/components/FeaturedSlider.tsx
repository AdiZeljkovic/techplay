import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import {
    Dimensions,
    FlatList,
    Pressable,
    StyleSheet,
    Text,
    View,
    type NativeScrollEvent,
    type NativeSyntheticEvent,
} from 'react-native';

import type { Article } from '@/lib/content';
import { colors, font, radius, space } from '@/theme/tokens';

/**
 * The featured slider, as the site has it.
 *
 * A FEATURED badge, the byline, dots, and "01 / 05" in the corner. The app
 * showed one static lead card instead, which loses the thing the counter is
 * for: knowing there are four more without having to find out by scrolling.
 *
 * Paged rather than free-scrolling, because five items with a counter is a
 * deck — landing between two of them would make the counter a lie.
 */
export function FeaturedSlider({ articles }: { articles: Article[] }) {
    const [index, setIndex] = useState(0);
    const width = useRef(Dimensions.get('window').width - space.lg * 2).current;

    if (!articles.length) { return null; }

    function onScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
        const next = Math.round(event.nativeEvent.contentOffset.x / (width + space.md));

        if (next !== index) { setIndex(next); }
    }

    return (
        <View style={styles.wrap}>
            <FlatList
                horizontal
                data={articles}
                keyExtractor={(item) => String(item.id)}
                showsHorizontalScrollIndicator={false}
                snapToInterval={width + space.md}
                decelerationRate="fast"
                contentContainerStyle={styles.rail}
                onMomentumScrollEnd={onScroll}
                renderItem={({ item }) => (
                    <Pressable
                        onPress={() => router.push(`/news/${item.slug}`)}
                        style={({ pressed }) => [styles.slide, { width }, pressed && { opacity: 0.85 }]}
                        accessibilityRole="button"
                        accessibilityLabel={item.title}
                    >
                        {item.featured_image_url && (
                            <Image
                                source={{ uri: item.featured_image_url }}
                                style={styles.cover}
                                contentFit="cover"
                                transition={160}
                                accessibilityLabel={item.featured_image_alt ?? undefined}
                            />
                        )}

                        {/* A scrim, so white type over somebody's cover art is
                            legible whatever the art happens to be. Without it
                            a pale hero image eats the headline. */}
                        <View style={styles.scrim} />

                        {/* Only the badge sits on the open image, and it has
                            its own crimson fill. The category moved down into
                            the scrim: grey type over somebody's cover art is
                            unreadable exactly when the art is good. */}
                        <View style={styles.badgeRow}>
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>Featured</Text>
                            </View>
                        </View>

                        <View style={styles.body}>
                            {item.category && (
                                <Text style={styles.category}>{item.category.name}</Text>
                            )}
                            <Text style={styles.title} numberOfLines={3}>{item.title}</Text>
                            <Text style={styles.meta} numberOfLines={1}>
                                {[
                                    item.author?.name || item.author?.username,
                                    item.published_at_human,
                                    item.reading_time,
                                ].filter(Boolean).join('   ')}
                            </Text>
                        </View>
                    </Pressable>
                )}
            />

            <View style={styles.footer}>
                <View style={styles.dots}>
                    {articles.map((article, i) => (
                        <View
                            key={article.id}
                            style={[styles.dot, i === index && styles.dotOn]}
                        />
                    ))}
                </View>

                {/* Zero-padded, as the site prints it: 01 / 05 lines up as the
                    slider moves, where 1 / 5 shifts a character. */}
                <Text style={styles.counter}>
                    {String(index + 1).padStart(2, '0')} / {String(articles.length).padStart(2, '0')}
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    wrap: { gap: space.sm },
    rail: { paddingHorizontal: space.lg, gap: space.md },
    slide: {
        height: 230,
        borderRadius: radius.panel,
        overflow: 'hidden',
        backgroundColor: colors.surface2,
        justifyContent: 'flex-end',
    },
    cover: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
    scrim: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: '62%',
        backgroundColor: 'rgba(5, 7, 10, 0.86)',
    },
    badgeRow: {
        position: 'absolute',
        top: space.md,
        left: space.md,
        flexDirection: 'row',
        alignItems: 'center',
        gap: space.sm,
    },
    badge: {
        backgroundColor: colors.accent,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: radius.inner,
    },
    badgeText: {
        fontFamily: font.display,
        fontSize: 9,
        letterSpacing: 1.3,
        textTransform: 'uppercase',
        color: colors.inkHi,
    },
    category: {
        fontFamily: font.display,
        fontSize: 10,
        letterSpacing: 1.4,
        textTransform: 'uppercase',
        color: colors.accentInk,
        marginBottom: 2,
    },
    body: { padding: space.md, gap: 4 },
    title: {
        fontFamily: font.display,
        fontSize: 20,
        lineHeight: 25,
        letterSpacing: -0.3,
        color: colors.inkHi,
    },
    meta: { fontFamily: font.mono, fontSize: 11, color: colors.inkLow },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: space.lg,
    },
    dots: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    dot: {
        width: 5,
        height: 5,
        borderRadius: 2.5,
        backgroundColor: colors.lineStrong,
    },
    /* The current one is a bar rather than a bigger dot — the site draws it
       that way, and a row of dots with one wider reads as position rather
       than as a dot somebody enlarged. */
    dotOn: { width: 18, borderRadius: 2, backgroundColor: colors.accent },
    counter: { fontFamily: font.mono, fontSize: 11, color: colors.inkLow },
});
