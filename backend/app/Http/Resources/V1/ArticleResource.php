<?php

namespace App\Http\Resources\V1;

use App\Models\Article;
use App\Services\ContentGameLinker;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ArticleResource extends JsonResource
{
    /**
     * Siblings from the same category, newest first, this one excluded.
     *
     * Deliberately five columns and no relations: the card shows a title, an
     * image and the category it already knows. Run once per detail request,
     * inside a response the controller caches.
     */
    private function relatedArticles(): array
    {
        if (! $this->category_id) {
            return [];
        }

        return Article::query()
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
                'featured_image_url' => $this->resolveImage($a->featured_image_url),
            ])
            ->all();
    }

    /** Filament writes this column as an array sometimes, and as a bare path others. */
    private function resolveImage(mixed $path): ?string
    {
        if (is_array($path)) {
            $path = $path[0] ?? null;
        }

        if (! $path) {
            return null;
        }

        return str_starts_with($path, 'http') ? $path : asset('storage/'.$path);
    }

    /**
     * Is this the request for one article, rather than a list of them?
     *
     * `content` has always been gated on this. Everything else was not, and a
     * listing paid for it: /home came to 90 KB for 40 articles, and about 50 KB
     * of that was fields no listing reads — the full author record on every
     * card, the SEO block, both raw timestamps beside the human one.
     *
     * That is not only the API's bill. The homepage passes its payload into a
     * client component, so the unread fields are serialized into the HTML and
     * every visitor downloads them.
     *
     * Both detail endpoints (NewsController::show, TechController::show) come
     * through the `show` action, which is what this recognises.
     */
    private function isDetailRequest(Request $request): bool
    {
        return $request->routeIs('*.show')
            || $request->route()?->getActionMethod() === 'show';
    }

    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $detail = $this->isDetailRequest($request);

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
            /*
             * Never sent until 18.08.2026.
             *
             * `featured_image_alt` has been on the form, in the Media tab, since
             * the tab existed — and it stopped at the database. The API did not
             * carry it and no page read it, so every description anybody wrote
             * for a cover went nowhere while the site emitted the headline as
             * the alt instead.
             */
            'featured_image_alt' => $this->featured_image_alt,
            /*
             * So a share card can be drawn without fetching the file first.
             *
             * Facebook and X read og:image:width and og:image:height to render
             * immediately; without them they scrape and measure, and the first
             * share of a piece often goes out with no image — which is the
             * share that counts, because a link usually goes out once.
             *
             * Null until the backfill has seen the row; the page emits the
             * image without a size in that case, exactly as it did before.
             */
            'featured_image_width' => $this->featured_image_width,
            'featured_image_height' => $this->featured_image_height,
            'featured_video_url' => $this->featured_video_url ?: null,
            'published_at_human' => $this->published_at ? $this->published_at->diffForHumans() : null,

            'content' => $this->when($detail, $this->content),

            // A card shows a name and a face. The full record — bio, cover
            // image, XP, level, roles, reputation, post colour, join date —
            // is 17 fields, and on /home it was 35 KB of the 90.
            'author' => $detail
                ? new UserResource($this->whenLoaded('author'))
                : $this->whenLoaded('author', fn () => [
                    'id' => $this->author->id,
                    'name' => $this->author->name,
                    'display_name' => $this->author->display_name,
                    'username' => $this->author->username,
                    'author_slug' => $this->author->author_slug,
                    'avatar_url' => $this->author->avatar_url,
                ]),

            'category' => $this->whenLoaded('category', function () {
                return [
                    'id' => $this->category->id,
                    'name' => $this->category->name,
                    'slug' => $this->category->slug,
                    'type' => $this->category->type,
                ];
            }),

            'reading_time' => ($this->reading_time ?? ceil(str_word_count(strip_tags($this->content ?? '')) / 200)).' min read',
            'is_featured_in_hero' => $this->is_featured_in_hero,

            'review_score' => $this->review_score,

            // The verdict block — pros, cons, ratings, conclusion, CTA — is for
            // the review itself. A review card reads one key out of it, so a
            // listing gets that key and nothing else.
            'review_data' => $detail
                ? $this->review_data
                : ($this->review_data ? ['game_title' => $this->review_data['game_title'] ?? null] : null),

            // The game this piece is about — one shape everywhere, so every
            // content page can render the same game card.
            'game' => $this->whenLoaded('game', fn () => ContentGameLinker::gamePayload($this->game)),

            // Four more from the same category. The detail pages have been
            // passing `related_articles` to RelatedArticles since it was built,
            // and no endpoint ever returned the field — so the block rendered
            // null on every article, review and guide on the site. It is the
            // internal linking a content site runs on, and it was invisible.
            'related_articles' => $this->when($detail, fn () => $this->relatedArticles()),

            // Embed comments if eager loaded to avoid extra HTTP request
            'comments' => CommentResource::collection($this->whenLoaded('comments')),

            // SEO. The admin form writes meta_title/meta_description; the
            // seo_* columns are older and still hold data on some rows, so
            // both travel and the page prefers whichever is filled.
            //
            // Detail only: a <head> is written for one article, never for a
            // card in a grid.
            'meta_title' => $this->when($detail, $this->meta_title),
            'meta_description' => $this->when($detail, $this->meta_description),
            'canonical_url' => $this->when($detail, $this->canonical_url),
            'is_noindex' => $this->when($detail, (bool) $this->is_noindex),

            // published_at stays in listings: SectionHub — the shell behind
            // /news, /reviews, /guides and /hardware — formats its own date
            // from it rather than using published_at_human.
            'published_at' => $this->published_at,

            // updated_at is only ever read for a detail page's dateModified.
            'updated_at' => $this->when($detail, $this->updated_at),

            'views' => $this->views ?? 0,
        ];
    }
}
