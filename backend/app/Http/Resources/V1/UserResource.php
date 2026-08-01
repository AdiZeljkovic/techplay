<?php

namespace App\Http\Resources\V1;

use App\Services\LevelService;
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
            'email' => $this->when($request->user()?->id === $this->id, $this->email),
            // Own setting only — nobody else needs to know how you're configured
            'profile_visibility' => $this->when(
                $request->user()?->id === $this->id,
                $this->profile_visibility ?? 'public'
            ),
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
            'post_color' => $this->post_color,
            'created_at' => $this->created_at,
            'posts_count' => ($this->posts_count ?? $this->posts()->count()) + ($this->threads_count ?? $this->threads()->count()),
            'level' => app(LevelService::class)->forXp($this->xp),
            'xp' => $this->xp ?? 0,
            'roles' => $this->getRoleNames(),
        ];
    }
}
