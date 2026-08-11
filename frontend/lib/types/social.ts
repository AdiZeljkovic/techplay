/** Social Hub shapes — one chat system for direct and group conversations.
 *  Backend: ChatController / ChatService. */

export type ConversationType = "direct" | "group";

export interface ChatUser {
    id: number;
    username: string;
    avatar_url: string | null;
}

export interface ChatReaction {
    emoji: string;
    count: number;
    mine: boolean;
}

export interface ChatMessage {
    id: number;
    body: string;
    /** Signed, short-lived URL — DM images are no longer on the public disk. */
    attachment_url: string | null;
    attachment_type: string | null;
    created_at: string;
    is_mine: boolean;
    sender: ChatUser | null;
    reactions: ChatReaction[];
}

export interface ConversationRow {
    id: number;
    type: ConversationType;
    name: string;
    image: string | null;
    partner: ChatUser | null;
    members_count: number;
    last_message: { body: string; sender: string | null; is_mine: boolean; created_at: string } | null;
    unread: number;
    muted: boolean;
    last_message_at: string | null;
}

export interface ThreadMember extends ChatUser {
    role: string;
    online: boolean;
}

export interface SocialFriend {
    id: number;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
    online: boolean;
    game: string | null;
}

export interface FriendRequestRow {
    id: number;
    created_at: string;
    user: { id: number; username: string; display_name: string | null; avatar_url: string | null; xp: number };
}

export interface SuggestionRow {
    id: number;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
    mutual_friends: number;
}

export interface SocialHubPayload {
    stats: { friends: number; online: number; conversations: number; unread: number; groups: number };
    friends: SocialFriend[];
    requests: FriendRequestRow[];
    blocked: { id: number; username: string; avatar_url: string | null }[];
    suggestions: SuggestionRow[];
}
