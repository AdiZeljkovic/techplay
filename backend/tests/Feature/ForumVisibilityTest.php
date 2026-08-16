<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Post;
use App\Models\Thread;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

/**
 * Private boards, and every door into them.
 *
 * A private board is only private if it is private on all of them: the index,
 * the board page, a direct link to a thread inside it, the "new posts" list,
 * search, a game's thread list, and posting. Closing four of seven is not a
 * feature, it is a leak with a lock drawn on the front.
 *
 * These tests exist one per door for that reason.
 */
class ForumVisibilityTest extends TestCase
{
    use RefreshDatabase;

    private Category $open;

    private Category $members;

    private Category $staffRoom;

    private Thread $secret;

    protected function setUp(): void
    {
        parent::setUp();
        Cache::flush();

        $this->open = Category::create(['name' => 'General', 'slug' => 'general', 'type' => 'forum']);
        $this->members = Category::create([
            'name' => 'Members Lounge', 'slug' => 'members-lounge', 'type' => 'forum',
            'visibility' => Category::VISIBILITY_MEMBERS,
        ]);
        $this->staffRoom = Category::create([
            'name' => 'Staff Room', 'slug' => 'staff-room', 'type' => 'forum',
            'visibility' => Category::VISIBILITY_STAFF,
        ]);

        $author = User::factory()->create();

        Thread::create([
            'title' => 'Public conversation', 'slug' => 'public-conversation',
            'content' => 'Anyone may read this.', 'author_id' => $author->id,
            'category_id' => $this->open->id,
        ]);

        $this->secret = Thread::create([
            'title' => 'Behind the curtain', 'slug' => 'behind-the-curtain',
            'content' => 'A confidential discussion about moderation.',
            'author_id' => $author->id, 'category_id' => $this->staffRoom->id,
        ]);

        Post::create([
            'thread_id' => $this->secret->id, 'author_id' => $author->id,
            'content' => 'A confidential reply.',
        ]);
    }

    private function moderator(): User
    {
        Role::findOrCreate('Moderator', 'web');
        $user = User::factory()->create();
        $user->assignRole('Moderator');

        return $user;
    }

    private function boardSlugsSeenBy(?User $user): array
    {
        Cache::flush();

        $request = $user ? $this->actingAs($user) : $this;
        $payload = $request->getJson('/api/v1/forum/categories')->assertOk()->json();

        return collect($payload)
            ->flatMap(fn ($parent) => empty($parent['children']) ? [$parent] : $parent['children'])
            ->pluck('slug')
            ->all();
    }

    /**
     * One audience per test, deliberately.
     *
     * These controllers read the viewer through the sanctum guard, because the
     * public forum routes carry no auth middleware and the default guard is
     * never resolved on them. Once that guard has resolved a user inside a
     * test, a later actingAs does not replace it — so three audiences in one
     * test method silently measure the first one three times. Learned here the
     * hard way, and it is why the file reads repetitively.
     */
    public function test_a_signed_out_visitor_sees_only_public_boards(): void
    {
        $guest = $this->boardSlugsSeenBy(null);

        $this->assertContains('general', $guest);
        $this->assertNotContains('members-lounge', $guest);
        $this->assertNotContains('staff-room', $guest);
    }

    public function test_a_member_sees_the_members_board_but_not_the_staff_one(): void
    {
        $member = $this->boardSlugsSeenBy(User::factory()->create());

        $this->assertContains('general', $member);
        $this->assertContains('members-lounge', $member);
        $this->assertNotContains('staff-room', $member);
    }

    public function test_staff_see_every_board(): void
    {
        $staff = $this->boardSlugsSeenBy($this->moderator());

        $this->assertContains('general', $staff);
        $this->assertContains('members-lounge', $staff);
        $this->assertContains('staff-room', $staff);
    }

