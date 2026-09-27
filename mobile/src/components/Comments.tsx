import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';

import { CommandButton } from '@/components/CommandButton';
import { Notice } from '@/components/Screen';
import { useAuth } from '@/context/AuthContext';
import {
    Comment,
    CommentableType,
    getComments,
    postComment,
    voteComment,
    when,
} from '@/lib/comments';
import { colors, font, radius, size, space } from '@/theme/tokens';

/**
 * The conversation under an article, which the app did not have at all.
 *
 * Replies are one level deep and stay that way. The API nests `replies` inside
 * a comment and the site draws them the same: a thread that can indent
 * forever is a thread that is unreadable on a 360pt screen by the third turn.
 */

const LIMIT = 1000;

export function Comments({
    type,
    id,
    title,
}: {
    type: CommentableType;
    id: number;
    title?: string;
}) {
    const { user } = useAuth();

    const [comments, setComments] = useState<Comment[]>([]);
    const [page, setPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [draft, setDraft] = useState('');
    const [replyTo, setReplyTo] = useState<Comment | null>(null);
    const [sending, setSending] = useState(false);

    const load = useCallback(
        async (which: number, signal?: AbortSignal) => {
            try {
                const result = await getComments(type, id, which, signal);

                if (signal?.aborted) return;

                setComments((prev) => (which === 1 ? result.items : [...prev, ...result.items]));
                setPage(result.page);
                setLastPage(result.lastPage);
                setError(null);
            } catch (e) {
                if (signal?.aborted) return;

                setError(e instanceof Error ? e.message : 'Could not load the comments.');
            } finally {
                if (!signal?.aborted) setLoading(false);
            }
        },
        [type, id]
    );

    useEffect(() => {
        const controller = new AbortController();
        setLoading(true);
        load(1, controller.signal);

        return () => controller.abort();
    }, [load]);

    const send = async () => {
        const content = draft.trim();

        if (!content || sending) return;

        if (!user) {
            router.push('/sign-in');

            return;
        }

        setSending(true);

        try {
            const saved = await postComment({ content, type, id, parentId: replyTo?.id ?? null });

            /*
             * Put it where it belongs rather than reloading the page.
             *
             * A reply that appears at the bottom of the list instead of under
             * the comment it answers reads as having gone to the wrong place,
             * and the reader posts it again.
             */
            setComments((prev) =>
                replyTo
                    ? prev.map((c) =>
                          c.id === replyTo.id || c.id === replyTo.parent_id
                              ? { ...c, replies: [...(c.replies ?? []), saved] }
                              : c
                      )
                    : [saved, ...prev]
            );

            setDraft('');
            setReplyTo(null);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'That did not send.');
        } finally {
            setSending(false);
        }
    };

    const vote = async (comment: Comment, kind: 'up' | 'down') => {
        if (!user) {
            router.push('/sign-in');

            return;
        }

        const apply = (change: Partial<Comment>) =>
            setComments((prev) =>
                prev.map((c) =>
                    c.id === comment.id
                        ? { ...c, ...change }
                        : { ...c, replies: (c.replies ?? []).map((r) => (r.id === comment.id ? { ...r, ...change } : r)) }
                )
            );

        const before = { score: comment.score, user_vote: comment.user_vote };

        // Guessed locally so the arrow answers the finger, then corrected from
        // whatever the server actually settled on.
        const clearing = comment.user_vote === kind;
        apply({
            user_vote: clearing ? null : kind,
            score: comment.score + (clearing ? (kind === 'up' ? -1 : 1) : kind === 'up' ? 1 : -1),
        });

        try {
            const settled = await voteComment(comment.id, kind);
            apply({ score: settled.score, user_vote: settled.user_vote });
        } catch {
            apply(before);
        }
    };

    return (
        <View style={styles.wrap}>
            <Text style={styles.heading}>
                {comments.length > 0 ? `${comments.length} ${comments.length === 1 ? 'comment' : 'comments'}` : 'Comments'}
            </Text>

            {/* The box comes first. Asking somebody to scroll past forty
                comments to find out whether they are allowed to add one is how
                a thread stays at forty. */}
            <View style={styles.composer}>
                {replyTo ? (
                    <View style={styles.replyBar}>
                        <Text style={styles.replyTo} numberOfLines={1}>
                            Replying to {replyTo.user?.username ?? 'a comment'}
                        </Text>
                        <Pressable onPress={() => setReplyTo(null)} hitSlop={8} accessibilityRole="button" accessibilityLabel="Cancel reply">
                            <Text style={styles.replyCancel}>Cancel</Text>
                        </Pressable>
                    </View>
                ) : null}

                <TextInput
                    value={draft}
                    onChangeText={setDraft}
                    placeholder={user ? (title ? `What did you make of ${title}?` : 'Add a comment') : 'Sign in to join the conversation'}
                    placeholderTextColor={colors.inkFaint}
                    style={styles.input}
                    multiline
                    maxLength={LIMIT}
                    editable={!sending}
                    accessibilityLabel="Your comment"
                />

                <View style={styles.composerFoot}>
                    <Text style={styles.count}>
                        {draft.length > 0 ? `${draft.length} / ${LIMIT}` : ''}
                    </Text>
                    <CommandButton
                        label={user ? (replyTo ? 'Reply' : 'Post') : 'Sign in'}
                        onPress={send}
                        busy={sending}
                        compact
                        behind={colors.surface1}
                    />
                </View>
            </View>

            {error ? <Notice text={error} /> : null}

            {loading ? (
                <ActivityIndicator color={colors.accentInk} style={{ marginVertical: space.lg }} />
            ) : comments.length === 0 ? (
                <Text style={styles.empty}>Nobody has said anything yet.</Text>
            ) : (
                <View style={{ gap: space.lg }}>
                    {comments.map((c) => (
                        <View key={c.id} style={{ gap: space.md }}>
                            <One comment={c} onReply={() => setReplyTo(c)} onVote={(k) => vote(c, k)} />

                            {(c.replies ?? []).length > 0 ? (
                                <View style={styles.replies}>
                                    {c.replies.map((r) => (
                                        <One
                                            key={r.id}
                                            comment={r}
                                            reply
                                            onReply={() => setReplyTo(c)}
                                            onVote={(k) => vote(r, k)}
                                        />
                                    ))}
                                </View>
                            ) : null}
                        </View>
                    ))}
                </View>
            )}

            {page < lastPage ? (
                <CommandButton
                    label="Older comments"
                    variant="quiet"
                    onPress={() => load(page + 1)}
                />
            ) : null}
        </View>
    );
}

