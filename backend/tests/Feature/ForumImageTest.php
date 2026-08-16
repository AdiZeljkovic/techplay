<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Thread;
use App\Models\User;
use App\Services\SanitizationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

/**
 * Screenshots in posts, and the line drawn around them.
 *
 * Allowing <img> at all is the feature; allowing only our own is the security
 * model. An image tag pointing at somebody else's server is a tracking pixel
 * that logs the IP and user agent of every reader who opens the thread, and a
 * forum post is exactly the place someone would put one.
 */
class ForumImageTest extends TestCase
{
    use RefreshDatabase;

    private function sanitizer(): SanitizationService
    {
        return app(SanitizationService::class);
    }

    private function ownHostUrl(): string
    {
        return rtrim((string) config('app.url'), '/').'/storage/forum/1/example.webp';
    }

    public function test_an_image_from_our_own_storage_survives(): void
    {
        $clean = $this->sanitizer()->sanitizeRichContent(
            '<p>My rig:</p><img src="'.$this->ownHostUrl().'" alt="My rig">'
        );

        $this->assertStringContainsString('<img', $clean);
        $this->assertStringContainsString('example.webp', $clean);
    }

    public function test_an_image_from_somebody_elses_server_is_removed(): void
    {
        $clean = $this->sanitizer()->sanitizeRichContent(
            '<p>Look</p><img src="https://tracker.example.com/pixel.gif" alt="">'
        );

        $this->assertStringNotContainsString('tracker.example.com', $clean);
    }

    public function test_script_and_iframe_are_still_refused(): void
    {
        $clean = $this->sanitizer()->sanitizeRichContent(
            '<p>hi</p><script>alert(1)</script><iframe src="https://example.com"></iframe>'
        );

        $this->assertStringNotContainsString('<script', $clean);
        $this->assertStringNotContainsString('<iframe', $clean);
    }

    public function test_a_javascript_url_on_an_image_is_refused(): void
    {
        $clean = $this->sanitizer()->sanitizeRichContent('<img src="javascript:alert(1)">');

        $this->assertStringNotContainsString('javascript:', $clean);
    }

    /**
     * A real one-pixel JPEG, written byte for byte.
     *
     * UploadedFile::fake()->image() needs ext-gd to draw one, and this
     * installation has no image extension at all — which is itself why the
     * upload endpoint decodes headers rather than re-encoding pixels.
     */
    /** The bytes themselves, so no test has to read a file back to get them. */
    private function jpegBytes(): string
    {
        return base64_decode(
            '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0a'
            .'HBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAALCAABAAEBAREA/8QAFAABAAAAAAAA'
            .'AAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AKp//2Q=='
        );
    }

    private function upload(string $bytes, string $name = 'screenshot.jpg'): UploadedFile
    {
        $path = sys_get_temp_dir().'/'.uniqid('shot_').'.jpg';
        file_put_contents($path, $bytes);

        return new UploadedFile($path, $name, 'image/jpeg', null, true);
    }

    private function jpeg(string $name = 'screenshot.jpg'): UploadedFile
    {
        return $this->upload($this->jpegBytes(), $name);
    }

    public function test_uploading_a_screenshot_returns_a_url_on_our_own_storage(): void
    {
        Storage::fake('public');
        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->postJson('/api/v1/forum/uploads', ['image' => $this->jpeg()]);

        $response->assertStatus(201)->assertJsonStructure(['url', 'width', 'height']);

        $this->assertStringContainsString('/storage/forum/'.$user->id.'/', $response->json('url'));
        $this->assertSame(1, count(Storage::disk('public')->allFiles('forum/'.$user->id)));
    }

    /**
     * The extension the client chose is never the extension we store under —
     * the detected type decides, so a PHP file named .jpg cannot land as .php,
     * and a real JPEG named .php still lands as .jpg.
     */
    public function test_the_stored_name_comes_from_the_bytes_not_from_the_client(): void
    {
        Storage::fake('public');
        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->postJson('/api/v1/forum/uploads', ['image' => $this->jpeg('shell.php')]);

        $response->assertStatus(201);
        $this->assertStringEndsWith('.jpg', $response->json('url'));
        $this->assertStringNotContainsString('.php', $response->json('url'));
    }

    public function test_a_file_that_is_not_really_an_image_is_refused(): void
    {
        Storage::fake('public');

        $path = sys_get_temp_dir().'/'.uniqid('payload_').'.jpg';
        file_put_contents($path, "<?php echo 'pwned';");

        $this->actingAs(User::factory()->create())
            ->postJson('/api/v1/forum/uploads', [
                // Claims to be a JPEG, in both name and declared type.
                'image' => new UploadedFile($path, 'looks-fine.jpg', 'image/jpeg', null, true),
            ])
            ->assertStatus(422);

        $this->assertSame([], Storage::disk('public')->allFiles('forum'));
    }

    public function test_exif_is_stripped_from_a_jpeg(): void
    {
        Storage::fake('public');
        $user = User::factory()->create();

        // A JPEG with an APP1 segment carrying an EXIF marker spliced in after
        // the SOI, the way a camera writes one.
        //
        // Built from the bytes rather than by reading back a file this test
        // just wrote: doing that failed in a full suite run — the temp file was
        // no longer there and file_get_contents returned false — while passing
        // whenever the test ran alone.
        $original = $this->jpegBytes();
        $exifPayload = 'Exif'.chr(0).chr(0).str_repeat('GPS-SECRET', 8);
        $app1 = chr(0xFF).chr(0xE1).pack('n', strlen($exifPayload) + 2).$exifPayload;
        $withExif = substr($original, 0, 2).$app1.substr($original, 2);

        $response = $this->actingAs($user)
            ->postJson('/api/v1/forum/uploads', [
                'image' => $this->upload($withExif, 'photo.jpg'),
            ]);

        $response->assertStatus(201);

        $storedPath = 'forum/'.$user->id.'/'.basename($response->json('url'));
        $stored = Storage::disk('public')->get($storedPath);

        $this->assertStringNotContainsString('GPS-SECRET', $stored);
        // ...and it is still a JPEG.
        $this->assertSame(chr(0xFF).chr(0xD8), substr($stored, 0, 2));
    }

    public function test_uploading_needs_a_signed_in_member(): void
    {
        $this->postJson('/api/v1/forum/uploads', ['image' => $this->jpeg()])->assertStatus(401);
    }

    public function test_a_posted_reply_keeps_our_image_and_drops_a_foreign_one(): void
    {
        $board = Category::create(['name' => 'General', 'slug' => 'general', 'type' => 'forum']);
        $thread = Thread::create([
            'title' => 'Show your rig',
            'slug' => 'show-your-rig',
            'content' => 'Post a photo.',
            'author_id' => User::factory()->create()->id,
            'category_id' => $board->id,
        ]);

        $this->actingAs(User::factory()->create())
            ->postJson("/api/v1/forum/threads/{$thread->slug}/posts", [
                'content' => '<p>Here it is</p><img src="'.$this->ownHostUrl().'" alt="rig">'
                    .'<img src="https://tracker.example.com/pixel.gif" alt="">',
            ])
            ->assertStatus(201);

        $stored = $thread->posts()->first()->content;

        $this->assertStringContainsString('example.webp', $stored);
        $this->assertStringNotContainsString('tracker.example.com', $stored);
    }
}
