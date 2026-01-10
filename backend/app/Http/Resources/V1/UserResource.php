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
            'name' => $this->display_name ?? $this->username, // Use display_name as name
            'username' => $this->username,
            'display_name' => $this->display_name,
            'avatar_url' => $this->avatar_url,
            'bio' => $this->bio,
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
        ];
    }
}
