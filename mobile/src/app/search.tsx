import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';

import { Body, Eyebrow, Notice, Screen } from '@/components/Screen';
import { api } from '@/lib/api';
import { colors, font, radius, size, space, TOUCH_TARGET } from '@/theme/tokens';

/**
 * Both search endpoints answer in the same shape — `{ results, count }` with
 * the same eight fields — which is the one piece of consistency in this API
 * and worth not throwing away.
 */
interface Hit {
    id: number;
    title: string;
    slug: string;
    excerpt: string | null;
    image: string | null;
    category: string | null;
    type: string;
}

interface Bucket {
    results: Hit[];
    count: number;
}

type Scope = 'articles' | 'games';

/**
 * Search across the two things worth searching.
 *
 * 638 articles and 333,198 games, and until now no way to reach any of them
 * from the app but scrolling. The catalogue is the reason to search: nobody
 * scrolls to a game.
 */
export default function SearchScreen() {
    const [term, setTerm] = useState('');
    const [scope, setScope] = useState<Scope>('games');
    const [hits, setHits] = useState<Hit[]>([]);
    const [count, setCount] = useState(0);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searched, setSearched] = useState(false);

    /*
     * The request in flight, so a slower earlier one cannot overwrite a
     * faster later one. Typing "wit", "witc", "witch" starts three searches
     * and they do not come back in order — without this the results can end
     * up being for a term the reader has already moved past.
     */
    const inFlight = useRef<AbortController | null>(null);

    const run = useCallback(async (q: string, where: Scope) => {
        inFlight.current?.abort();

        if (q.trim().length < 2) {
            setHits([]);
            setCount(0);
            setSearched(false);
            setBusy(false);

            return;
        }

        const controller = new AbortController();
        inFlight.current = controller;

        setBusy(true);
        setError(null);

        try {
            const bucket = await api<Bucket>(
                `/search/${where}?q=${encodeURIComponent(q.trim())}`,
                { auth: false, signal: controller.signal, raw: true }
            );

            if (controller.signal.aborted) { return; }

            setHits(bucket.results ?? []);
            setCount(bucket.count ?? 0);
            setSearched(true);
        } catch (e) {
            if (controller.signal.aborted) { return; }

            setError(e instanceof Error ? e.message : 'Search is not answering.');
        } finally {
            if (!controller.signal.aborted) { setBusy(false); }
        }
    }, []);

    /*
     * A pause before asking.
     *
     * Searching on every keystroke across a catalogue of 333,198 rows is a
     * query per letter for a term nobody has finished typing. 350ms is long
     * enough to let a word land and short enough that nobody waits for it.
     */
    useEffect(() => {
        const timer = setTimeout(() => run(term, scope), 350);

        return () => clearTimeout(timer);
    }, [term, scope, run]);

    useEffect(() => () => inFlight.current?.abort(), []);

    return (
        <Screen>
            <View style={styles.bar}>
                <Pressable
                    onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))}
                    hitSlop={12}
                    style={styles.barButton}
                    accessibilityRole="button"
                    accessibilityLabel="Back"
                >
                    <Text style={styles.barGlyph}>‹</Text>
                </Pressable>

                <TextInput
                    style={styles.input}
                    value={term}
                    onChangeText={setTerm}
                    placeholder={scope === 'games' ? 'Search 333,198 games' : 'Search articles'}
                    placeholderTextColor={colors.inkFaint}
                    autoFocus
                    autoCorrect={false}
                    autoCapitalize="none"
                    returnKeyType="search"
                    clearButtonMode="while-editing"
                    onSubmitEditing={() => run(term, scope)}
                />
            </View>

            <View style={styles.scopes}>
                {(['games', 'articles'] as Scope[]).map((s) => {
                    const on = scope === s;

                    return (
                        <Pressable
                            key={s}
                            onPress={() => setScope(s)}
                            style={[styles.chip, on && styles.chipOn]}
                            accessibilityRole="button"
                            accessibilityState={{ selected: on }}
                        >
                            <Text style={[styles.chipText, on && styles.chipTextOn]}>
                                {s === 'games' ? 'Games' : 'Articles'}
                            </Text>
                        </Pressable>
                    );
                })}

                {searched && !busy && (
                    <Text style={styles.count}>
                        {count.toLocaleString('en-GB')} {count === 1 ? 'result' : 'results'}
                    </Text>
                )}
            </View>

            {error ? (
                <View style={styles.pad}><Notice text={error} /></View>
            ) : busy && hits.length === 0 ? (
                <View style={styles.centre}><ActivityIndicator color={colors.accentInk} /></View>
            ) : (
                <FlatList
                    data={hits}
                    keyExtractor={(item) => `${item.type}-${item.id}`}
                    contentContainerStyle={styles.list}
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode="on-drag"
                    ListEmptyComponent={
                        <View style={styles.pad}>
                            <Body>
                                {term.trim().length < 2
                                    ? 'Type at least two letters.'
                                    : searched
                                        ? `Nothing matched “${term.trim()}”.`
                                        : ''}
                            </Body>
                        </View>
                    }
                    renderItem={({ item }) => (
                        <Pressable
                            onPress={() =>
                                router.push(scope === 'games' ? `/game/${item.slug}` : `/article/${item.slug}`)
                            }
                            style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.surface2 }]}
                            accessibilityRole="button"
                            accessibilityLabel={item.title}
                        >
                            {item.image ? (
                                <Image source={{ uri: item.image }} style={styles.thumb} contentFit="cover" transition={120} />
                            ) : (
                                <View style={[styles.thumb, styles.thumbEmpty]}>
                                    <Text style={styles.thumbLetter}>{item.title.charAt(0).toUpperCase()}</Text>
                                </View>
                            )}

                            <View style={{ flex: 1, gap: 2 }}>
                                {item.category && <Eyebrow>{item.category}</Eyebrow>}
                                <Text style={styles.rowTitle} numberOfLines={2}>{item.title}</Text>
                            </View>
                        </Pressable>
                    )}
                />
            )}
        </Screen>
    );
}

