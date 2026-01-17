<?php

namespace App\Http\Resources\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class ReviewResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        // Build featured image URL
        $imageUrl = $this->featured_image_url;
        if ($imageUrl && !str_starts_with($imageUrl, 'http')) {
            $imageUrl = Storage::disk('public')->url($imageUrl);
        }

        // Extract review_data fields
        $reviewData = $this->review_data ?? [];

        return [
            'id' => $this->id,
            'title' => $this->title,
            'slug' => $this->slug,
            'excerpt' => $this->excerpt,

            'category' => [
                'name' => $this->category?->name ? ucfirst($this->category->name) : 'Reviews',
                'slug' => $this->category?->slug ?? 'reviews',
                'type' => 'review'
            ],

            'content' => $this->content,
            'featured_image_url' => $imageUrl,
            'featured_image_alt' => $this->featured_image_alt,

            // Review specific data
            'review_score' => $this->review_score ?? 0,
            'review_data' => [
                'game_title' => $reviewData['game_title'] ?? null,
                'developer' => $reviewData['developer'] ?? null,
                'publisher' => $reviewData['publisher'] ?? null,
                'release_date' => $reviewData['release_date'] ?? null,
                'platforms' => $reviewData['platforms'] ?? [],
                'genres' => $reviewData['genres'] ?? [],
                'ratings' => $reviewData['ratings'] ?? [],
                'pros' => $reviewData['pros'] ?? [],
                'cons' => $reviewData['cons'] ?? [],
                'conclusion' => $reviewData['conclusion'] ?? null,
                'cta' => $reviewData['cta'] ?? 'none',
            ],

            'tags' => $this->tags ?? [],
            'is_featured_in_hero' => $this->is_featured_in_hero ?? false,

            'status' => $this->status,
            'published_at' => $this->published_at,
            'created_at' => $this->created_at,

            'author' => new UserResource($this->whenLoaded('author')),

            'meta_title' => $this->meta_title,
            'meta_description' => $this->meta_description,
        ];
    }
}
