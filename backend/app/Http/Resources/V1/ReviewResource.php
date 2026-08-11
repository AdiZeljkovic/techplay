<?php

namespace App\Http\Resources\V1;

use App\Models\Article;
use App\Services\ContentGameLinker;
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
        if ($imageUrl && ! str_starts_with($imageUrl, 'http')) {
            $imageUrl = Storage::disk('public')->url($imageUrl);
        }

        // Extract review_data fields
        $reviewData = $this->review_data ?? [];

        // One request for one review, rather than a list of them.
        $detail = $request->routeIs('*.show')
            || $request->route()?->getActionMethod() === 'show';

        return [
            'id' => $this->id,
            'title' => $this->title,
            'slug' => $this->slug,
            'excerpt' => $this->excerpt,

            'category' => [
                'name' => $this->category?->name ? ucfirst($this->category->name) : 'Reviews',
                'slug' => $this->category?->slug ?? 'reviews',
                'type' => 'review',
            ],

            // Detail only. A listing of 13 reviews was sending 139 KB of
            // article bodies — 81% of that response — for cards that show a
            // title, an image and the excerpt.
            'content' => $this->when($detail, $this->content),
            'featured_image_url' => $imageUrl,
            'featured_image_alt' => $this->featured_image_alt,

            // Review specific data
            'review_score' => $this->review_score ?? 0,
            // The verdict — pros, cons, per-category ratings, conclusion, CTA
            // — belongs to the review's own page. A card in the listing reads
            // one key out of the eleven, so that is what a listing gets.
            'review_data' => $detail ? [
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
            ] : [
                'game_title' => $reviewData['game_title'] ?? null,
            ],

            // Four more reviews from the same category. ReviewDetailView has
            // always passed `related_articles` to RelatedArticles, and nothing
            // ever returned it — see ArticleResource for the same fix.
            'related_articles' => $this->when($detail, fn () => Article::query()
                ->where('category_id', $this->category_id)
                ->where('id', '!=', $this->id)
                ->where('status', 'published')
                ->where('published_at', '<=', now())
                ->latest('published_at')
                ->limit(4)
                ->get(['id', 'title', 'slug', 'featured_image_url'])
                ->map(fn ($a) => [
                    'id' => $a->id,
                    'title' => $a->title,
                    'slug' => $a->slug,
                    'featured_image_url' => is_array($a->featured_image_url)
                        ? ($a->featured_image_url[0] ?? null)
                        : ($a->featured_image_url && ! str_starts_with($a->featured_image_url, 'http')
                            ? asset('storage/'.$a->featured_image_url)
                            : $a->featured_image_url),
                ])
                ->all()),

            'tags' => $this->tags ?? [],
            'is_featured_in_hero' => $this->is_featured_in_hero ?? false,

            // The game this review covers — same card shape as news and guides.
            'game' => $this->whenLoaded('game', fn () => ContentGameLinker::gamePayload($this->game)),

            'status' => $this->status,
            'published_at' => $this->published_at,
            'created_at' => $this->created_at,

            'author' => new UserResource($this->whenLoaded('author')),

            'meta_title' => $this->meta_title,
            'meta_description' => $this->meta_description,
            'seo_title' => $this->seo_title,
            'seo_description' => $this->seo_description,
            'canonical_url' => $this->canonical_url,
            'is_noindex' => (bool) $this->is_noindex,
            // The page builds its description and Product schema from these.
            'summary' => $this->summary,
            'item_name' => $this->item_name,
            'updated_at' => $this->updated_at,
        ];
    }
}
