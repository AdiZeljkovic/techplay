import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { CheckMark, XMark } from '@/components/Marks';
import type { Filters, Hub } from '@/lib/catalogue';
import { colors, font, radius, space, TOUCH_TARGET } from '@/theme/tokens';

/**
 * The catalogue's filters, as a sheet.
 *
 * The site puts these in a rail on a desktop and a sheet on a phone, which is
 * the right split and the one this follows. Four questions — genre, platform,
 * era, status — and every option carries its count, because "Indie (90,369)"
 * and "Gambling (1,402)" are different offers and a bare list hides that.
 *
 * The options are the API's, not a list written here: they come from
 * `/games/hub` facets, so a genre added to the catalogue appears without an
 * app release. A hardcoded list would be a promise the database stops keeping.
 */
export function CatalogueFilters({
    hub,
    value,
    onChange,
    onClose,
}: {
    hub: Hub | null;
    value: Filters;
    onChange: (next: Filters) => void;
    onClose: () => void;
}) {
    const facets = hub?.facets;

    /** Choosing what is already chosen clears it — a filter with no way off is a trap. */
    function toggle<K extends keyof Filters>(key: K, next: Filters[K]) {
        onChange({ ...value, [key]: value[key] === next ? (key === 'status' ? 'all' : null) : next });
    }

    const anything = !!(value.genre || value.platform || value.era || value.status !== 'all');

    return (
        <Modal visible transparent animationType="slide" onRequestClose={onClose}>
            <Pressable style={styles.scrim} onPress={onClose} accessibilityLabel="Close" />

            <View style={styles.sheet}>
                <View style={styles.head}>
                    <Text style={styles.heading}>Filters</Text>

                    <View style={styles.headActions}>
                        {anything && (
                            <Pressable
                                onPress={() => onChange({ ...value, genre: null, platform: null, era: null, status: 'all' })}
                                hitSlop={8}
                                accessibilityRole="button"
                            >
                                <Text style={styles.clear}>Clear all</Text>
                            </Pressable>
                        )}

                        <Pressable onPress={onClose} hitSlop={12} style={styles.close} accessibilityRole="button" accessibilityLabel="Close">
                            <XMark size={20} color={colors.inkMid} />
                        </Pressable>
                    </View>
                </View>

                <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                    <Group label="Status">
                        <Chips
                            options={(facets?.status ?? []).map((s) => ({ id: s.key, label: s.label, count: s.count }))}
                            selected={value.status}
                            onPick={(id) => onChange({ ...value, status: id })}
                        />
                    </Group>

                    <Group label="Platform">
                        {/*
                          * The label, not the key.
                          *
                          * `platforms=` matches on the platform's name — sending
                          * the facet's key returns zero rows, silently, with a
                          * 200. The site sends `p.label` here for the same
                          * reason; era and status are the other way round and
                          * take their keys.
                          *
                          * The counts beside these come from the facet, which
                          * groups a family — PlayStation, PS2, PS4, PS5 — while
                          * the filter matches one name, so the number shown is
                          * larger than the list that arrives. That mismatch is
                          * the site's too and is not introduced here.
                          */}
                        <Chips
                            options={(facets?.platforms ?? []).map((p) => ({ id: p.label, label: p.label, count: p.count }))}
                            selected={value.platform}
                            onPick={(id) => toggle('platform', id)}
                        />
                    </Group>

                    <Group label="Era">
                        <Chips
                            options={(facets?.eras ?? []).map((e) => ({ id: e.key, label: e.label, count: e.count }))}
                            selected={value.era}
                            onPick={(id) => toggle('era', id)}
                        />
                    </Group>

                    <Group label="Genre">
                        {/* Every genre the catalogue has, not a chosen dozen.
                            The list is long and it is ordered by count, so the
                            useful ones are already at the top. */}
                        <Chips
                            options={(facets?.genres ?? []).map((g) => ({ id: g.name, label: g.name, count: g.count }))}
                            selected={value.genre}
                            onPick={(id) => toggle('genre', id)}
                        />
                    </Group>
                </ScrollView>

                <View style={styles.footer}>
                    <Pressable
                        onPress={onClose}
                        style={({ pressed }) => [styles.done, pressed && { backgroundColor: colors.accentHover }]}
                        accessibilityRole="button"
                    >
                        <Text style={styles.doneText}>Show games</Text>
                    </Pressable>
                </View>
            </View>
        </Modal>
    );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <View style={styles.group}>
            <Text style={styles.groupLabel}>{label}</Text>
            {children}
        </View>
    );
}

