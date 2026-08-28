<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Everything we hold about one person, in one file.
 *
 * GDPR Article 20 — the right to receive your own data in a portable form.
 * Deletion has been here for a while; this is its other half, and until now
 * a request for "send me everything you have on me" could only be answered by
 * hand out of the database.
 *
 * Fifty tables carry a user id. Writing a list of the interesting ones and
 * moving on is how `gamertags` went unnoticed in the deletion routine for
 * months, so this does not do that: every user-linked table is named below
 * with a decision and a reason, and UserDataExportTest fails the moment a
 * table appears that nobody has classified. A new feature that stores
 * something about a person cannot ship without somebody deciding whether the
 * person gets it back.
 */
class UserDataExportService
{
    /**
     * Tables whose rows belong in the export, and the key they hang under.
     *
     * @var array<string, array{column: string, as: string}>
     */
    private const EXPORTED = [
        // What they wrote
        'comments' => ['column' => 'user_id', 'as' => 'comments'],
        'threads' => ['column' => 'author_id', 'as' => 'forum_threads'],
        'posts' => ['column' => 'author_id', 'as' => 'forum_posts'],
        'articles' => ['column' => 'author_id', 'as' => 'articles_written'],
        'guides' => ['column' => 'author_id', 'as' => 'guides_written'],
        'messages' => ['column' => 'sender_id', 'as' => 'messages_sent'],
        'game_list_comments' => ['column' => 'user_id', 'as' => 'list_comments'],
        'gaming_moments' => ['column' => 'user_id', 'as' => 'gaming_moments'],
        'reports' => ['column' => 'user_id', 'as' => 'reports_filed'],

        // What they collected and ranked
        'user_games' => ['column' => 'user_id', 'as' => 'collection'],
        'game_lists' => ['column' => 'user_id', 'as' => 'lists'],
        'game_ratings' => ['column' => 'user_id', 'as' => 'game_ratings'],
        'collection_goals' => ['column' => 'user_id', 'as' => 'collection_goals'],
        'trophy_case_slots' => ['column' => 'user_id', 'as' => 'trophy_case'],
        'play_sessions' => ['column' => 'user_id', 'as' => 'play_sessions'],
        'steam_achievements' => ['column' => 'user_id', 'as' => 'steam_achievements'],
        'user_wow_characters' => ['column' => 'user_id', 'as' => 'wow_characters'],

        // What they marked
        'article_bookmarks' => ['column' => 'user_id', 'as' => 'article_bookmarks'],
        'thread_bookmarks' => ['column' => 'user_id', 'as' => 'thread_bookmarks'],
        'thread_watchers' => ['column' => 'user_id', 'as' => 'threads_watched'],
        'comment_likes' => ['column' => 'user_id', 'as' => 'comment_likes'],
        'game_list_likes' => ['column' => 'user_id', 'as' => 'list_likes'],
        'thread_upvotes' => ['column' => 'user_id', 'as' => 'thread_upvotes'],
        'post_reactions' => ['column' => 'user_id', 'as' => 'post_reactions'],
        'message_reactions' => ['column' => 'user_id', 'as' => 'message_reactions'],
        'guide_votes' => ['column' => 'user_id', 'as' => 'guide_votes'],
        'poll_votes' => ['column' => 'user_id', 'as' => 'poll_votes'],
        'last_disc_signatures' => ['column' => 'user_id', 'as' => 'last_disc_signature'],
        'last_disc_votes' => ['column' => 'user_id', 'as' => 'last_disc_votes'],

        // Their standing and their account
        'user_achievements' => ['column' => 'user_id', 'as' => 'achievements'],
        'user_customizations' => ['column' => 'user_id', 'as' => 'customizations'],
        'quest_progress' => ['column' => 'user_id', 'as' => 'quest_progress'],
        'bounty_transactions' => ['column' => 'user_id', 'as' => 'bounty_ledger'],
        'reputation_snapshots' => ['column' => 'user_id', 'as' => 'reputation_history'],
        'reward_redemptions' => ['column' => 'user_id', 'as' => 'rewards_redeemed'],
        'connected_accounts' => ['column' => 'user_id', 'as' => 'connected_accounts'],
        'user_integrations' => ['column' => 'user_id', 'as' => 'integrations'],
        'user_chronicles' => ['column' => 'user_id', 'as' => 'chronicle'],
        'friendships' => ['column' => 'sender_id', 'as' => 'friend_requests_sent'],
        'conversation_participants' => ['column' => 'user_id', 'as' => 'conversations'],
        'giveaway_entries' => ['column' => 'user_id', 'as' => 'giveaway_entries'],
        'giveaway_tier_winners' => ['column' => 'user_id', 'as' => 'giveaways_won'],
        'orders' => ['column' => 'user_id', 'as' => 'orders'],
        'user_supports' => ['column' => 'user_id', 'as' => 'support_given'],
    ];

    /**
     * Tables deliberately left out, and why. Nothing here is hidden from the
     * person — it is either not theirs to take, or meaningless outside this
     * database.
     *
     * @var array<string, string>
     */
    public const EXCLUDED = [
        'sessions' => 'browser sessions — expire on their own, and an old session id helps nobody',
        'article_reads' => 'read counters, not authored content',
        'thread_reads' => 'read markers, not authored content',
        'presences' => 'who was online a moment ago; transient',
        'player_signals' => 'derived scores, recomputed from the rows above',
        'session_suggestions' => 'recommendations we generated, not data they gave us',
    ];

    /**
     * Columns on `users` that never leave this machine.
     *
     * @var list<string>
     */
    private const SECRET_COLUMNS = ['password', 'remember_token'];

    /** @return array<string, mixed> */
    public function export(User $user): array
    {
        $profile = $user->fresh()->getAttributes();
        foreach (self::SECRET_COLUMNS as $column) {
            unset($profile[$column]);
        }

        $data = [];

        foreach (self::EXPORTED as $table => $spec) {
            // A table named here that the schema does not have is skipped
            // rather than fatal: the deletion routine carried four such names
            // for months and the guard is what let nobody notice.
            if (! Schema::hasTable($table) || ! Schema::hasColumn($table, $spec['column'])) {
                continue;
            }

            $rows = DB::table($table)->where($spec['column'], $user->id)->get();

            if ($rows->isNotEmpty()) {
                $data[$spec['as']] = $rows;
            }
        }

        return [
            'exported_at' => now()->toIso8601String(),
            'about' => 'Everything TechPlay holds about this account. Machine-readable, as GDPR Article 20 asks for.',
            'not_included' => self::EXCLUDED,
            'profile' => $profile,
            'data' => $data,
        ];
    }

    /** @return list<string> */
    public static function classifiedTables(): array
    {
        return array_merge(array_keys(self::EXPORTED), array_keys(self::EXCLUDED));
    }
}
