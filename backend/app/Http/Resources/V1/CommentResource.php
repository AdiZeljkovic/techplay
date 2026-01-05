<?php

namespace App\Http\Resources\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CommentResource extends JsonResource
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
            'content' => $this->content, // Will be sanitized on storage or frontend, but here raw text
            'created_at' => $this->created_at,
            'created_at_human' => $this->created_at->diffForHumans(),
            'user' => new UserResource($this->whenLoaded('user')),
            'parent_id' => $this->parent_id,
            'replies' => CommentResource::collection($this->whenLoaded('replies')),
            // 'likes_count' => $this->likes_count ?? 0, // Ensure updated model has this
            // 'is_liked_by_user' => $this->is_liked_by_user ?? false, 

            // Using logic from controller transformation if attributes exist
            'likes_count' => $this->likes_count,
            'is_liked_by_user' => $this->is_liked_by_user,
        ];
    }
}