function Chips({
    options,
    selected,
    onPick,
}: {
    options: { id: string; label: string; count: number }[];
    selected: string | null;
    onPick: (id: string) => void;
}) {
    return (
        <View style={styles.chips}>
            {options.map((o) => {
                const on = selected === o.id;

                return (
                    <Pressable
                        key={o.id}
                        onPress={() => onPick(o.id)}
                        style={({ pressed }) => [styles.chip, on && styles.chipOn, pressed && !on && { backgroundColor: colors.fill2 }]}
                        accessibilityRole="button"
                        accessibilityState={{ selected: on }}
                        accessibilityLabel={`${o.label}, ${o.count} games`}
                    >
                        {on && <CheckMark size={12} color={colors.inkHi} />}
                        <Text style={[styles.chipText, on && { color: colors.inkHi }]}>{o.label}</Text>
                        <Text style={[styles.chipCount, on && { color: 'rgba(255,255,255,0.7)' }]}>
                            {o.count.toLocaleString()}
                        </Text>
                    </Pressable>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    scrim: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.6)' },
    sheet: {
        maxHeight: '82%',
        backgroundColor: colors.surface1,
        borderTopLeftRadius: radius.sheet,
        borderTopRightRadius: radius.sheet,
        borderTopColor: colors.lineStrong,
        borderTopWidth: StyleSheet.hairlineWidth,
    },
    head: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingLeft: space.lg,
        paddingRight: space.sm,
        paddingTop: space.md,
        paddingBottom: space.sm,
    },
    heading: {
        fontFamily: font.display,
        fontSize: 13,
        letterSpacing: 1.6,
        textTransform: 'uppercase',
        color: colors.inkHi,
    },
    headActions: { flexDirection: 'row', alignItems: 'center', gap: space.md },
    clear: {
        fontFamily: font.display,
        fontSize: 10,
        letterSpacing: 1.1,
        textTransform: 'uppercase',
        color: colors.accentInk,
    },
    close: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    scroll: { paddingHorizontal: space.lg, paddingBottom: space.lg, gap: space.lg },
    group: { gap: space.sm },
    groupLabel: {
        fontFamily: font.display,
        fontSize: 8.5,
        letterSpacing: 1.7,
        textTransform: 'uppercase',
        color: colors.inkLow,
    },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        minHeight: 36,
        paddingHorizontal: 12,
        borderRadius: radius.card,
        borderColor: colors.line,
        borderWidth: StyleSheet.hairlineWidth,
        backgroundColor: colors.fill1,
    },
    chipOn: { backgroundColor: colors.accent, borderColor: colors.accent },
    chipText: {
        fontFamily: font.bodyMedium,
        fontSize: 12,
        color: colors.inkMid,
    },
    chipCount: {
        fontFamily: font.mono,
        fontSize: 9.5,
        color: colors.inkFaint,
    },
    footer: {
        paddingHorizontal: space.lg,
        paddingTop: space.md,
        paddingBottom: space.xl,
        borderTopColor: colors.line,
        borderTopWidth: StyleSheet.hairlineWidth,
    },
    done: {
        height: TOUCH_TARGET,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: radius.card,
        backgroundColor: colors.accent,
    },
    doneText: {
        fontFamily: font.display,
        fontSize: 12,
        letterSpacing: 1.3,
        textTransform: 'uppercase',
        color: colors.inkHi,
    },
});
