<?php

namespace Tests\Feature;

use App\Filament\Components\MediaPickerFields;
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

    /**
     * What the picker offers.
     *
     * Both exclusions were shipped broken once and caught by counting: an
     * unparenthesised `or` inside `whereRaw` is appended at the top level, so
     * `A and B and X or Y` binds as `(A and B and X) or Y` — and Y was true for
     * every non-WebP row, which made the whole clause always true and put
     * somebody's profile picture in the list of candidate news heroes.
     */
    public function test_the_picker_leaves_out_avatars_and_conversions(): void
    {
        $this->media(['title' => 'Cover art', 'path' => 'articles/AAA.jpg']);
        $this->media(['title' => null, 'path' => 'articles/AAA.webp']);
        $this->media(['title' => null, 'path' => 'avatars/BBB.jpg', 'collection' => 'avatars']);
        $this->media(['title' => null, 'path' => 'articles/CCC.png']);
        $this->media(['title' => null, 'path' => 'articles/DDD.pdf', 'mime_type' => 'application/pdf']);

        $paths = (new \ReflectionMethod(MediaPickerFields::class, 'libraryQuery'))
            ->invoke(null)->pluck('path')->all();

        sort($paths);

        $this->assertSame(['articles/AAA.jpg', 'articles/CCC.png'], $paths);
    }

    public function test_an_option_carries_a_thumbnail_and_a_readable_name(): void
    {
        $this->media([
            'title' => 'Hogwarts Legacy 2 key art',
            'path' => 'articles/AAA.jpg',
            'width' => 1200,
            'height' => 630,
        ]);

        $rows = (new \ReflectionMethod(MediaPickerFields::class, 'libraryQuery'))->invoke(null)->get();
        $options = (new \ReflectionMethod(MediaPickerFields::class, 'libraryOptions'))->invoke(null, $rows);

        $label = $options['articles/AAA.jpg'] ?? '';

        $this->assertStringContainsString('<img src=', $label);
        $this->assertStringContainsString('Hogwarts Legacy 2 key art', $label);
        $this->assertStringContainsString('1200×630', $label);
    }
}
