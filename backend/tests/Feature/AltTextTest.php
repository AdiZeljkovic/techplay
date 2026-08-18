<?php

namespace Tests\Feature;

use App\Models\Article;
use App\Models\Category;
use App\Models\Guide;
use App\Models\Media;
use App\Models\User;
use App\Services\AltTextService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Alt text, which the site needs for search and a reader needs to know what a
 * picture is.
 *
 * Measured before any of this: 887 of 1,167 library pictures and 345 of 625
 * article covers had none.
 */
class AltTextTest extends TestCase
{
    use RefreshDatabase;

    /**
     * The reason the old service could not simply be switched on.
     *
     * Filament stores uploads under a generated identifier, so parsing the file
     * name produced `Keq5Kw66Wjgtkv4Kbrh7Weh4` — which a screen reader reads
     * aloud, character by character, to somebody who asked what the picture is.
     */
    public function test_a_storage_identifier_is_never_offered_as_a_description(): void
    {
        foreach ([
            '01KEQ5KW66WJGTKV4KBRH7WEH4.webp',
            'usUTo74GmWm0hYlJLA1yYR10R8jvTwRfXkYf1405.png',
            'trjuano9SSKIZCkR2UY7gJJhV9nt21lLgdJS1OqO.jpg',
        ] as $storageName) {
            $this->assertTrue(AltTextService::looksLikeStorageName($storageName), $storageName);
            $this->assertNull(AltTextService::suggest($storageName), $storageName);
        }
    }

    public function test_a_name_a_person_gave_the_file_is_used(): void
    {
        $this->assertSame('Hogwarts Legacy 2 Key Art', AltTextService::suggest('hogwarts-legacy-2-key-art.jpg'));
        $this->assertSame('Gta6 Trailer Still', AltTextService::suggest('gta6_trailer_still.png'));

        // Camera prefixes and leading counters carry no meaning.
        $this->assertNull(AltTextService::suggest('IMG_20260818.jpg'));
    }

    public function test_the_headline_is_the_fallback_and_a_caption_beats_everything(): void
    {
        $headline = 'Hogwarts Legacy 2 is officially being made';

        $this->assertSame($headline, AltTextService::suggest('01KEQ5KW66WJGTKV4KBRH7WEH4.webp', $headline));

        // No " - image" glued on: a screen reader already says that part.
        $this->assertStringNotContainsString('image', mb_strtolower(
            (string) AltTextService::suggest('01KEQ5KW66WJGTKV4KBRH7WEH4.webp', $headline)
        ));

        $this->assertSame(
            'Ranger stands in a Quake corridor',
            AltTextService::suggest('anything.jpg', $headline, 'Ranger stands in a Quake corridor'),
        );
    }

    public function test_nothing_is_better_than_noise(): void
    {
        $this->assertNull(AltTextService::suggest(null));
        $this->assertNull(AltTextService::suggest('01KEQ5KW66WJGTKV4KBRH7WEH4.webp', ''));
    }

    private function article(array $attributes = []): Article
    {
        $parent = Category::create(['name' => 'News', 'slug' => 'news-root-'.uniqid(), 'type' => 'news']);
        $category = Category::create([
            'name' => 'Gaming', 'slug' => 'news-'.uniqid(), 'type' => 'news', 'parent_id' => $parent->id,
        ]);

        return Article::factory()->create(array_merge([
            'category_id' => $category->id,
            'author_id' => User::factory()->create()->id,
            'is_featured_in_hero' => false,
        ], $attributes));
    }

    public function test_the_backfill_describes_covers_and_library_pictures(): void
    {
        $article = $this->article([
            'title' => 'Quake gets a free new campaign',
            'featured_image_url' => 'articles/01KEQ5KW66WJGTKV4KBRH7WEH4.jpg',
            'featured_image_alt' => null,
        ]);

        $described = $this->article([
            'title' => 'Already described',
            'featured_image_url' => 'articles/other.jpg',
            'featured_image_alt' => 'Something a person wrote',
        ]);

        $used = Media::create([
            'path' => 'articles/01KEQ5KW66WJGTKV4KBRH7WEH4.jpg',
            'mime_type' => 'image/jpeg',
            'collection' => 'articles',
        ]);

        $orphan = Media::create([
            'path' => 'articles/nobody-uses-this-one.jpg',
            'mime_type' => 'image/jpeg',
            'collection' => 'articles',
        ]);

        $this->artisan('images:backfill-alt')->assertSuccessful();

        $this->assertSame('Quake gets a free new campaign', $article->fresh()->featured_image_alt);
        $this->assertSame('Something a person wrote', $described->fresh()->featured_image_alt, 'a written description is never overwritten');
        $this->assertSame('Quake gets a free new campaign', $used->fresh()->alt_text);
        // Its own file name is language, so it can describe itself.
        $this->assertSame('Nobody Uses This One', $orphan->fresh()->alt_text);
    }

