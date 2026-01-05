<?php

namespace App\Http\Resources\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ReviewResource extends JsonResource
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
            'title' => $this->title,
            'slug' => $this->slug,
            'item_name' => $this->item_name,

            // Map simple category string to object structure if frontend expects it, or keep string
            'category' => [
                'name' => ucfirst($this->category->name),
                'slug' => $this->category->slug,
                'type' => 'review'
            ],

            'summary' => $this->summary,
            'content' => $this->content,
            'cover_image' => $this->cover_image,
            'featured_image_url' => $this->cover_image, // Alias for frontend compatibility

            // Legacy scores
            'scores' => $this->scores,
            'pros' => $this->pros,
            'cons' => $this->cons,
            'specs' => $this->specs,
            'rating' => $this->rating,

            // New System
            'review_score' => $this->review_score ?? $this->rating, // Fallback
            'review_data' => $this->review_data,
            'tags' => $this->tags,

            'status' => $this->status,
            'published_at' => $this->published_at,
            'created_at' => $this->created_at,

            'author' => new UserResource($this->whenLoaded('author')),

            'seo_title' => $this->seo_title,
            'seo_description' => $this->seo_description,
        ];
    }
}
