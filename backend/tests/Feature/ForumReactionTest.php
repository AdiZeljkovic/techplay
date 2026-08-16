<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Post;
use App\Models\Thread;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/**
 * Reacting to one reply rather than to the whole thread.
 *
 * The forum had a single signal and it sat on the thread, so the only way to
 * tell somebody their answer helped was to write another reply saying so.
 */
class ForumReactionTest extends TestCase
{
    use RefreshDatabase;

    private Thread $thread;

    private Post $post;

    protected function setUp(): void
    {
        parent::setUp();

        $board = Category::create(['name' => 'General', 'slug' => 'general', 'type' => 'forum']);
        $author = User::factory()->create();

        $this->thread = Thread::create([
            'title' => 'A question',
            'slug' => 'a-question',
            'content' => 'How do I?',
            'author_id' => $author->id,
            'category_id' => $board->id,
        ]);

        $this->post = Post::create([
            'thread_id' => $this->thread->id,
            'author_id' => $author->id,
            'content' => 'Like this.',
        ]);
    }

    private function url(): string
    {
        return "/api/v1/forum/threads/{$this->thread->slug}/posts/{$this->post->id}/reactions";
    }

    public function test_a_reaction_is_recorded_and_counted(): void
    {
        $response = $this->actingAs(User::factory()->create())
            ->postJson($this->url(), ['reaction' => 'helpful']);

        $response->assertOk()
            ->assertJsonPath('action', 'added')
            ->assertJsonPath('reactions.helpful', 1)
            ->assertJsonPath('mine', 'helpful');
    }

    public function test_sending_the_same_reaction_again_takes_it_back(): void
    {
        $reader = User::factory()->create();

        $this->actingAs($reader)->postJson($this->url(), ['reaction' => 'helpful'])->assertOk();

        $this->actingAs($reader)->postJson($this->url(), ['reaction' => 'helpful'])
            ->assertOk()
            ->assertJsonPath('action', 'removed')
            ->assertJsonPath('mine', null);

        $this->assertSame(0, DB::table('post_reactions')->count());
    }

    public function test_a_second_reaction_replaces_the_first_rather_than_adding_to_it(): void
    {
        $reader = User::factory()->create();

        $this->actingAs($reader)->postJson($this->url(), ['reaction' => 'helpful'])->assertOk();

        $response = $this->actingAs($reader)->postJson($this->url(), ['reaction' => 'funny']);

        $response->assertOk()->assertJsonPath('action', 'changed')->assertJsonPath('mine', 'funny');

        $this->assertSame(1, DB::table('post_reactions')->count());
        $this->assertSame(['funny' => 1], $response->json('reactions'));
    }

    public function test_an_unknown_reaction_is_refused(): void
    {
        $this->actingAs(User::factory()->create())
            ->postJson($this->url(), ['reaction' => '<script>alert(1)</script>'])
            ->assertStatus(422);
    }

    /**
     * Same binding rule as every other post action: the post has to belong to
     * the thread in the URL, or the caller picks a slug freely and moves
     * somebody else's cache.
     */
    public function test_a_post_from_another_thread_is_refused(): void
    {
        $other = Thread::create([
            'title' => 'Elsewhere',
            'slug' => 'elsewhere',
            'content' => 'Different conversation.',
            'author_id' => User::factory()->create()->id,
            'category_id' => $this->thread->category_id,
        ]);

        $this->actingAs(User::factory()->create())
            ->postJson("/api/v1/forum/threads/{$other->slug}/posts/{$this->post->id}/reactions", [
                'reaction' => 'helpful',
            ])
            ->assertStatus(404);
    }

    public function test_reacting_needs_a_signed_in_member(): void
    {
        $this->postJson($this->url(), ['reaction' => 'helpful'])->assertStatus(401);
    }

    public function test_the_thread_page_reports_counts_and_what_you_picked(): void
    {
        $reader = User::factory()->create();
        $other = User::factory()->create();

        $this->actingAs($reader)->postJson($this->url(), ['reaction' => 'helpful'])->assertOk();
        $this->actingAs($other)->postJson($this->url(), ['reaction' => 'helpful'])->assertOk();

        $response = $this->actingAs($reader)->getJson("/api/v1/forum/threads/{$this->thread->slug}");

        $response->assertOk()
            ->assertJsonPath('posts.data.0.reactions.helpful', 2)
            ->assertJsonPath('posts.data.0.my_reaction', 'helpful');
    }

    /**
     * Its own test rather than a second request in the one above: actingAs
     * stays in force for the rest of a test, so the "signed out" call there was
     * still the reader, and the assertion proved nothing.
     */
    public function test_a_signed_out_visitor_sees_the_counts_but_no_reaction_of_their_own(): void
    {
        // Seeded straight into the table: calling the endpoint would sign this
        // test in, and actingAs stays in force for the rest of it — which is
        // exactly how the previous version of this assertion proved nothing.
        DB::table('post_reactions')->insert([
            'post_id' => $this->post->id,
            'user_id' => User::factory()->create()->id,
            'reaction' => 'helpful',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->getJson("/api/v1/forum/threads/{$this->thread->slug}")
            ->assertOk()
            ->assertJsonPath('posts.data.0.reactions.helpful', 1)
            ->assertJsonPath('posts.data.0.my_reaction', null);
    }
}
