<?php

namespace App\Http\Resources\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PostResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'content' => $this->content . " [DEBUG: P=" . ($this->author->posts_count ?? '?') . " T=" . ($this->author->threads_count ?? '?') . "]",
            'is_solution' => (bool) $this->is_solution,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'author' => new UserResource($this->whenLoaded('author')),
            // Add other fields if needed, e.g. upvotes
        ];
    }
}