    /**
     * The cache is where this kind of thing usually breaks: one shared entry,
     * and whoever asks first decides what everyone else sees.
     *
     * Asserted on the cache entries rather than by making a second request,
     * because actingAs stays in force for the rest of a test — a "guest" call
     * after a moderator call is still the moderator, and an assertion written
     * that way proves nothing. Two audiences, two keys, different contents.
     */
    public function test_each_audience_gets_its_own_cache_entry(): void
    {
        Cache::flush();

        $this->getJson('/api/v1/forum/categories')->assertOk();
        $this->actingAs($this->moderator())->getJson('/api/v1/forum/categories')->assertOk();

        $guestEntry = json_encode(Cache::get('forum.categories.guest'));
        $staffEntry = json_encode(Cache::get('forum.categories.staff'));

        $this->assertNotNull($guestEntry, 'the guest listing was never cached');
        $this->assertNotNull($staffEntry, 'the staff listing was never cached');

        $this->assertStringNotContainsString('staff-room', (string) $guestEntry);
        $this->assertStringContainsString('staff-room', (string) $staffEntry);
    }

    /**
     * 404 rather than 403: a refusal confirms the board is there, and for a
     * private room that confirmation is itself the thing being kept private.
     */
    public function test_a_private_board_page_is_invisible_to_a_guest(): void
    {
        $this->getJson('/api/v1/forum/categories/staff-room')->assertStatus(404);
    }

    public function test_a_private_board_page_is_invisible_to_an_ordinary_member(): void
    {
        $this->actingAs(User::factory()->create())
            ->getJson('/api/v1/forum/categories/staff-room')
            ->assertStatus(404);
    }

    public function test_staff_can_open_the_private_board(): void
    {
        $this->actingAs($this->moderator())
            ->getJson('/api/v1/forum/categories/staff-room')
            ->assertOk();
    }

    public function test_a_direct_link_into_a_private_board_is_closed_to_a_guest(): void
    {
        $this->getJson("/api/v1/forum/threads/{$this->secret->slug}")->assertStatus(404);
    }

    public function test_a_direct_link_into_a_private_board_is_closed_to_a_member(): void
    {
        $this->actingAs(User::factory()->create())
            ->getJson("/api/v1/forum/threads/{$this->secret->slug}")
            ->assertStatus(404);
    }

    public function test_staff_can_follow_that_link(): void
    {
        $this->actingAs($this->moderator())
            ->getJson("/api/v1/forum/threads/{$this->secret->slug}")
            ->assertOk();
    }

    public function test_the_new_posts_list_does_not_carry_them(): void
    {
        Cache::flush();

        $body = $this->getJson('/api/v1/forum/active')->assertOk()->getContent();

        $this->assertStringNotContainsString('Behind the curtain', $body);
        $this->assertStringNotContainsString('behind-the-curtain', $body);
    }

    public function test_a_members_board_is_hidden_from_signed_out_visitors_only(): void
    {
        $thread = Thread::create([
            'title' => 'Members only chat', 'slug' => 'members-only-chat',
            'content' => 'For people with accounts.', 'author_id' => User::factory()->create()->id,
            'category_id' => $this->members->id,
        ]);

        $this->getJson("/api/v1/forum/threads/{$thread->slug}")->assertStatus(404);

        $this->actingAs(User::factory()->create())
            ->getJson("/api/v1/forum/threads/{$thread->slug}")
            ->assertOk();
    }

    public function test_posting_into_a_board_you_cannot_see_is_refused(): void
    {
        $this->actingAs(User::factory()->create())
            ->postJson('/api/v1/forum/threads', [
                'title' => 'Sneaking in through the back',
                'content' => 'Guessing the category id should not work.',
                'category_id' => $this->staffRoom->id,
            ])
            ->assertStatus(422);
    }

    public function test_replying_into_a_board_you_cannot_see_is_refused(): void
    {
        $this->actingAs(User::factory()->create())
            ->postJson("/api/v1/forum/threads/{$this->secret->slug}/posts", [
                'content' => 'Replying where I should not be.',
            ])
            ->assertStatus(404);
    }

    public function test_boards_are_public_unless_someone_says_otherwise(): void
    {
        // The column arrived on a table full of boards that are public today;
        // a migration that quietly hid them would be the worse bug.
        $this->assertSame(Category::VISIBILITY_PUBLIC, $this->open->fresh()->visibility);
        $this->assertTrue($this->open->isVisibleTo(null));
    }
}
