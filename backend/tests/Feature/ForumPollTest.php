<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Thread;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

/**
 * Polls on a thread.
 *
 * The interesting rules are the ones that stop a poll being gamed or
 * misread: one vote per person however many times they press, options that
 * belong to this poll and no other, and a hidden tally that is genuinely
 * absent from the payload rather than merely not drawn.
 */
class ForumPollTest extends TestCase
{
    use RefreshDatabase;

    private User $author;

    private Thread $thread;

    protected function setUp(): void
    {
        parent::setUp();

        $board = Category::create(['name' => 'General', 'slug' => 'general', 'type' => 'forum']);
        $this->author = User::factory()->create();

        $this->thread = Thread::create([
            'title' => 'Which GPU',
            'slug' => 'which-gpu',
            'content' => 'Help me choose.',
            'author_id' => $this->author->id,
            'category_id' => $board->id,
        ]);
    }

    private function makePoll(array $overrides = []): array
    {
        return $this->actingAs($this->author)
            ->postJson("/api/v1/forum/threads/{$this->thread->slug}/poll", array_merge([
                'question' => 'Which card should I buy?',
                'options' => ['4070', '7900 XT', 'Wait'],
            ], $overrides))
            ->assertStatus(201)
            ->json();
    }

    public function test_the_thread_author_can_add_a_poll(): void
    {
        $poll = $this->makePoll();

        $this->assertSame('Which card should I buy?', $poll['question']);
        $this->assertCount(3, $poll['options']);
        $this->assertSame(0, $poll['voters']);
    }

    public function test_a_stranger_cannot_add_a_poll_to_somebody_elses_thread(): void
    {
        $this->actingAs(User::factory()->create())
            ->postJson("/api/v1/forum/threads/{$this->thread->slug}/poll", [
                'question' => 'My question instead',
                'options' => ['a', 'b'],
            ])
            ->assertStatus(403);
    }

    public function test_staff_can_add_one(): void
    {
        Role::findOrCreate('Moderator', 'web');
        $moderator = User::factory()->create();
        $moderator->assignRole('Moderator');

        $this->actingAs($moderator)
            ->postJson("/api/v1/forum/threads/{$this->thread->slug}/poll", [
                'question' => 'A moderator question',
                'options' => ['a', 'b'],
            ])
            ->assertStatus(201);
    }

    public function test_a_thread_gets_only_one_poll(): void
    {
        $this->makePoll();

        $this->actingAs($this->author)
            ->postJson("/api/v1/forum/threads/{$this->thread->slug}/poll", [
                'question' => 'And another thing',
                'options' => ['a', 'b'],
            ])
            ->assertStatus(422);
    }

    public function test_duplicate_options_collapse_and_two_are_still_required(): void
    {
        $this->actingAs($this->author)
            ->postJson("/api/v1/forum/threads/{$this->thread->slug}/poll", [
                'question' => 'Same thing twice',
                'options' => ['Yes', 'Yes'],
            ])
            ->assertStatus(422);
    }

    public function test_voting_twice_replaces_rather_than_stacks(): void
    {
        $poll = $this->makePoll();
        $voter = User::factory()->create();
        $url = "/api/v1/forum/threads/{$this->thread->slug}/poll/vote";

        $this->actingAs($voter)->postJson($url, ['options' => [$poll['options'][0]['id']]])->assertOk();
        $second = $this->actingAs($voter)->postJson($url, ['options' => [$poll['options'][1]['id']]])->assertOk();

        $this->assertSame(1, DB::table('poll_votes')->where('user_id', $voter->id)->count());
        $this->assertSame(1, $second->json('voters'));
        $this->assertSame(0, $second->json('options.0.votes'));
        $this->assertSame(1, $second->json('options.1.votes'));
    }

    public function test_a_single_choice_poll_refuses_two_answers(): void
    {
        $poll = $this->makePoll();

        $this->actingAs(User::factory()->create())
            ->postJson("/api/v1/forum/threads/{$this->thread->slug}/poll/vote", [
                'options' => [$poll['options'][0]['id'], $poll['options'][1]['id']],
            ])
            ->assertStatus(422);
    }

    public function test_a_multiple_choice_poll_accepts_several(): void
    {
        $poll = $this->makePoll(['allows_multiple' => true]);

        $response = $this->actingAs(User::factory()->create())
            ->postJson("/api/v1/forum/threads/{$this->thread->slug}/poll/vote", [
                'options' => [$poll['options'][0]['id'], $poll['options'][2]['id']],
            ]);

        $response->assertOk();
        // Two votes, one voter — the percentage everybody actually wants.
        $this->assertSame(1, $response->json('voters'));
        $this->assertSame(1, $response->json('options.0.votes'));
        $this->assertSame(1, $response->json('options.2.votes'));
    }

    /**
     * Voting into another poll's option would let one thread's result be moved
     * from another thread entirely.
     */
    public function test_an_option_from_a_different_poll_is_refused(): void
    {
        $mine = $this->makePoll();

        $otherThread = Thread::create([
            'title' => 'Different question',
            'slug' => 'different-question',
            'content' => 'x',
            'author_id' => $this->author->id,
            'category_id' => $this->thread->category_id,
        ]);
        $other = $this->actingAs($this->author)
            ->postJson("/api/v1/forum/threads/{$otherThread->slug}/poll", [
                'question' => 'Something else entirely',
                'options' => ['p', 'q'],
            ])->json();

        $this->actingAs(User::factory()->create())
            ->postJson("/api/v1/forum/threads/{$this->thread->slug}/poll/vote", [
                'options' => [$other['options'][0]['id']],
            ])
            ->assertStatus(422);

        $this->assertNotNull($mine['id']);
    }

    /**
     * A hidden tally has to be absent from the response, not merely undrawn —
     * anything sent is readable whatever the interface does with it.
     */
    public function test_a_hidden_tally_is_not_in_the_payload_until_you_vote(): void
    {
        $poll = $this->makePoll(['hide_results_until_voted' => true]);
        $voter = User::factory()->create();

        $before = $this->actingAs($voter)->getJson("/api/v1/forum/threads/{$this->thread->slug}");
        $before->assertOk()
            ->assertJsonPath('poll.can_see_results', false)
            ->assertJsonPath('poll.options.0.votes', null);

        $this->actingAs($voter)
            ->postJson("/api/v1/forum/threads/{$this->thread->slug}/poll/vote", [
                'options' => [$poll['options'][0]['id']],
            ])->assertOk();

        $this->actingAs($voter)->getJson("/api/v1/forum/threads/{$this->thread->slug}")
            ->assertOk()
            ->assertJsonPath('poll.can_see_results', true)
            ->assertJsonPath('poll.options.0.votes', 1);
    }

    public function test_a_locked_thread_stops_taking_votes(): void
    {
        $poll = $this->makePoll();
        $this->thread->update(['is_locked' => true]);

        $this->actingAs(User::factory()->create())
            ->postJson("/api/v1/forum/threads/{$this->thread->slug}/poll/vote", [
                'options' => [$poll['options'][0]['id']],
            ])
            ->assertStatus(403);
    }

    public function test_a_thread_without_a_poll_reports_none(): void
    {
        $this->getJson("/api/v1/forum/threads/{$this->thread->slug}")
            ->assertOk()
            ->assertJsonPath('poll', null);
    }
}
