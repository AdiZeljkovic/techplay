import { router } from 'expo-router';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { CommandButton } from '@/components/CommandButton';
import {
    BookOpenMark,
    CompassMark,
    CpuMark,
    Disc3Mark,
    GamepadMark,
    GiftMark,
    LifeBuoyMark,
    MapPinnedMark,
    NewspaperMark,
    SettingsMark,
    ShieldHalfMark,
    ShoppingCartMark,
    SwordsMark,
    TrophyMark,
    UsersMark,
    XMark,
    type MarkProps,
} from '@/components/Marks';
import { useAuth } from '@/context/AuthContext';
import { colors, font, radius, space, TOUCH_TARGET } from '@/theme/tokens';

/**
 * More — everything the five tabs do not carry.
 *
 * This is the site's `MoreSheet.tsx`, group for group: Sections as a two-up
 * chip grid, then Community, then Tools, then Shop as bordered row groups,
 * with sign-out pinned below the scroll — because, as that file puts it,
 * signing out has to live somewhere and hunting for it inside the profile page
 * is not somewhere.
 *
 * The first version of this file listed three rows and left the other eleven
 * destinations out, on the reasoning that a menu row which opens a browser is
 * a row that lied about being part of the app. The reasoning was fine and the
 * conclusion was wrong: what it produced was an app whose own menu disagreed
 * with the site's, which is worse than either.
 *
 * So all fourteen are here, and they split three ways by what the app can
 * actually do:
 *
 *   native now       the four sections, on their own endpoints
 *   in-app web view  the ten that have no screen yet — inside our frame,
 *                    with our back arrow, not thrown to the phone's browser
 *   its own host     the Help Centre, which is a subdomain by design
 *
 * Each web-view row earns a native screen eventually. This is what it looks
 * like until then, not instead of it.
 */

const HELP_HOST = 'https://help.techplay.gg';

type Chip = { label: string; Mark: (p: MarkProps) => React.JSX.Element; go: () => void };
type Row = Chip & { hint: string };

/** `/latest` on the site is the Feed tab; these are the four it mixes. */
const SECTIONS: Array<{ label: string; slug: string; Mark: (p: MarkProps) => React.JSX.Element }> = [
    { label: 'News', slug: 'news', Mark: NewspaperMark },
    { label: 'Reviews', slug: 'reviews', Mark: GamepadMark },
    { label: 'Tech', slug: 'tech', Mark: CpuMark },
    { label: 'Guides', slug: 'guides', Mark: BookOpenMark },
];

const COMMUNITY: Array<{ label: string; hint: string; path: string; Mark: (p: MarkProps) => React.JSX.Element }> = [
    { label: 'Leaderboard', hint: 'Top gamers by XP and reputation', path: '/leaderboard', Mark: TrophyMark },
    { label: 'Social Hub', hint: 'Chat, friends and squads', path: '/social', Mark: UsersMark },
    { label: 'Giveaways', hint: 'Win games and gear', path: '/giveaways', Mark: GiftMark },
    { label: 'Frontiers', hint: 'Clans, territory, resources', path: '/frontiers', Mark: SwordsMark },
];

const TOOLS: Array<{ label: string; hint: string; path: string; Mark: (p: MarkProps) => React.JSX.Element }> = [
    { label: 'WoW Analyzer', hint: 'Character readiness check', path: '/wow-analyzer', Mark: ShieldHalfMark },
    { label: 'Backlog Advisor', hint: 'What should you play next?', path: '/backlog-advisor', Mark: CompassMark },
    { label: 'GTA 6 Hub', hint: 'Map, characters, vehicles, weapons', path: '/gta6', Mark: MapPinnedMark },
    { label: 'The Last Disc', hint: 'Open letter: keep physical games', path: '/last-disc', Mark: Disc3Mark },
    // Its own hostname, so the path is absolute — a bare path here would land
    // on a page of the main site that does not exist.
    { label: 'Help Centre', hint: 'Accounts, connected platforms, XP and your data', path: HELP_HOST, Mark: LifeBuoyMark },
];

const SHOP = { label: 'Shop', hint: 'Merch, keys and gear', path: '/shop', Mark: ShoppingCartMark };

