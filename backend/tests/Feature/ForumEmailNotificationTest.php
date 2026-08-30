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
 * A forum reply reaches the bell and never an inbox.
 *
 * This file used to assert the opposite, and correctly so: a reply mailed the
 * thread's author when they had asked for email and their address was verified.
 * On 31.08.2026 that changed by decision rather than by accident — TechPlay now
 * sends four kinds of email and no more: address verification, password reset,
 * the contact form, and the newsletter confirmation.
 *
 * The reason is the first two. A domain earns its way into the inbox slowly and
 * loses it fast, and every optional message spends reputation that the password
 * reset is relying on. A forum reply is worth a bell.
 *
 * The old assertions are kept, inverted, because the thing worth guarding did
 * not disappear when the channel did: this notification still has to be sent,
 * still has to carry the database channel, and must never quietly grow a mail
 * channel back.
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

    /**
     * Even the member who asked for email, with a verified address — the case
     * that used to be the whole point of this file.
     */
    public function test_a_member_who_asked_for_email_still_only_gets_the_bell(): void
    {
        $author = User::factory()->create([
            'email_notifications' => true,
            'email_verified_at' => now(),
        ]);

        // Called once: each call opens a thread, and two would collide on slug.
        $channels = $this->channelsFor($author);

        $this->assertContains('database', $channels);
        $this->assertNotContains('mail', $channels);
    }

    public function test_a_member_who_turned_email_off_gets_the_bell(): void
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
     * necessarily the person who owns it. Nothing is written to it either way
     * now, but the member is still told in the app.
     */
    public function test_an_unverified_address_is_never_written_to(): void
    {
        $author = User::factory()->create([
            'email_notifications' => true,
            'email_verified_at' => null,
        ]);

        $channels = $this->channelsFor($author);

        $this->assertContains('database', $channels);
        $this->assertNotContains('mail', $channels);
    }
}
