import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Body, Eyebrow, Notice, Screen, Title } from '@/components/Screen';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { colors, font, radius, size, space } from '@/theme/tokens';

interface Profile {
    user: {
        username: string;
        display_name: string | null;
        avatar_url: string | null;
        xp: number;
        rank: { name: string; color: string } | null;
    };
    stats: {
        level: number;
        xp: number;
        joined_at: string;
        games_count: number;
        hours_played: number;
        achievements_count: number;
    };
}

export default function ProfileTab() {
    const { user, signOut } = useAuth();

    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async (signal?: AbortSignal) => {
        if (!user) { return; }

        try {
            setProfile(await api<Profile>(`/users/${user.username}`, { signal }));
            setError(null);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Could not load your profile.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [user]);

    useEffect(() => {
        const controller = new AbortController();
        load(controller.signal);

        return () => controller.abort();
    }, [load]);

    /*
     * Signed out, this tab is the invitation rather than an error.
     *
     * It is the one place in the app where an account buys something concrete,
     * so it is the place that asks — instead of a gate in front of the news,
     * which is what this app used to open with.
     */
    if (!user) {
        return (
            <Screen>
                <View style={styles.guest}>
                    <Eyebrow tone="accent">Not signed in</Eyebrow>
                    <Title style={{ fontSize: size.hero }}>
                        YOUR{'\n'}
                        <Text style={{ color: colors.accentInk }}>PROFILE</Text>
                    </Title>
                    <Body style={{ marginTop: space.sm }}>
                        Sign in for your shelf, your XP and rank, the games you have finished, and
                        everything you are following.
                    </Body>
                    <Button label="Sign in" onPress={() => router.push('/sign-in')} style={{ marginTop: space.lg }} />
                    <Button label="Create an account" variant="quiet" onPress={() => router.push('/register')} />
                    <Button label="Saved for offline" variant="quiet" onPress={() => router.push('/saved')} />
                </View>
            </Screen>
        );
    }

    if (loading) {
        return (
            <Screen>
                <View style={styles.centre}>
                    <ActivityIndicator color={colors.accentInk} />
                </View>
            </Screen>
        );
    }

    const stats = profile?.stats;

    return (
        <Screen>
            <ScrollView
                contentContainerStyle={styles.content}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => { setRefreshing(true); load(); }}
                        tintColor={colors.accentInk}
                    />
                }
            >
                <View style={styles.head}>
                    {profile?.user.avatar_url ? (
                        <Image source={{ uri: profile.user.avatar_url }} style={styles.avatar} contentFit="cover" transition={160} />
                    ) : (
                        <View style={[styles.avatar, styles.avatarEmpty]}>
                            <Text style={styles.avatarLetter}>
                                {(profile?.user.username ?? user?.username ?? '?').charAt(0).toUpperCase()}
                            </Text>
                        </View>
                    )}

                    <View style={{ flex: 1, gap: 2 }}>
                        {profile?.user.rank && (
                            <Text style={[styles.rank, { color: profile.user.rank.color }]}>
                                {profile.user.rank.name}
                            </Text>
                        )}
                        <Title style={{ fontSize: size.title }}>
                            {profile?.user.display_name || profile?.user.username || user?.username}
                        </Title>
                        {stats && <Text style={styles.joined}>Joined {stats.joined_at}</Text>}
                    </View>
                </View>

                {error && <Notice text={error} />}

                {stats && (
                    <>
                        {/*
                          * Level and XP lead because they are the thing this
                          * platform is built around — the shelf, the quests
                          * and the seasons all feed one number, and it is the
                          * reason somebody opens the app on a day when
                          * nothing was published.
                          */}
                        <View style={styles.levelPanel}>
                            <View style={styles.levelRow}>
                                <View>
                                    <Eyebrow>Level</Eyebrow>
                                    <Text style={styles.level}>{stats.level}</Text>
                                </View>
                                <View style={{ alignItems: 'flex-end' }}>
                                    <Eyebrow>Total XP</Eyebrow>
                                    <Text style={styles.xp}>{stats.xp.toLocaleString('en-GB')}</Text>
                                </View>
                            </View>
                        </View>

                        <View style={styles.tiles}>
                            {/* The games tile opens the shelf. A number that
                                cannot be tapped is a number somebody has to
                                go and find somewhere else. */}
                            <Tile
                                label="Games"
                                value={stats.games_count.toLocaleString('en-GB')}
                                onPress={() => router.push('/library')}
                            />
                            <Tile label="Hours" value={stats.hours_played.toLocaleString('en-GB')} />
                            <Tile label="Achievements" value={String(stats.achievements_count)} />
                        </View>

                        <Button label="Open your shelf" variant="quiet" onPress={() => router.push('/library')} />
                    </>
                )}

                <Button label="Saved for offline" variant="quiet" onPress={() => router.push('/saved')} />

                <View style={styles.rest}>
                    <Eyebrow>Still on the web</Eyebrow>
                    <Body style={{ fontSize: size.small }}>
                        Connected platforms, lists and settings live on techplay.gg for now.
                        They are coming here.
                    </Body>
                </View>

                <Button
                    label="Sign out"
                    variant="quiet"
                    onPress={async () => { await signOut(); router.replace('/sign-in'); }}
                />
            </ScrollView>
        </Screen>
    );
}

