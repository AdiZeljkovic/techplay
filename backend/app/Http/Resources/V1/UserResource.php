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
            // Absent until now, which is why the settings page always showed
            // "no cover image" and an upload looked like it had failed.
            'cover_image' => $this->coverImageUrl(),
            'bio' => $this->bio,
            // Both are drawn on the profile hero. Neither was published here,
            // so the settings form seeded them empty and the first save wiped
            // whatever was already set.
            'tagline' => $this->tagline,
            'location' => $this->location,
            'email' => $this->when($request->user()?->id === $this->id, $this->email),
            // Own settings only. Discord ships as a boolean rather than the id:
            // the page needs to know whether it is linked, not which account.
            'email_notifications' => $this->when(
                $request->user()?->id === $this->id,
                (bool) ($this->email_notifications ?? true)
            ),
            'auto_add_played_games' => $this->when(
                $request->user()?->id === $this->id,
                (bool) ($this->auto_add_played_games ?? true)
            ),
            'discord_linked' => $this->when(
                $request->user()?->id === $this->id,
                ! empty($this->discord_id)
            ),
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
            // isEditorialStaff(), not a lowercase list. This read
            // hasRole(['admin', 'editor']) while every role the seeder creates
            // is capitalised — Editor, Editor-in-Chief, Super Admin — and
            // Spatie matches names exactly, so it answered false for everyone,
            // including the editor-in-chief. The model already knows who staff
            // are; ask it.
            'is_staff' => $this->isEditorialStaff(),
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
