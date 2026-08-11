<?php

namespace Tests\Feature;

use App\Events\ChatMessageSent;
use App\Models\Conversation;
use App\Models\ConversationParticipant;
use App\Models\Friendship;
use App\Models\Message;
use App\Models\User;
use App\Services\ChatService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class SocialHubTest extends TestCase
{
    use RefreshDatabase;

    private function befriend(User $a, User $b): void
    {
        Friendship::create(['sender_id' => $a->id, 'receiver_id' => $b->id, 'status' => 'accepted']);
    }

    /* ── conversations ────────────────────────────────────────────────── */

    public function test_opening_a_direct_thread_twice_does_not_fork_it(): void
    {
        $me = User::factory()->create();
        $other = User::factory()->create(['username' => 'shadowninja']);

        $first = $this->actingAs($me)->postJson('/api/v1/conversations', [
            'type' => 'direct', 'username' => 'shadowninja',
        ])->assertOk()->json('data.id');

        $second = $this->actingAs($other)->postJson('/api/v1/conversations', [
            'type' => 'direct', 'username' => $me->username,
        ])->assertOk()->json('data.id');

        $this->assertSame($first, $second, 'the same two people share one thread');
        $this->assertSame(1, Conversation::where('type', 'direct')->count());
    }

    public function test_a_group_takes_friends_only(): void
    {
        $me = User::factory()->create();
        $friend = User::factory()->create();
        $stranger = User::factory()->create();
        $this->befriend($me, $friend);

        $id = $this->actingAs($me)->postJson('/api/v1/conversations', [
            'type' => 'group', 'name' => 'Rift Wolves Squad',
            'member_ids' => [$friend->id, $stranger->id],
        ])->assertOk()->json('data.id');

        $conversation = Conversation::find($id);
        $this->assertSame('group', $conversation->type);
        $this->assertTrue($conversation->hasParticipant($friend->id));
        $this->assertFalse($conversation->hasParticipant($stranger->id), 'a group is not a way to message strangers');
        $this->assertSame('owner', $conversation->participants()->where('user_id', $me->id)->value('role'));

        // A group of nobody is refused.
        $this->actingAs($me)->postJson('/api/v1/conversations', [
            'type' => 'group', 'name' => 'Just me', 'member_ids' => [$stranger->id],
        ])->assertStatus(422);
    }

    public function test_sending_stores_broadcasts_and_marks_the_sender_read(): void
    {
        Event::fake([ChatMessageSent::class]);

        $me = User::factory()->create();
        $other = User::factory()->create(['username' => 'vortexgg']);

        $id = $this->actingAs($me)->postJson('/api/v1/conversations', ['type' => 'direct', 'username' => 'vortexgg'])->json('data.id');

        $this->actingAs($me)->postJson("/api/v1/conversations/{$id}/messages", ['body' => 'Wanna hop in a lobby?'])
            ->assertOk()
            ->assertJsonPath('data.body', 'Wanna hop in a lobby?')
            ->assertJsonPath('data.is_mine', true);

        Event::assertDispatched(ChatMessageSent::class);

        $this->assertSame(1, Message::where('conversation_id', $id)->count());
        $this->assertNotNull(
            ConversationParticipant::where('conversation_id', $id)->where('user_id', $me->id)->value('last_read_at')
        );
        // The direct thread keeps receiver_id in step for the legacy inbox.
        $this->assertSame($other->id, Message::first()->receiver_id);
    }

    public function test_an_empty_message_is_refused_but_an_image_alone_is_not(): void
    {
        Storage::fake('public');

        $me = User::factory()->create();
        $other = User::factory()->create(['username' => 'pixelpilot']);
        $id = $this->actingAs($me)->postJson('/api/v1/conversations', ['type' => 'direct', 'username' => 'pixelpilot'])->json('data.id');

        $this->actingAs($me)->postJson("/api/v1/conversations/{$id}/messages", ['body' => '   '])->assertStatus(422);

        $path = $this->actingAs($me)->post("/api/v1/conversations/{$id}/messages", [
            'image' => UploadedFile::fake()->create('clip.png', 120, 'image/png'),
        ])->assertOk()->json('data.attachment_path');

        Storage::disk('public')->assertExists($path);
        $this->assertNotNull($other);
    }

    public function test_outsiders_cannot_read_or_write_a_conversation(): void
    {
        $me = User::factory()->create();
        $other = User::factory()->create(['username' => 'crazyracoon']);
        $stranger = User::factory()->create();

        $id = $this->actingAs($me)->postJson('/api/v1/conversations', ['type' => 'direct', 'username' => 'crazyracoon'])->json('data.id');

        $this->actingAs($stranger)->getJson("/api/v1/conversations/{$id}/messages")->assertStatus(403);
        $this->actingAs($stranger)->postJson("/api/v1/conversations/{$id}/messages", ['body' => 'hi'])->assertStatus(403);
    }

    public function test_unread_counts_off_the_read_marker_and_clear_on_open(): void
    {
        $me = User::factory()->create();
        $other = User::factory()->create(['username' => 'reven8e']);
        $chat = app(ChatService::class);

        $conversation = $chat->directBetween($me, $other);
        $chat->send($conversation, $other, 'GG man, that was insane!');
        $chat->send($conversation, $other, 'Same time tomorrow?');

        $inbox = $this->actingAs($me)->getJson('/api/v1/conversations')->assertOk()->json('data');
        $this->assertSame(2, $inbox[0]['unread']);
        $this->assertSame('Same time tomorrow?', $inbox[0]['last_message']['body']);
        $this->assertFalse($inbox[0]['last_message']['is_mine']);
        $this->assertSame($other->username, $inbox[0]['name'], 'a direct thread is named by the other person');

        // Opening the thread clears it.
        $this->actingAs($me)->getJson("/api/v1/conversations/{$conversation->id}/messages")->assertOk();
        $this->assertSame(0, $this->actingAs($me)->getJson('/api/v1/conversations')->json('data.0.unread'));
    }

    public function test_reactions_toggle_and_count_per_emoji(): void
    {
        $me = User::factory()->create();
        $other = User::factory()->create();
        $chat = app(ChatService::class);
        $conversation = $chat->directBetween($me, $other);
        $message = $chat->send($conversation, $other, 'Let us get that W');

        $this->actingAs($me)->postJson("/api/v1/messages/{$message->id}/react", ['emoji' => '🔥'])
            ->assertOk()
            ->assertJsonPath('data.reactions.0.emoji', '🔥')
            ->assertJsonPath('data.reactions.0.count', 1)
            ->assertJsonPath('data.reactions.0.mine', true);

        // The same emoji again removes it.
        $this->actingAs($me)->postJson("/api/v1/messages/{$message->id}/react", ['emoji' => '🔥'])
            ->assertOk()
            ->assertJsonCount(0, 'data.reactions');

        // Only the offered set is accepted.
        $this->actingAs($me)->postJson("/api/v1/messages/{$message->id}/react", ['emoji' => '💀'])->assertStatus(422);
    }

    public function test_a_group_member_can_add_friends_and_leave(): void
    {
        $me = User::factory()->create();
        $a = User::factory()->create();
        $b = User::factory()->create();
        $this->befriend($me, $a);
        $this->befriend($me, $b);

        $id = $this->actingAs($me)->postJson('/api/v1/conversations', [
            'type' => 'group', 'name' => 'Squad', 'member_ids' => [$a->id],
        ])->json('data.id');

        $this->actingAs($me)->postJson("/api/v1/conversations/{$id}/participants", ['member_ids' => [$b->id]])
            ->assertOk()
            ->assertJsonPath('data.added', 1);

        $this->actingAs($a)->deleteJson("/api/v1/conversations/{$id}/leave")->assertOk();
        $this->assertFalse(Conversation::find($id)->hasParticipant($a->id));

        // A direct thread is not a group and cannot be left.
        $direct = app(ChatService::class)->directBetween($me, $a);
        $this->actingAs($me)->deleteJson("/api/v1/conversations/{$direct->id}/leave")->assertStatus(422);
    }

    /* ── the hub ──────────────────────────────────────────────────────── */

    public function test_the_hub_returns_the_shell_in_one_call(): void
    {
        $me = User::factory()->create();
        $friend = User::factory()->create();
        $this->befriend($me, $friend);

        $asker = User::factory()->create();
        Friendship::create(['sender_id' => $asker->id, 'receiver_id' => $me->id, 'status' => 'pending']);

        app(ChatService::class)->directBetween($me, $friend);

        $data = $this->actingAs($me)->getJson('/api/v1/social')->assertOk()->json('data');

        $this->assertSame(1, $data['stats']['friends']);
        $this->assertSame(1, $data['stats']['conversations']);
        $this->assertSame(0, $data['stats']['unread']);
        $this->assertSame($friend->username, $data['friends'][0]['username']);
        $this->assertSame($asker->username, $data['requests'][0]['user']['username']);
    }

    public function test_people_you_may_know_ranks_by_shared_friends_and_skips_the_obvious(): void
    {
        $me = User::factory()->create();
        $bridgeOne = User::factory()->create();
        $bridgeTwo = User::factory()->create();
        $this->befriend($me, $bridgeOne);
        $this->befriend($me, $bridgeTwo);

        // Known through both bridges…
        $popular = User::factory()->create();
        $this->befriend($bridgeOne, $popular);
        $this->befriend($bridgeTwo, $popular);

        // …and through one.
        $distant = User::factory()->create();
        $this->befriend($bridgeOne, $distant);

        // Already asked — not a suggestion.
        $asked = User::factory()->create();
        $this->befriend($bridgeOne, $asked);
        Friendship::create(['sender_id' => $me->id, 'receiver_id' => $asked->id, 'status' => 'pending']);

        $suggestions = $this->actingAs($me)->getJson('/api/v1/social')->assertOk()->json('data.suggestions');
        $names = collect($suggestions)->pluck('username');

        $this->assertSame($popular->username, $suggestions[0]['username']);
        $this->assertSame(2, $suggestions[0]['mutual_friends']);
        $this->assertTrue($names->contains($distant->username));
        $this->assertFalse($names->contains($asked->username), 'a pending request is not a suggestion');
        $this->assertFalse($names->contains($bridgeOne->username), 'existing friends are not suggestions');
    }
}
