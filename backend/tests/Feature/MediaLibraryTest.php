<?php

namespace Tests\Feature;

use App\Models\Media;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * The library behind "Choose from library".
 *
 * It held 36 rows for 18 pictures, every one titled with its own storage name —
 * a column of `01KECBS95PJ4EEKMFRR54PNTSM` with a search box that could only
 * match against exactly that. Both halves came from `media:sync` writing a row
 * per file on disk and taking the file name as the title.
 */
class MediaLibraryTest extends TestCase
{
    use RefreshDatabase;

    private function media(array $attributes): Media
    {
        return Media::create(array_merge([
            'mime_type' => 'image/jpeg',
            'collection' => 'articles',
        ], $attributes));
    }

    /**
     * A ULID is not a name, even when it is sitting in the title column.
     */
    public function test_the_display_name_falls_through_to_something_readable(): void
    {
        $named = $this->media([
            'title' => 'Hogwarts Legacy 2 key art',
            'path' => 'articles/01KEQ5KW66WJGTKV4KBRH7WEH4.jpg',
        ]);
        $this->assertSame('Hogwarts Legacy 2 key art', $named->display_name);

        $fromUpload = $this->media([
            'title' => null,
            'original_name' => 'gta-6-trailer-still.png',
            'path' => 'articles/01KECBS95PJ4EEKMFRR54PNTSM.png',
        ]);
        $this->assertSame('gta-6-trailer-still', $fromUpload->display_name);

        // The 26 rows whose "title" was only ever their own storage name.
        $legacy = $this->media([
            'title' => '01KECCC1DRWNMTRZVDZK39MEJM',
            'path' => 'articles/01KECCC1DRWNMTRZVDZK39MEJM.webp',
        ]);
        $this->assertSame('01KECCC1DRWNMTRZVDZK39MEJM.webp', $legacy->display_name);
    }

    /**
     * Eighteen pictures were showing as thirty-six entries.
     */
    public function test_tidy_folds_a_webp_into_the_picture_it_was_made_from(): void
    {
        $original = $this->media(['title' => null, 'path' => 'articles/ABC.jpg']);
        $this->media(['title' => 'ABC', 'path' => 'articles/ABC.webp', 'width' => 1200, 'height' => 630]);

        $this->assertSame(2, Media::count());

        $this->artisan('media:tidy')->assertSuccessful();

        $this->assertSame(1, Media::count());
        $this->assertSame('articles/ABC.webp', $original->fresh()->webp_path);
        $this->assertSame(1200, $original->fresh()->width);
    }

    /**
     * A picture that only ever existed as WebP keeps its own row.
     */
    public function test_tidy_leaves_a_lone_webp_alone(): void
    {
        $this->media(['title' => null, 'path' => 'articles/only-ever-webp.webp']);

        $this->artisan('media:tidy')->assertSuccessful();

        $this->assertSame(1, Media::count());
    }

    public function test_tidy_clears_titles_that_are_only_the_storage_name(): void
    {
        $bogus = $this->media(['title' => '01KEQ0DH0M7R5SXDNV66YZ6CW0', 'path' => 'articles/01KEQ0DH0M7R5SXDNV66YZ6CW0.jpg']);
        $real = $this->media(['title' => 'Something a person typed', 'path' => 'articles/XYZ.jpg']);

        $this->artisan('media:tidy')->assertSuccessful();

        $this->assertNull($bogus->fresh()->title);
        $this->assertSame('Something a person typed', $real->fresh()->title);
    }

    public function test_the_dry_run_writes_nothing(): void
    {
        $this->media(['title' => 'ABC', 'path' => 'articles/ABC.jpg']);
        $this->media(['title' => 'ABC', 'path' => 'articles/ABC.webp']);

        $this->artisan('media:tidy', ['--dry-run' => true])->assertSuccessful();

        $this->assertSame(2, Media::count());
    }
}