function Tile({ label, value, onPress }: { label: string; value: string; onPress?: () => void }) {
    const inner = (
        <>
            <Text style={styles.tileValue}>{value}</Text>
            <Eyebrow>{label}</Eyebrow>
        </>
    );

    if (!onPress) {
        return <View style={styles.tile}>{inner}</View>;
    }

    return (
        <Pressable
            onPress={onPress}
            style={({ pressed }) => [styles.tile, styles.tileLink, pressed && { backgroundColor: colors.surface2 }]}
            accessibilityRole="button"
            accessibilityLabel={`${label}: ${value}`}
        >
            {inner}
        </Pressable>
    );
}

const styles = StyleSheet.create({
    centre: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    guest: { flex: 1, justifyContent: 'center', padding: space.xl, gap: space.sm },
    content: { padding: space.lg, gap: space.lg, paddingBottom: space.xxl },
    head: { flexDirection: 'row', gap: space.lg, alignItems: 'center' },
    avatar: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: colors.surface2,
    },
    avatarEmpty: { alignItems: 'center', justifyContent: 'center' },
    avatarLetter: {
        fontFamily: font.display,
        fontSize: size.display,
        color: colors.accentInk,
    },
    rank: {
        fontFamily: font.display,
        fontSize: size.label,
        letterSpacing: 1.4,
        textTransform: 'uppercase',
    },
    joined: {
        fontFamily: font.mono,
        fontSize: size.caption,
        color: colors.inkLow,
    },
    levelPanel: {
        backgroundColor: colors.surface1,
        borderColor: colors.line,
        borderWidth: StyleSheet.hairlineWidth,
        borderRadius: radius.panel,
        padding: space.lg,
    },
    levelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
    level: {
        fontFamily: font.display,
        fontSize: 40,
        lineHeight: 44,
        color: colors.accentInk,
    },
    xp: {
        fontFamily: font.mono,
        fontSize: size.title,
        color: colors.inkHi,
    },
    tiles: { flexDirection: 'row', gap: space.md },
    tile: {
        flex: 1,
        backgroundColor: colors.surface1,
        borderColor: colors.line,
        borderWidth: StyleSheet.hairlineWidth,
        borderRadius: radius.panel,
        padding: space.md,
        gap: 2,
    },
    tileValue: {
        fontFamily: font.mono,
        fontSize: size.title,
        color: colors.inkHi,
    },
    tileLink: {
        borderColor: colors.lineStrong,
    },
    rest: {
        gap: space.sm,
        paddingTop: space.md,
        borderTopColor: colors.line,
        borderTopWidth: StyleSheet.hairlineWidth,
    },
});
