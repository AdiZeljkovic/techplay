<?php

namespace App\Http\Resources\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class StaffResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        // Priority order for display role - editorial roles first, admin roles last
        $rolePriority = [
            'Editor-in-Chief' => 1,
            'Editor' => 2,
            'Journalist' => 3,
            'Moderator' => 4,
            'Admin' => 5,
            'Super Admin' => 6,
        ];

        // Get the best role to display (lowest priority number = most important for display)
        $displayRole = $this->roles->sortBy(function ($role) use ($rolePriority) {
            return $rolePriority[$role->name] ?? 99;
        })->first()?->name;

        return [
            'id' => $this->id,
            'name' => $this->display_name ?? $this->name ?? $this->username,
            'username' => $this->username,
            'avatar_url' => $this->avatar_url,
            'bio' => $this->bio,
            'role' => $displayRole,
            'joined_at' => $this->created_at->format('M Y'),
        ];
    }
}

