<?php

namespace App\Http\Resources\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Public-facing user resource - exposes profile information.
 * Safe for public display - excludes email, password, payment info, etc.
 */
class PublicUserResource extends JsonResource
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
            'username' => $this->username,
            'display_name' => $this->display_name,
            'avatar_url' => $this->avatar_url,
            'cover_image' => $this->cover_image ? asset('storage/'.$this->cover_image) : null,
            'bio' => $this->bio,
            'location' => $this->location,
            'tagline' => $this->tagline,
            'playstyle_tags' => $this->playstyle_tags ?? [],
            /*
             * The badge comes from Spatie alone.
             *
             * Each line also consulted `users.role`, the legacy string column —
             * the same second door that was closed for panel access on 28 Aug
             * and left open here, where the answer is shown to the public.
             * Nobody's badge changes: exactly one account carries
             * `role = 'admin'`, and it holds Super Admin as well. Three
             * accounts read 'user' in that column while holding Super Admin,
             * Editor-in-Chief or Journalist, so the column understates as
             * readily as it overstates and is worth nothing to either.
             *
             * Editor-in-Chief and Journalist deliberately fall through to
             * 'member': this field marks authority in a thread, not seniority
             * on the masthead, which StaffResource carries instead.
             */
            'role' => $this->hasRole(['admin', 'Admin', 'administrator', 'Super Admin']) ? 'admin'
                : ($this->hasRole(['editor', 'Editor']) ? 'editor'
                    : ($this->hasRole(['moderator', 'Moderator']) ? 'moderator' : 'member')),
            'created_at' => $this->created_at,
            'rank' => $this->whenLoaded('rank', function () {
                return [
                    'name' => $this->rank->name,
                    'min_xp' => $this->rank->min_xp,
                    'color' => $this->rank->color,
                    'icon' => $this->rank->icon,
                ];
            }),
            'active_support' => $this->whenLoaded('activeSupport', function () {
                return $this->activeSupport ? [
                    'tier' => [
                        'name' => $this->activeSupport->tier->name,
                        'color' => $this->activeSupport->tier->badge_color ?? $this->activeSupport->tier->color ?? '#F59E0B',
                    ],
                ] : null;
            }),
            'forum_reputation' => $this->forum_reputation ?? 0,
            'xp' => $this->xp ?? 0,
            // Public profile data
            // Relations when loaded
            'threads' => $this->whenLoaded('threads', fn () => $this->threads),
            'posts' => $this->whenLoaded('posts', fn () => $this->posts),
        ];
    }
}
