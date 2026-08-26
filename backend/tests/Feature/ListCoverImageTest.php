<?php

namespace Tests\Feature;

use App\Models\GameList;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

// The uploads are built with create() and an explicit mime rather than
// fake()->image(), which needs the GD extension to draw one. Nothing in the
// path being tested decodes the file — it is validated by type and stored —
// so a real bitmap would only cost a dependency this suite does not have.

/**
 * A list's own picture.
 *
 * `cover_image` has been on the table since the lists were built and nothing
 * ever wrote to it or read it back — a list's artwork was always a mosaic of
 * the first four game covers, which says what is inside the list and nothing
 * about what the list is. "Hall of Shame" and "Comfort Games" holding the same
 * four games looked like the same list.
 */
class ListCoverImageTest extends TestCase
{
    use RefreshDatabase;

    private User $author;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('public');
        $this->author = User::factory()->create(['username' => 'curator']);
    }

    private function list(): GameList
    {
        return GameList::create([
            'user_id' => $this->author->id,
            'name' => 'Comfort Games',
            'slug' => 'comfort-games',
            'is_public' => true,
        ]);
    }

    public function test_an_author_can_give_a_list_its_own_artwork(): void
    {
        $list = $this->list();

        $this->actingAs($this->author)
            ->postJson("/api/v1/game-lists/{$list->id}/cover", [
                'cover_image' => UploadedFile::fake()->create('hero.jpg', 320, 'image/jpeg'),
            ])
            ->assertOk();

        $stored = $list->fresh()->cover_image;
        $this->assertNotNull($stored);
        Storage::disk('public')->assertExists($stored);
    }

    public function test_the_artwork_travels_with_the_list(): void
    {
        $list = $this->list();

        $this->actingAs($this->author)
            ->postJson("/api/v1/game-lists/{$list->id}/cover", [
                'cover_image' => UploadedFile::fake()->create('hero.webp', 180, 'image/webp'),
            ])
            ->assertOk()
            // An absolute URL, the same shape a profile cover arrives in — a
            // client should never have to know where the disk is mounted.
            ->assertJsonPath('data.cover_image', fn ($url) => is_string($url) && str_starts_with($url, 'http'));
    }

    public function test_a_list_without_artwork_says_so_rather_than_guessing(): void
    {
        $list = $this->list();

        $this->getJson("/api/v1/users/{$this->author->username}/lists/{$list->slug}")
            ->assertOk()
            ->assertJsonPath('data.cover_image', null);
    }

    public function test_the_artwork_can_be_taken_off_again(): void
    {
        $list = $this->list();

        $this->actingAs($this->author)
            ->postJson("/api/v1/game-lists/{$list->id}/cover", [
                'cover_image' => UploadedFile::fake()->create('hero.png', 210, 'image/png'),
            ])
            ->assertOk();

        $this->actingAs($this->author)
            ->postJson("/api/v1/game-lists/{$list->id}/cover", ['remove_cover' => 1])
            ->assertOk()
            ->assertJsonPath('data.cover_image', null);

        $this->assertNull($list->fresh()->cover_image);
    }

    public function test_a_request_carrying_neither_is_refused(): void
    {
        $list = $this->list();

        $this->actingAs($this->author)
            ->postJson("/api/v1/game-lists/{$list->id}/cover", [])
            ->assertStatus(422);
    }

    public function test_a_pdf_is_not_a_cover(): void
    {
        $list = $this->list();

        $this->actingAs($this->author)
            ->postJson("/api/v1/game-lists/{$list->id}/cover", [
                'cover_image' => UploadedFile::fake()->create('nice-try.pdf', 40, 'application/pdf'),
            ])
            ->assertStatus(422);

        $this->assertNull($list->fresh()->cover_image);
    }

    public function test_nobody_dresses_up_somebody_elses_list(): void
    {
        $list = $this->list();
        $stranger = User::factory()->create(['username' => 'passerby']);

        $this->actingAs($stranger)
            ->postJson("/api/v1/game-lists/{$list->id}/cover", [
                'cover_image' => UploadedFile::fake()->create('mine-now.jpg', 90, 'image/jpeg'),
            ])
            ->assertStatus(404);

        $this->assertNull($list->fresh()->cover_image);
    }
}
