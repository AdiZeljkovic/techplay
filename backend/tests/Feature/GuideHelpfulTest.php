<?php

namespace Tests\Feature;

use App\Models\Guide;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class GuideHelpfulTest extends TestCase
{
    use RefreshDatabase;

    private function guide(): Guide
    {
        return Guide::create([
            'author_id' => User::factory()->create()->id,
            'title' => 'How to get Tidal Shadow',
            'slug' => 'tidal-shadow',
            'content' => '<p>Forge it.</p>',
            'status' => 'published',
            'published_at' => now(),
        ]);
    }

    public function test_a_reader_can_say_a_guide_helped(): void
    {
        $guide = $this->guide();

        $this->actingAs(User::factory()->create())
            ->postJson("/api/v1/guides/{$guide->slug}/vote", ['is_helpful' => true])
            ->assertOk()
            ->assertJsonPath('data.user_vote', true)
            ->assertJsonPath('data.helpful_count', 1);
    }

    public function test_pressing_the_same_answer_twice_withdraws_it(): void
    {
        $guide = $this->guide();
        $user = User::factory()->create();

        $this->actingAs($user)->postJson("/api/v1/guides/{$guide->slug}/vote", ['is_helpful' => true]);

        // A verdict you cannot take back is one people stop giving.
        $this->actingAs($user)
            ->postJson("/api/v1/guides/{$guide->slug}/vote", ['is_helpful' => true])
            ->assertOk()
            ->assertJsonPath('data.user_vote', null)
            ->assertJsonPath('data.helpful_count', 0);
    }

    public function test_changing_your_mind_moves_the_vote_rather_than_adding_one(): void
    {
        $guide = $this->guide();
        $user = User::factory()->create();

        $this->actingAs($user)->postJson("/api/v1/guides/{$guide->slug}/vote", ['is_helpful' => true]);

        $this->actingAs($user)
            ->postJson("/api/v1/guides/{$guide->slug}/vote", ['is_helpful' => false])
            ->assertOk()
            ->assertJsonPath('data.helpful_count', 0)
            ->assertJsonPath('data.unhelpful_count', 1);
    }

    public function test_the_vote_evicts_the_cached_guide_so_the_count_moves(): void
    {
        $guide = $this->guide();

        // Warm the cache the way a reader arriving on the page would.
        $this->getJson("/api/v1/guides/{$guide->slug}")->assertOk()->assertJsonPath('guide.helpful_count', 0);
        $this->assertTrue(Cache::has("guide.show.v3.{$guide->slug}"));

        $this->actingAs(User::factory()->create())
            ->postJson("/api/v1/guides/{$guide->slug}/vote", ['is_helpful' => true])->assertOk();

        $this->getJson("/api/v1/guides/{$guide->slug}")->assertOk()->assertJsonPath('guide.helpful_count', 1);
    }

    public function test_a_guest_cannot_vote(): void
    {
        $guide = $this->guide();

        $this->postJson("/api/v1/guides/{$guide->slug}/vote", ['is_helpful' => true])->assertStatus(401);
    }
}
