import { api } from '@/lib/api';
import { getPage, type Paged } from '@/lib/paging';

/**
 * Reading and writing comments.
 *
 * The app had neither. An article ended at its last paragraph, so the one
 * place on the site where readers talk back was missing from the client most
 * of them read on — 1,487 of the requests from the September ad campaign came
 * from a phone against 184 from a desktop.
 */

export interface CommentUser {
    username: string;
    name: string | null;
    avatar_url: string | null;
    rank: { name: string; color: string } | null;
    is_staff: boolean;
}

export interface Comment {
    id: number;
    content: string;
    created_at: string;
    user: CommentUser | null;
    parent_id: number | null;
    replies: Comment[];
    score: number;
    user_vote: 'up' | 'down' | null;
    is_pending: boolean;
}

/** The kinds the API will take. `tech` is what the site calls Hardware. */
export type CommentableType = 'article' | 'review' | 'guide' | 'tech' | 'profile';

export function getComments(
    type: CommentableType,
    id: number,
    page = 1,
    signal?: AbortSignal
): Promise<Paged<Comment>> {
    // auth: true — a signed-in reader's own vote comes back on each comment,
    // and without the token every arrow renders as untouched.
    return getPage<Comment>(`/comments/${type}/${id}?page=${page}`, signal, true);
}

export function postComment(input: {
    content: string;
    type: CommentableType;
    id: number;
    parentId?: number | null;
}): Promise<Comment> {
    return api<Comment>('/comments', {
        method: 'POST',
        body: {
            content: input.content,
            commentable_type: input.type,
            commentable_id: input.id,
            parent_id: input.parentId ?? null,
        },
    });
}

/**
 * A vote is a toggle the server decides.
 *
 * Sending `up` on a comment already upvoted clears it rather than counting
 * twice, so the caller states which arrow was pressed and reads the score
 * back — it does not compute one.
 */
export function voteComment(id: number, type: 'up' | 'down'): Promise<{ score: number; user_vote: 'up' | 'down' | null }> {
    return api<{ score: number; user_vote: 'up' | 'down' | null }>(`/comments/${id}/vote`, {
        method: 'POST',
        body: { type },
    });
}

/**
 * "3 days ago", without pulling in a date library for one string.
 *
 * Built from the UTC timestamp the API sends. Anything older than a week is
 * given as a date, because "23 days ago" is arithmetic a reader has to do in
 * their head to place it.
 */
export function when(iso: string): string {
    const then = new Date(iso).getTime();

    if (Number.isNaN(then)) return '';

    const seconds = Math.max(0, Math.round((Date.now() - then) / 1000));

    if (seconds < 60) return 'just now';

    const minutes = Math.round(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;

    const hours = Math.round(minutes / 60);
    if (hours < 24) return `${hours}h ago`;

    const days = Math.round(hours / 24);
    if (days <= 7) return `${days}d ago`;

    return new Date(then).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}
