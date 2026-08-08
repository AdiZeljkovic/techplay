<?php

namespace App\Http\Resources\V1;

use App\Services\ContentGameLinker;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ArticleResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        // Handle Filament FileUpload array format and construct full URL
        $imagePath = $this->featured_image_url;
        if (is_array($imagePath)) {
            $imagePath = $imagePath[0] ?? null; // Filament stores as array
        }
        $featuredImageUrl = $imagePath
            ? (str_starts_with($imagePath, 'http') ? $imagePath : asset('storage/'.$imagePath))
            : null;

        return [
            'id' => $this->id,
            'title' => $this->title,
            'slug' => $this->slug,
            'excerpt' => $this->excerpt,
            'featured_image_url' => $featuredImageUrl,
            'featured_video_url' => $this->featured_video_url ?: null,
            'published_at' => $this->published_at,
            'published_at_human' => $this->published_at ? $this->published_at->diffForHumans() : null,

            // Only include full content on detail view (when explicitely requested or standard show)
            // But usually Resource is reused. Let's include it for now, optimization later if list is too heavy.
            // Actually, for lists we might want to hide it.
            // We can use $request->routeIs('*.show') logic if needed, but for now simple.
            // Only include full content on detail view
            'content' => $this->when($request->routeIs('*.show') || $request->route()->getActionMethod() === 'show', $this->content),

            'author' => new UserResource($this->whenLoaded('author')),
            'category' => $this->whenLoaded('category', function () {
                return [
                    'id' => $this->category->id,
                    'name' => $this->category->name,
                    'slug' => $this->category->slug,
                    'type' => $this->category->type,
                ];
            }),

            'reading_time' => ($this->reading_time ?? ceil(str_word_count(strip_tags($this->content ?? '')) / 200)).' min read',
            'is_featured' => $this->is_featured,
            'is_featured_in_hero' => $this->is_featured_in_hero,

            'review_score' => $this->review_score,
            'review_data' => $this->review_data,

            // The game this piece is about — one shape everywhere, so every
            // content page can render the same game card.
            'game' => $this->whenLoaded('game', fn () => ContentGameLinker::gamePayload($this->game)),

            // Embed comments if eager loaded to avoid extra HTTP request
            'comments' => CommentResource::collection($this->whenLoaded('comments')),

            // SEO. The admin form writes meta_title/meta_description; the
            // seo_* columns are older and still hold data on some rows, so
            // both travel and the page prefers whichever is filled.
            'meta_title' => $this->meta_title,
            'meta_description' => $this->meta_description,
            'seo_title' => $this->seo_title,
            'seo_description' => $this->seo_description,
            'canonical_url' => $this->canonical_url,
            'is_noindex' => (bool) $this->is_noindex,
            'updated_at' => $this->updated_at,
            'views' => $this->views ?? 0,
        ];
    }
}