function One({
    comment,
    reply = false,
    onReply,
    onVote,
}: {
    comment: Comment;
    reply?: boolean;
    onReply: () => void;
    onVote: (kind: 'up' | 'down') => void;
}) {
    const name = comment.user?.username ?? 'Deleted';
    const rank = comment.user?.rank;

    return (
        <View style={styles.comment}>
            {comment.user?.avatar_url ? (
                <Image source={{ uri: comment.user.avatar_url }} style={styles.avatar} contentFit="cover" transition={120} />
            ) : (
                <View style={[styles.avatar, styles.avatarEmpty]}>
                    <Text style={styles.avatarLetter}>{name.charAt(0).toUpperCase()}</Text>
                </View>
            )}

            <View style={{ flex: 1, gap: 4 }}>
                <View style={styles.by}>
                    <Text style={styles.name}>{name}</Text>

                    {rank ? (
                        <Text style={[styles.rank, { color: rank.color, borderColor: rank.color }]}>
                            {rank.name}
                        </Text>
                    ) : null}

                    {comment.user?.is_staff ? <Text style={styles.staff}>TECHPLAY</Text> : null}

                    <Text style={styles.age}>{when(comment.created_at)}</Text>
                </View>

                {/* Held for moderation, and said so. Somebody who cannot see
                    their own comment posts it again, and then twice more. */}
                {comment.is_pending ? <Text style={styles.pending}>Waiting to be approved</Text> : null}

                <Text style={styles.body}>{comment.content}</Text>

                <View style={styles.tools}>
                    <Pressable
                        onPress={() => onVote('up')}
                        hitSlop={8}
                        accessibilityRole="button"
                        accessibilityLabel={`Upvote ${name}'s comment`}
                    >
                        <Text style={[styles.tool, comment.user_vote === 'up' ? styles.toolOn : null]}>▲</Text>
                    </Pressable>

                    <Text style={styles.score}>{comment.score}</Text>

                    <Pressable
                        onPress={() => onVote('down')}
                        hitSlop={8}
                        accessibilityRole="button"
                        accessibilityLabel={`Downvote ${name}'s comment`}
                    >
                        <Text style={[styles.tool, comment.user_vote === 'down' ? styles.toolOn : null]}>▼</Text>
                    </Pressable>

                    {!reply ? (
                        <Pressable onPress={onReply} hitSlop={8} accessibilityRole="button" accessibilityLabel={`Reply to ${name}`}>
                            <Text style={styles.replyLink}>Reply</Text>
                        </Pressable>
                    ) : null}
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    wrap: { gap: space.lg, paddingHorizontal: space.lg, paddingTop: space.xl },
    heading: {
        fontFamily: font.display,
        fontSize: size.lead,
        letterSpacing: -0.2,
        color: colors.inkHi,
    },

    composer: {
        gap: space.sm,
        padding: space.md,
        borderRadius: radius.card,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: colors.line,
        backgroundColor: colors.surface1,
    },
    replyBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.sm },
    replyTo: { flex: 1, fontFamily: font.mono, fontSize: 11, color: colors.accentInk },
    replyCancel: { fontFamily: font.mono, fontSize: 11, color: colors.inkLow },
    input: {
        minHeight: 74,
        fontFamily: font.body,
        fontSize: size.small,
        lineHeight: size.small * 1.45,
        color: colors.inkHi,
        textAlignVertical: 'top',
    },
    composerFoot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.md },
    count: { fontFamily: font.mono, fontSize: 10, color: colors.inkFaint },

    empty: { fontFamily: font.body, fontSize: size.small, color: colors.inkLow },

    comment: { flexDirection: 'row', gap: space.md },
    avatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.surface2 },
    avatarEmpty: { alignItems: 'center', justifyContent: 'center' },
    avatarLetter: { fontFamily: font.display, fontSize: 14, color: colors.inkFaint },
    by: { flexDirection: 'row', alignItems: 'center', gap: space.sm, flexWrap: 'wrap' },
    name: { fontFamily: font.bodySemi, fontSize: 13, color: colors.inkHi },
    rank: {
        fontFamily: font.mono,
        fontSize: 9,
        lineHeight: 13,
        paddingHorizontal: 4,
        borderRadius: 3,
        borderWidth: StyleSheet.hairlineWidth,
        overflow: 'hidden',
    },
    staff: {
        fontFamily: font.display,
        fontSize: 8.5,
        letterSpacing: 1.1,
        paddingHorizontal: 4,
        lineHeight: 13,
        color: colors.accentInk,
        borderColor: colors.accent,
        borderWidth: StyleSheet.hairlineWidth,
        borderRadius: 3,
        overflow: 'hidden',
    },
    age: { fontFamily: font.mono, fontSize: 10.5, color: colors.inkFaint },
    pending: { fontFamily: font.mono, fontSize: 10.5, color: colors.warning },
    body: {
        fontFamily: font.body,
        fontSize: size.small,
        lineHeight: size.small * 1.5,
        color: colors.inkMid,
    },
    tools: { flexDirection: 'row', alignItems: 'center', gap: space.md, marginTop: 2 },
    tool: { fontSize: 13, color: colors.inkFaint },
    toolOn: { color: colors.accentInk },
    score: { fontFamily: font.mono, fontSize: 12, color: colors.inkLow, minWidth: 14, textAlign: 'center' },
    replyLink: { fontFamily: font.mono, fontSize: 11, color: colors.inkLow },

    replies: {
        gap: space.md,
        marginLeft: space.xl,
        paddingLeft: space.md,
        borderLeftWidth: StyleSheet.hairlineWidth,
        borderLeftColor: colors.line,
    },
});