    public function test_the_dry_run_writes_nothing(): void
    {
        $article = $this->article([
            'title' => 'A headline',
            'featured_image_url' => 'articles/01KEQ5KW66WJGTKV4KBRH7WEH4.jpg',
            'featured_image_alt' => null,
        ]);

        $this->artisan('images:backfill-alt', ['--dry-run' => true])->assertSuccessful();

        $this->assertNull($article->fresh()->featured_image_alt);
    }

    public function test_a_guides_cover_is_described_too(): void
    {
        Guide::create([
            'title' => 'How to beat the first boss',
            'slug' => 'how-to-beat-the-first-boss',
            'excerpt' => 'x',
            'content' => 'y',
            'difficulty' => 'beginner',
            'status' => 'published',
            'published_at' => now(),
            'author_id' => User::factory()->create()->id,
            'featured_image_url' => 'guides/01KEQHACPVVAHBWYCP3EXKT1D0.jpg',
        ]);

        $picture = Media::create([
            'path' => 'guides/01KEQHACPVVAHBWYCP3EXKT1D0.jpg',
            'mime_type' => 'image/jpeg',
            'collection' => 'guides',
        ]);

        $this->artisan('images:backfill-alt')->assertSuccessful();

        $this->assertSame('How to beat the first boss', $picture->fresh()->alt_text);
    }

    /**
     * Most pictures are not covers — they sit inside the copy, and 236 of those
     * inline tags already carry an alt an editor typed. That is a better
     * description than anything derivable, so it is harvested rather than
     * replaced.
     */
    public function test_an_alt_written_into_the_body_is_harvested(): void
    {
        $this->article([
            'title' => 'Marathon gets a server slam',
            'featured_image_url' => 'articles/cover.jpg',
            'featured_image_alt' => 'Cover',
            'content' => '<p>Text</p><img src="/storage/articles/content/AAA.jpg" alt="Bungie Marathon key art"><p>More</p>',
        ]);

        $described = Media::create(['path' => 'articles/content/AAA.jpg', 'mime_type' => 'image/jpeg', 'collection' => 'articles']);

        $this->artisan('images:backfill-alt')->assertSuccessful();

        $this->assertSame('Bungie Marathon key art', $described->fresh()->alt_text);
    }

    /**
     * And where the body tag has no alt, the piece it illustrates names it —
     * which is still far better than nothing.
     */
    public function test_a_body_image_without_an_alt_falls_back_to_the_piece(): void
    {
        $this->article([
            'title' => 'Dragon Ball Sparking Zero review',
            'featured_image_url' => 'articles/cover2.jpg',
            'featured_image_alt' => 'Cover',
            'content' => '<p>Text</p><img src="/storage/articles/content/BBB.jpg"><p>More</p>',
        ]);

        $bare = Media::create(['path' => 'articles/content/BBB.jpg', 'mime_type' => 'image/jpeg', 'collection' => 'articles']);

        $this->artisan('images:backfill-alt')->assertSuccessful();

        $this->assertSame('Dragon Ball Sparking Zero review', $bare->fresh()->alt_text);
    }

    /**
     * A picture in nobody's copy and with a generated name still gets nothing.
     */
    public function test_a_true_orphan_is_still_left_alone(): void
    {
        $orphan = Media::create([
            'path' => 'articles/content/01KEQ5KW66WJGTKV4KBRH7WEH4.jpg',
            'mime_type' => 'image/jpeg',
            'collection' => 'articles',
        ]);

        $this->artisan('images:backfill-alt')->assertSuccessful();

        $this->assertNull($orphan->fresh()->alt_text);
    }
}
