<?php

namespace App\Http\Resources\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->display_name ?? $this->username,
            'username' => $this->username,
            'author_slug' => $this->author_slug,
            'author_social_links' => $this->author_social_links,
            'display_name' => $this->display_name,
            'avatar_url' => $this->avatar_url,
            'bio' => $this->bio,
            'email' => $this->email,
            'rank' => $this->whenLoaded('rank', function () {
                return [
                    'id' => $this->rank->id,
                    'name' => $this->rank->name,
                    'color' => $this->rank->color,
                    'icon' => $this->rank->icon,
                ];
            }),
            'is_staff' => $this->hasRole(['admin', 'editor']),
            'next_rank' => $this->when(isset($this->next_rank), $this->next_rank),
            'forum_reputation' => $this->forum_reputation ?? 0,
            'created_at' => $this->created_at,
            'posts_count' => ($this->posts_count ?? $this->posts()->count()) + ($this->threads_count ?? $this->threads()->count()),
            'level' => floor(($this->xp ?? 0) / 1000) + 1,
            'xp' => $this->xp ?? 0,
            'roles' => $this->getRoleNames(),
        ];
    }
}
