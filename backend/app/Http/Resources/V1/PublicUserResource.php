<?php

namespace App\Http\Resources\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Public-facing user resource - only exposes safe, public information.
 * Used when displaying user profiles publicly (not for the authenticated user's own data).
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
            'rank' => $this->whenLoaded('rank', function () {
                return [
                    'name' => $this->rank->name,
                    'color' => $this->rank->color,
                    'icon' => $this->rank->icon,
                ];
            }),
            'is_staff' => $this->hasRole(['admin', 'editor']),
            'is_supporter' => $this->whenLoaded('activeSupport', fn() => (bool) $this->activeSupport),
            'support_tier' => $this->whenLoaded('activeSupport', function () {
                return $this->activeSupport?->tier ? [
                    'name' => $this->activeSupport->tier->name,
                    'badge_color' => $this->activeSupport->tier->badge_color ?? null,
                ] : null;
            }),
            'forum_reputation' => $this->forum_reputation ?? 0,
            'level' => floor(($this->xp ?? 0) / 1000) + 1,
            'xp' => $this->xp ?? 0,
            'joined_at' => $this->created_at?->format('M Y'), // Only month/year, not exact date
        ];
    }
}
