import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Pressable,
    RefreshControl,
    SectionList,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import { Button } from '@/components/Button';
import { Masthead } from '@/components/Masthead';
import { Body, Eyebrow, Notice, Screen, Title } from '@/components/Screen';
import { api } from '@/lib/api';
import { colors, font, radius, size, space } from '@/theme/tokens';

/**
 * What is coming out, by the day it lands.
 *
 * The reason this belongs in an app rather than only on the site: a release
 * date is a thing you check repeatedly and forget about in between. It is the
 * one screen here with a reason to be opened on a Tuesday when nothing has
 * been published — and it is what push notifications will eventually be for.
 */

interface Release {
    slug: string;
    name: string;
    released: string | null;
    cover_url: string | null;
    platforms: string[];
    publisher: string | null;
}

interface Day {
    date: string;
    day: number;
    weekday: string;
    games: Release[];
    total: number;
}

interface Calendar {
    month: { key: string; label: string; year: number; previous: string; next: string; is_current: boolean };
    days: Day[];
}

export default function CalendarTab() {
    const [month, setMonth] = useState<string | null>(null);
    const [calendar, setCalendar] = useState<Calendar | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async (key: string | null, signal?: AbortSignal) => {
        try {
            setCalendar(await api<Calendar>(`/calendar${key ? `?month=${key}` : ''}`, { auth: false, signal }));
            setError(null);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Could not load the calendar.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        const controller = new AbortController();
        load(month, controller.signal);

        return () => controller.abort();
    }, [load, month]);

    /*
     * Empty days are dropped.
     *
     * The endpoint returns every day of the month so a grid can draw them.
     * A phone is not a grid — it is a list, and eighteen headings with nothing
     * under them is scrolling through nothing to reach something.
     */
    const sections = (calendar?.days ?? [])
        .filter((d) => d.games.length > 0)
        .map((d) => ({ ...d, data: d.games }));

    return (
        <Screen>
            <Masthead />

            <View style={styles.header}>
                <View style={{ flex: 1 }}>
                    <Eyebrow tone="accent">Coming out</Eyebrow>
                    <Title style={{ fontSize: size.title }}>
                        {calendar ? `${calendar.month.label} ${calendar.month.year}` : 'Calendar'}
                    </Title>
                </View>

                {calendar && (
                    <View style={styles.nav}>
                        <Step label="‹" onPress={() => { setLoading(true); setMonth(calendar.month.previous); }} />
                        {!calendar.month.is_current && (
                            <Pressable
                                onPress={() => { setLoading(true); setMonth(null); }}
                                hitSlop={8}
                                accessibilityRole="button"
                                accessibilityLabel="This month"
                            >
                                <Text style={styles.today}>Today</Text>
                            </Pressable>
                        )}
                        <Step label="›" onPress={() => { setLoading(true); setMonth(calendar.month.next); }} />
                    </View>
                )}
            </View>

            {loading ? (
                <View style={styles.centre}><ActivityIndicator color={colors.accentInk} /></View>
            ) : (
                <SectionList
                    sections={sections}
                    keyExtractor={(item, index) => `${item.slug}-${index}`}
                    contentContainerStyle={styles.list}
                    stickySectionHeadersEnabled={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={() => { setRefreshing(true); load(month); }}
                            tintColor={colors.accentInk}
                        />
                    }
                    ListEmptyComponent={
                        error ? (
                            <View style={{ gap: space.lg }}>
                                <Notice text={error} />
                                <Button label="Try again" onPress={() => { setLoading(true); load(month); }} variant="quiet" />
                            </View>
                        ) : (
                            <Body>Nothing is dated this month.</Body>
                        )
                    }
                    renderSectionHeader={({ section }) => (
                        <View style={styles.dayHead}>
                            <Text style={styles.dayNumber}>{String(section.day).padStart(2, '0')}</Text>
                            <View>
                                <Text style={styles.weekday}>{section.weekday}</Text>
                                <Text style={styles.dayCount}>
                                    {section.total} {section.total === 1 ? 'release' : 'releases'}
                                </Text>
                            </View>
                        </View>
                    )}
                    renderItem={({ item }) => (
                        <Pressable
                            onPress={() => router.push(`/games/${item.slug}`)}
                            style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.surface2 }]}
                            accessibilityRole="button"
                            accessibilityLabel={item.name}
                        >
                            {item.cover_url ? (
                                <Image source={{ uri: item.cover_url }} style={styles.cover} contentFit="cover" transition={120} />
                            ) : (
                                <View style={[styles.cover, styles.coverEmpty]}>
                                    <Text style={styles.coverLetter}>{item.name.charAt(0).toUpperCase()}</Text>
                                </View>
                            )}

                            <View style={{ flex: 1, gap: 2 }}>
                                <Text style={styles.name} numberOfLines={2}>{item.name}</Text>
                                <Text style={styles.meta} numberOfLines={1}>
                                    {[item.publisher, item.platforms.slice(0, 3).join(', ')]
                                        .filter(Boolean)
                                        .join('  ·  ')}
                                </Text>
                            </View>
                        </Pressable>
                    )}
                />
            )}
        </Screen>
    );
}

function Step({ label, onPress }: { label: string; onPress: () => void }) {
    return (
        <Pressable
            onPress={onPress}
            hitSlop={10}
            style={styles.step}
            accessibilityRole="button"
            accessibilityLabel={label === '‹' ? 'Previous month' : 'Next month'}
        >
            <Text style={styles.stepGlyph}>{label}</Text>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: space.lg,
        paddingTop: space.sm,
        paddingBottom: space.md,
        gap: space.md,
    },
    nav: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
    step: {
        width: 36,
        height: 36,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: radius.card,
        borderColor: colors.lineStrong,
        borderWidth: StyleSheet.hairlineWidth,
    },
    stepGlyph: { fontSize: 22, lineHeight: 26, color: colors.inkMid },
    today: {
        fontFamily: font.display,
        fontSize: 10,
        letterSpacing: 1.2,
        textTransform: 'uppercase',
        color: colors.accentInk,
    },
    centre: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    list: { paddingHorizontal: space.lg, paddingBottom: space.xxl },
    dayHead: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: space.md,
        paddingTop: space.lg,
        paddingBottom: space.sm,
        backgroundColor: colors.surface0,
    },
    /* The date leads, in mono, because this list is read down the left edge —
       somebody scanning for "when" wants a column of numbers, not a column of
       titles with dates hidden inside them. */
    dayNumber: {
        fontFamily: font.mono,
        fontSize: 26,
        color: colors.accentInk,
        minWidth: 38,
    },
    weekday: {
        fontFamily: font.display,
        fontSize: size.label,
        letterSpacing: 1.3,
        textTransform: 'uppercase',
        color: colors.inkHi,
    },
    dayCount: { fontFamily: font.mono, fontSize: 11, color: colors.inkLow },
    row: {
        flexDirection: 'row',
        gap: space.md,
        alignItems: 'center',
        paddingVertical: space.sm,
        paddingHorizontal: space.sm,
        borderRadius: radius.card,
    },
    cover: { width: 42, height: 56, borderRadius: radius.inner, backgroundColor: colors.surface2 },
    coverEmpty: { alignItems: 'center', justifyContent: 'center' },
    coverLetter: { fontFamily: font.display, fontSize: size.lead, color: colors.inkFaint },
    name: {
        fontFamily: font.bodyMedium,
        fontSize: size.small,
        lineHeight: size.small * 1.3,
        color: colors.inkHi,
    },
    meta: { fontFamily: font.mono, fontSize: 11, color: colors.inkLow },
});
