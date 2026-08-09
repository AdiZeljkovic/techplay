<?php

namespace App\Policies;

use App\Models\User;

/**
 * Forum surfaces a Moderator is meant to work on: comments, posts, threads
 * and reports.
 *
 * Editorial staff are included because moderating the discussion under your
 * own article is part of the job. Note this is also a widening: CommentPolicy
 * previously checked `role === 'admin'` only, so Moderators could not moderate
 * comments at all — the two schemes disagreed in both directions.
 */
class ModerationPolicy extends PanelPolicy
{
    protected function grants(User $user): bool
    {
        return $user->can('moderate forum') || $user->can('manage content');
    }
}
