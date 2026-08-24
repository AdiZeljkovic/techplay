<?php

namespace Tests\Feature;

use App\Models\Game;
use App\Models\GameList;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * A list somebody chose to publish.
 *
 * XLBanana47 made a list public, opened it, and got an error page. The API was
 * refusing it because his *profile* is friends-only, on the reasoning that
 * "the profile-level setting is the stronger intent" — which had it backwards.
 *
 * Profile visibility hides aggregates: the shelf, the stats, the activity, the
 * directory of somebody's lists. It has never unpublished a forum post, a
 * comment or a review, because those were deliberately put on a public page.
 * `is_public` on a list is that same deliberate act, and a setting cannot
 * quietly overrule the thing it is a setting for.
 */
class PublishedListStaysPublishedTest extends TestCase
{
    use RefreshDatabase;

    private function game(string $slug): Game
    {
        return Game::create([
            'slug' => $slug,
            'name' => ucfirst($slug),
            'released' => '2018-01-01',
            'genres' => ['RPG'],
            'platforms' => ['PC'],
            'tags' => [],
        ]);
    }

    private function listFor(User $user, array $attributes = []): GameList
    {
        $list = GameList::create(array_merge([
            'user_id' => $user->id,
            'name' => 'Hidden Gems',
            'slug' => 'hidden-gems',
            'is_public' => true,
            'is_draft' => false,
        ], $attributes));

        $list->items()->create(['game_id' => $this->game('tunic')->id, 'position' => 1]);

        return $list;
    }

    public function test_a_public_list_opens_even_when_the_profile_is_friends_only(): void
    {
        $user = User::factory()->create([
            'username' => 'XLBanana47',
            'profile_visibility' => 'friends',
        ]);

        $this->listFor($user);

        $this->getJson('/api/v1/users/XLBanana47/lists/hidden-gems')
            ->assertOk()
            ->assertJsonPath('data.name', 'Hidden Gems');
    }

    public function test_a_private_list_is_still_refused(): void
    {
        $user = User::factory()->create(['username' => 'XLBanana47']);
        $this->listFor($user, ['is_public' => false]);

        // The list's own setting is the one that decides.
        $this->getJson('/api/v1/users/XLBanana47/lists/hidden-gems')->assertStatus(403);
    }

    public function test_a_draft_is_still_refused(): void
    {
        $user = User::factory()->create(['username' => 'XLBanana47']);
        $this->listFor($user, ['is_draft' => true]);

        $this->getJson('/api/v1/users/XLBanana47/lists/hidden-gems')->assertStatus(403);
    }

    public function test_the_directory_of_someones_lists_is_still_hidden(): void
    {
        $user = User::factory()->create([
            'username' => 'XLBanana47',
            'profile_visibility' => 'friends',
        ]);

        $this->listFor($user);

        // "Show me everything this person has made" is the aggregate a private
        // profile exists to hide, even when one of the things is published.
        $this->getJson('/api/v1/users/XLBanana47/lists')->assertStatus(403);
    }

    public function test_the_same_list_answers_the_same_way_by_id(): void
    {
        $user = User::factory()->create(['profile_visibility' => 'friends']);
        $list = $this->listFor($user);

        // Two doors to one object; they used to disagree, which is how the
        // gate came to be copied into four places in the first place.
        $this->getJson("/api/v1/game-lists/{$list->id}")->assertOk();
    }
}