const styles = StyleSheet.create({
    bar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingRight: space.lg,
        paddingLeft: space.sm,
        paddingBottom: space.sm,
        gap: space.sm,
    },
    barButton: { width: TOUCH_TARGET, height: TOUCH_TARGET, alignItems: 'center', justifyContent: 'center' },
    barGlyph: { fontSize: 30, lineHeight: 34, color: colors.inkHi },
    input: {
        flex: 1,
        height: TOUCH_TARGET,
        backgroundColor: colors.surface2,
        borderColor: colors.line,
        borderWidth: StyleSheet.hairlineWidth,
        borderRadius: radius.card,
        paddingHorizontal: space.lg,
        fontFamily: font.body,
        fontSize: size.body,
        color: colors.inkHi,
    },
    scopes: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: space.sm,
        paddingHorizontal: space.lg,
        paddingBottom: space.md,
    },
    chip: {
        height: 32,
        paddingHorizontal: 14,
        borderRadius: radius.card,
        borderColor: colors.lineStrong,
        borderWidth: StyleSheet.hairlineWidth,
        alignItems: 'center',
        justifyContent: 'center',
    },
    chipOn: { backgroundColor: colors.accentSoft, borderColor: colors.accent },
    chipText: {
        fontFamily: font.display,
        fontSize: 11,
        letterSpacing: 1,
        textTransform: 'uppercase',
        color: colors.inkLow,
    },
    chipTextOn: { color: colors.accentInk },
    count: { marginLeft: 'auto', fontFamily: font.mono, fontSize: size.caption, color: colors.inkLow },
    centre: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    pad: { padding: space.lg },
    list: { paddingHorizontal: space.lg, paddingBottom: space.xxl, gap: space.sm },
    row: {
        flexDirection: 'row',
        gap: space.md,
        alignItems: 'center',
        padding: space.sm,
        borderRadius: radius.card,
        minHeight: TOUCH_TARGET + 12,
    },
    thumb: { width: 44, height: 58, borderRadius: radius.inner, backgroundColor: colors.surface2 },
    thumbEmpty: { alignItems: 'center', justifyContent: 'center' },
    thumbLetter: { fontFamily: font.display, fontSize: size.lead, color: colors.inkFaint },
    rowTitle: {
        fontFamily: font.bodyMedium,
        fontSize: size.small,
        lineHeight: size.small * 1.35,
        color: colors.inkHi,
    },
});
