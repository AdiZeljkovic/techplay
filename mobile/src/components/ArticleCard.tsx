import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Eyebrow } from '@/components/Screen';
import type { Article } from '@/lib/content';
import { colors, font, radius, size, space } from '@/theme/tokens';

/**
 * One card, used by every list.
 *
 * It was written twice within an hour of the feed existing — once for the
 * front page and again for the news list — which is exactly how two lists
 * come to disagree about what an article looks like. One component, two
 * sizes.
 */
export function ArticleCard({ article, lead = false }: { article: Article; lead?: boolean }) {
    const meta = [article.published_at_human, article.reading_time ? `${article.reading_time} min` : null]
        .filter(Boolean)
        .join('  ·  ');

    return (
        <Pressable
            onPress={() => router.push(`/article/${article.slug}`)}
            style={({ pressed }) => [styles.card, pressed && { backgroundColor: colors.surface2 }]}
            accessibilityRole="button"
            accessibilityLabel={article.title}
        >
            {article.featured_image_url && (
                <Image
                    source={{ uri: article.featured_image_url }}
                    style={[styles.cover, lead && styles.coverLead]}
                    contentFit="cover"
                    placeholder={{ blurhash: 'L02rjT00000000000000000000' }}
                    transition={160}
                    accessibilityLabel={article.featured_image_alt ?? undefined}
                />
            )}
            <View style={styles.body}>
                {article.category && <Eyebrow tone="accent">{article.category.name}</Eyebrow>}
                <Text style={[styles.title, lead && styles.titleLead]} numberOfLines={lead ? 4 : 3}>
                    {article.title}
                </Text>
                {meta.length > 0 && <Text style={styles.meta}>{meta}</Text>}
            </View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: colors.surface1,
        borderColor: colors.line,
        borderWidth: StyleSheet.hairlineWidth,
        borderRadius: radius.panel,
        overflow: 'hidden',
    },
    cover: { width: '100%', height: 150, backgroundColor: colors.surface2 },
    coverLead: { height: 210 },
    body: { padding: space.lg, gap: space.xs },
    title: {
        fontFamily: font.bodySemi,
        fontSize: size.lead,
        lineHeight: size.lead * 1.32,
        color: colors.inkHi,
    },
    titleLead: {
        fontFamily: font.display,
        fontSize: size.title,
        lineHeight: size.title * 1.22,
    },
    meta: {
        fontFamily: font.mono,
        fontSize: size.caption,
        color: colors.inkLow,
        marginTop: 2,
    },
});
