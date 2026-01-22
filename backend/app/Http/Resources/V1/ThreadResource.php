<?php

namespace App\Http\Resources\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ThreadResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'slug' => $this->slug,
            'content' => $this->content,
            'is_locked' => (bool) $this->is_locked,
            'is_pinned' => (bool) $this->is_pinned,
            'view_count' => $this->view_count ?? 0, // Fallback if not loaded
            'posts_count' => $this->posts_count, // Loaded via withCount
            'upvotes_count' => $this->upvotes_count, // Loaded via withCount
            'is_upvoted' => $this->is_upvoted ?? false,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'author' => new UserResource($this->whenLoaded('author')),
            'category' => $this->whenLoaded('category', function () {
                return [
                    'name' => $this->category->name,
                    'slug' => $this->category->slug,
                ];
            }),
        ];
    }
}
