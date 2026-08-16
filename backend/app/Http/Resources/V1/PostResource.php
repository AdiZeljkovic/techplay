<?php

namespace App\Http\Resources\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PostResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $isDeleted = $this->trashed();

        return [
            'id' => $this->id,
            'content' => $isDeleted ? null : $this->content,
            'is_deleted' => $isDeleted,
            'is_solution' => (bool) $this->is_solution,
            'edited_at' => $this->edited_at,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'author' => new UserResource($this->whenLoaded('author')),

            // Attached by showThread in two grouped queries, not loaded per
            // row. Absent elsewhere, which is why they default rather than
            // assume: this resource also answers a freshly created reply.
            'reactions' => $this->reaction_counts ?? [],
            'my_reaction' => $this->my_reaction ?? null,
        ];
    }
}