export function MoreSheet({ onClose }: { onClose: () => void }) {
    const { user, signOut } = useAuth();

    function open(to: string) {
        onClose();
        router.push(to as never);
    }

    const page = (path: string, title: string) =>
        () => open(`/web?path=${encodeURIComponent(path)}&title=${encodeURIComponent(title)}`);

    const rows = (items: typeof COMMUNITY): Row[] =>
        items.map((r) => ({ label: r.label, hint: r.hint, Mark: r.Mark, go: page(r.path, r.label) }));

    return (
        <Modal visible transparent animationType="slide" onRequestClose={onClose}>
            <Pressable style={styles.scrim} onPress={onClose} accessibilityLabel="Close" />

            <View style={styles.sheet}>
                <View style={styles.head}>
                    <Text style={styles.heading}>More</Text>

                    <Pressable
                        onPress={onClose}
                        hitSlop={12}
                        style={styles.close}
                        accessibilityRole="button"
                        accessibilityLabel="Close"
                    >
                        <XMark size={20} color={colors.inkMid} />
                    </Pressable>
                </View>

                <ScrollView
                    contentContainerStyle={styles.scroll}
                    showsVerticalScrollIndicator={false}
                >
                    <Group label="Sections">
                        {/* A grid, not a wrap. The site's own note: four chips
                            of unequal width break 3 + 1, and the lone one on
                            the second row reads as something left over. */}
                        <View style={styles.chips}>
                            {SECTIONS.map((s) => (
                                <Pressable
                                    key={s.slug}
                                    onPress={() => open(`/section/${s.slug}`)}
                                    style={({ pressed }) => [styles.chip, pressed && styles.chipOn]}
                                    accessibilityRole="button"
                                    accessibilityLabel={s.label}
                                >
                                    <s.Mark size={15} color={colors.accent} />
                                    <Text style={styles.chipText}>{s.label}</Text>
                                </Pressable>
                            ))}
                        </View>
                    </Group>

                    <Group label="Community"><Rows items={rows(COMMUNITY)} /></Group>
                    <Group label="Tools"><Rows items={rows(TOOLS)} /></Group>
                    <Group label="Shop">
                        <Rows items={rows([SHOP])} />
                    </Group>
                </ScrollView>

                {/* Pinned below the scroll, so it is never the thing you have
                    to reach the bottom of four groups to find. */}
                <View style={styles.footer}>
                    {user ? (
                        <>
                            <CommandButton
                                label="Settings"
                                variant="quiet"
                                compact
                                behind={colors.surface1}
                                style={styles.footerButton}
                                trailing={<SettingsMark size={13} color={colors.inkHi} />}
                                onPress={page('/settings', 'Settings')}
                            />
                            <CommandButton
                                label="Sign out"
                                compact
                                behind={colors.surface1}
                                style={styles.footerButton}
                                onPress={() => { onClose(); signOut(); }}
                            />
                        </>
                    ) : (
                        <>
                            <CommandButton
                                label="Sign in"
                                compact
                                behind={colors.surface1}
                                style={styles.footerButton}
                                onPress={() => open('/sign-in')}
                            />
                            <CommandButton
                                label="Register"
                                variant="quiet"
                                compact
                                behind={colors.surface1}
                                style={styles.footerButton}
                                onPress={() => open('/register')}
                            />
                        </>
                    )}
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

function Rows({ items }: { items: Row[] }) {
    return (
        <View style={styles.rows}>
            {items.map((r, i) => (
                <Pressable
                    key={r.label}
                    onPress={r.go}
                    style={({ pressed }) => [
                        styles.row,
                        i > 0 && styles.rowDivided,
                        pressed && { backgroundColor: colors.fill1 },
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={`${r.label}. ${r.hint}`}
                >
                    <r.Mark size={22} color={colors.accent} />

                    <View style={styles.rowBody}>
                        <Text style={styles.rowLabel}>{r.label}</Text>
                        <Text style={styles.rowHint} numberOfLines={1}>{r.hint}</Text>
                    </View>
                </Pressable>
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    scrim: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.6)' },
    sheet: {
        // The site caps this at 82dvh. Four groups do not fit on a phone and
        // are not meant to: the sheet scrolls and the footer does not.
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
        width: '48.4%',
        flexGrow: 1,
        height: TOUCH_TARGET,
        flexDirection: 'row',
        alignItems: 'center',
        gap: space.sm,
        paddingHorizontal: 14,
        borderRadius: radius.card,
        borderColor: colors.line,
        borderWidth: StyleSheet.hairlineWidth,
        backgroundColor: colors.fill1,
    },
    chipOn: { borderColor: colors.accent, backgroundColor: colors.surface2 },
    chipText: {
        fontFamily: font.display,
        fontSize: 10.5,
        letterSpacing: 1.1,
        textTransform: 'uppercase',
        color: colors.inkMid,
    },
    rows: {
        borderRadius: radius.panel,
        borderColor: colors.line,
        borderWidth: StyleSheet.hairlineWidth,
        backgroundColor: colors.surface2,
        overflow: 'hidden',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        // 52: past the 44 floor without the row turning into a card.
        minHeight: 52,
        paddingHorizontal: 14,
        paddingVertical: 10,
    },
    rowDivided: {
        borderTopColor: colors.line,
        borderTopWidth: StyleSheet.hairlineWidth,
    },
    rowBody: { flex: 1, gap: 2 },
    rowLabel: {
        fontFamily: font.display,
        fontSize: 12.5,
        color: colors.inkHi,
    },
    rowHint: {
        fontFamily: font.body,
        fontSize: 11,
        color: colors.inkLow,
    },
    footer: {
        flexDirection: 'row',
        gap: space.sm,
        paddingHorizontal: space.lg,
        paddingTop: space.md,
        paddingBottom: space.xl,
        borderTopColor: colors.line,
        borderTopWidth: StyleSheet.hairlineWidth,
        backgroundColor: colors.surface1,
    },
    footerButton: { flex: 1 },
});
