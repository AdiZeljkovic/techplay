<?php

namespace Tests\Feature;

use App\Models\Friendship;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Blocking, end to end.
 *
 * P1 made the block actually enforce — it used to write a row no code path
 * read. P5 found that nothing in the interface could trigger it, and that there
 * was no way to undo one either. Both halves are covered here, because a block
 * you cannot lift is worse than no block at all.
 */
class BlockingTest extends TestCase
{
    use RefreshDatabase;

    public function test_blocking_stops_messages_and_can_be_lifted(): void
    {
        $me = User::factory()->create();
        $other = User::factory()->create(['username' => 'nuisance']);

        Friendship::create([
            'sender_id' => $me->id,
            'receiver_id' => $other->id,
            'status' => 'accepted',
        ]);

        $this->actingAs($me)->postJson("/api/v1/friends/block/{$other->id}")->assertSuccessful();

        $this->assertDatabaseHas('friendships', [
            'sender_id' => $me->id,
            'receiver_id' => $other->id,
            'status' => 'blocked',
        ]);

        // The point of the P1 fix: the block is enforced, not decorative.
        $this->actingAs($other)->postJson('/api/v1/conversations', [
            'type' => 'direct',
            'username' => $me->username,
        ])->assertStatus(422);

        // And the point of this one: it can be undone.
        $this->actingAs($me)->deleteJson("/api/v1/friends/block/{$other->id}")->assertSuccessful();

        $this->assertDatabaseMissing('friendships', [
            'sender_id' => $me->id,
            'receiver_id' => $other->id,
            'status' => 'blocked',
        ]);

        $this->actingAs($other)->postJson('/api/v1/conversations', [
            'type' => 'direct',
            'username' => $me->username,
        ])->assertSuccessful();
    }

    public function test_unblocking_someone_you_never_blocked_is_refused(): void
    {
        $me = User::factory()->create();
        $stranger = User::factory()->create();

        $this->actingAs($me)->deleteJson("/api/v1/friends/block/{$stranger->id}")->assertStatus(404);
    }

    public function test_you_cannot_block_yourself_or_a_ghost(): void
    {
        $me = User::factory()->create();

        $this->actingAs($me)->postJson("/api/v1/friends/block/{$me->id}")->assertStatus(422);
        $this->actingAs($me)->postJson('/api/v1/friends/block/999999')->assertStatus(422);
    }
}
