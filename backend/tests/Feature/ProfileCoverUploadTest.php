<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ProfileCoverUploadTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('public');
    }

    /** A real jpeg, without needing GD — which is not installed everywhere. */
    private function jpeg(string $name = 'cover.jpg'): UploadedFile
    {
        $path = sys_get_temp_dir().'/'.uniqid('cover_').'.jpg';

        // Smallest valid JPEG: SOI, APP0/JFIF, EOI.
        file_put_contents($path, base64_decode(
            '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0a'
            .'HBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAALCAABAAEBAREA/8QAFAABAAAAAAAA'
            .'AAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AKp//2Q=='
        ));

        return new UploadedFile($path, $name, 'image/jpeg', null, true);
    }

    public function test_a_cover_image_is_stored_and_returned(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user, 'sanctum')->post('/api/v1/user/profile', [
            '_method' => 'PUT',
            'bio' => 'Still the same bio.',
            'display_name' => $user->display_name ?? 'Someone',
            'cover_image' => $this->jpeg(),
        ]);

        $response->assertOk();

        $user->refresh();

        $this->assertNotNull($user->cover_image, 'the upload never reached the column');
        Storage::disk('public')->assertExists($user->cover_image);

        // The client has to be handed something a browser can load, not a path
        // relative to a disk it knows nothing about.
        $returned = $response->json('user.cover_image');
        $this->assertNotNull($returned, 'the update answered without the cover it had just saved');
        $this->assertStringStartsWith('http', $returned);
    }

    public function test_the_logged_in_user_is_told_about_their_own_cover(): void
    {
        // The settings page reads this. Without it the page always said "no
        // cover image", so uploading one looked like it had done nothing.
        $user = User::factory()->create();

        $this->actingAs($user, 'sanctum')->post('/api/v1/user/profile', [
            '_method' => 'PUT',
            'bio' => 'x',
            'display_name' => 'Someone',
            'cover_image' => $this->jpeg(),
        ])->assertOk();

        $cover = $this->actingAs($user, 'sanctum')->getJson('/api/v1/auth/me')->assertOk()->json('data.cover_image');

        $this->assertNotNull($cover);
        $this->assertStringStartsWith('http', $cover);
    }

    public function test_a_cover_already_stored_as_a_url_is_left_alone(): void
    {
        // Older rows hold a full url rather than a path on the public disk.
        $user = User::factory()->create(['cover_image' => 'https://cdn.example.com/old.jpg']);

        $this->assertSame('https://cdn.example.com/old.jpg', $user->coverImageUrl());
    }

    public function test_uploading_a_cover_does_not_wipe_the_avatar(): void
    {
        $user = User::factory()->create(['avatar_url' => 'https://example.com/a.jpg']);

        $this->actingAs($user, 'sanctum')->post('/api/v1/user/profile', [
            '_method' => 'PUT',
            'bio' => 'x',
            'display_name' => 'Someone',
            'cover_image' => $this->jpeg(),
        ])->assertOk();

        $this->assertSame('https://example.com/a.jpg', $user->fresh()->avatar_url);
    }
}
