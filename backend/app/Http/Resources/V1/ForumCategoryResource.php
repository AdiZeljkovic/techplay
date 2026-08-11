<?php

namespace App\Http\Resources\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * A board on the forum index.
 *
 * The index used to hand back Category models whole: six SEO columns, the
 * moderation `rules` blob, both timestamps and `focus_keyword`, for a card
 * that draws a name, a line of description and two numbers. The latest thread
 * came with its author's full user record — `email` included, on an endpoint
 * that needs no authentication.
 */
class ForumCategoryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'description' => $this->description,
            'icon' => $this->icon,
            'threads_count' => (int) ($this->threads_count ?? 0),
            'posts_count' => (int) ($this->posts_count ?? 0),

            'latest_thread' => $this->latest_thread ? [
                'title' => $this->latest_thread->title,
                'slug' => $this->latest_thread->slug,
                'created_at' => $this->latest_thread->created_at,
                'author' => $this->latest_thread->author ? [
                    'username' => $this->latest_thread->author->username,
                    'avatar_url' => $this->latest_thread->author->avatar_url,
                ] : null,
            ] : null,

            // A leaf board has no children attached, and asking the relation
            // for them would be a lazy load — which AppServiceProvider turns
            // into an exception outside production.
            // The controller hangs children off the parent as a plain
            // attribute, not as a loaded relation, so both have to be asked
            // about. Reaching for the relation when neither is set would be a
            // lazy load, which AppServiceProvider turns into an exception
            // outside production — and every leaf board would hit it.
            'children' => self::collection(
                array_key_exists('children', $this->resource->getAttributes()) || $this->resource->relationLoaded('children')
                    ? $this->resource->children
                    : []
            ),
        ];
    }
}
