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
            'bio' => $this->bio,
            'role' => $this->hasRole('admin') ? 'admin' : ($this->hasRole('editor') ? 'editor' : 'member'),
            'created_at' => $this->created_at,
            'rank' => $this->whenLoaded('rank', function () {
                return [
                    'name' => $this->rank->name,
                    'color' => $this->rank->color,
                    'icon' => $this->rank->icon,
                ];
            }),
            'active_support' => $this->whenLoaded('activeSupport', function () {
                return $this->activeSupport ? [
                    'tier' => [
                        'name' => $this->activeSupport->tier->name,
                        'color' => $this->activeSupport->tier->badge_color ?? $this->activeSupport->tier->color ?? '#F59E0B',
                    ]
                ] : null;
            }),
            'forum_reputation' => $this->forum_reputation ?? 0,
            'xp' => $this->xp ?? 0,
            // Public profile data
            'gamertags' => $this->gamertags ?? [],
            'pc_specs' => $this->pc_specs ?? [],
            // Relations when loaded
            'threads' => $this->whenLoaded('threads', fn() => $this->threads),
            'posts' => $this->whenLoaded('posts', fn() => $this->posts),
        ];
    }
}
