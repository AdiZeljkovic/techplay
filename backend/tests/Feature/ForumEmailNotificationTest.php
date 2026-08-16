<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Thread;
use App\Models\User;
use App\Notifications\ForumReplyNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

/**
 * When a forum reply is allowed to reach an inbox.
 *
 * Only a reply to your own thread, only if you asked for email, and only if the
 * address has been verified — sending to an unverified address is sending to
 * whoever typed it, which may not be the person who owns it.
 */
class ForumEmailNotificationTest extends TestCase
{
    use RefreshDatabase;

    private function threadBy(User $author): Thread
    {
        $board = Category::create(['name' => 'General', 'slug' => 'general', 'type' => 'forum']);

        return Thread::create([
            'title' => 'A question of mine',
            'slug' => 'a-question-of-mine',
            'content' => 'Anyone?',
            'author_id' => $author->id,
            'category_id' => $board->id,
        ]);
    }

    private function channelsFor(User $author): array
    {
        $thread = $this->threadBy($author);

        Notification::fake();

        $this->actingAs(User::factory()->create(['email_verified_at' => now()]))
            ->postJson("/api/v1/forum/threads/{$thread->slug}/posts", ['content' => 'Here is an answer.'])
            ->assertStatus(201);

        $channels = [];
        Notification::assertSentTo($author, ForumReplyNotification::class,
            function ($notification, $sentChannels) use (&$channels) {
                $channels = $sentChannels;

                return true;
            });

        return $channels;
    }

    public function test_a_member_who_asked_for_email_gets_one(): void
    {
        $author = User::factory()->create([
            'email_notifications' => true,
            'email_verified_at' => now(),
        ]);

        // Called once: each call opens a thread, and two would collide on slug.
        $channels = $this->channelsFor($author);

        $this->assertContains('mail', $channels);
        $this->assertContains('database', $channels);
    }

    public function test_a_member_who_turned_email_off_only_gets_the_bell(): void
    {
        $author = User::factory()->create([
            'email_notifications' => false,
            'email_verified_at' => now(),
        ]);

        $channels = $this->channelsFor($author);

        $this->assertContains('database', $channels);
        $this->assertNotContains('mail', $channels);
    }

    /**
     * An unverified address belongs to whoever typed it, which is not
     * necessarily the person who owns it.
     */
    public function test_an_unverified_address_is_never_written_to(): void
    {
        $author = User::factory()->create([
            'email_notifications' => true,
            'email_verified_at' => null,
        ]);

        $this->assertNotContains('mail', $this->channelsFor($author));
    }
}
