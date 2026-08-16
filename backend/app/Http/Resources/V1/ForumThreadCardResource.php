<?php

namespace App\Http\Resources\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * A thread as it appears in a list, rather than as a page.
 *
 * The forum's list endpoints — active, unanswered, watched, bookmarked — used
 * to return the Thread model straight out of the query builder, which meant
 * every row carried the whole opening post's HTML and the whole author record.
 * The author record includes `email`: the User model deliberately leaves it
 * visible so a signed-in visitor can read their own on the settings page, and
 * anything that serializes a User without a resource hands it to whoever asked.
 * /forum/active and /forum/unanswered need no authentication.
 *
 * So: no body, and an author reduced to the four fields a card draws.
 *
 * It was written for /forum/active and /forum/unanswered and applied only
 * there. A board's own page — /forum/categories/{slug}, the busiest read
 * endpoint the forum has — kept returning the raw paginator, so every author's
 * email address was still being served to anyone who asked, unauthenticated.
 * Measured on production before this changed. It covers those lists too now.
 */
class ForumThreadCardResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'slug' => $this->slug,
            'is_pinned' => (bool) $this->is_pinned,
            'is_locked' => (bool) $this->is_locked,
            'view_count' => (int) ($this->view_count ?? 0),
            'posts_count' => (int) ($this->posts_count ?? 0),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,

            // The list's Activity column reads this and falls back to
            // created_at, so without it every row claimed the thread had not
            // been touched since it was opened.
            'last_activity_at' => $this->updated_at,

            'author' => $this->whenLoaded('author', fn () => [
                'id' => $this->author->id,
                'username' => $this->author->username,
                'display_name' => $this->author->display_name,
                'avatar_url' => $this->author->avatar_url,
                'post_color' => $this->author->post_color,
            ]),

            'category' => $this->whenLoaded('category', fn () => [
                'name' => $this->category->name,
                'slug' => $this->category->slug,
            ]),

            'tags' => $this->whenLoaded('tags', fn () => $this->tags->map(fn ($t) => [
                'name' => $t->name,
                'slug' => $t->slug,
            ])->all()),
        ];
    }
}
