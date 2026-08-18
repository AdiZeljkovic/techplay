<?php

namespace Tests\Feature;

use App\Models\User;
use App\Services\GamerDnaService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/**
 * The peers block of a reader's Gamer DNA.
 *
 * It selected a column called `avatar`, and `users` has never had one — it has
 * `avatar_url`, which the mapping right below the query was already reading. So
 * the query threw `SQLSTATE[42703] Undefined column` every time a reader had
 * peers at all, and the whole DNA endpoint went down with it.
 *
 * Nothing in the panel and nothing in the suite walked this path; it was found
 * by reading the production log.
 */
class GamerDnaPeersTest extends TestCase
{
    use RefreshDatabase;

    public function test_a_reader_with_peers_gets_them_back(): void
    {
        $reader = User::factory()->create(['username' => 'reader']);

        $peers = User::factory()->count(2)->sequence(
            ['username' => 'first-peer', 'display_name' => 'First Peer', 'avatar_url' => 'avatars/one.png'],
            ['username' => 'second-peer', 'display_name' => 'Second Peer', 'avatar_url' => null],
        )->create();

        // `user_chronicles` carries `built_at`, not timestamps.
        DB::table('user_chronicles')->insert([
            'user_id' => $reader->id,
            'peer_ids' => json_encode($peers->pluck('id')->all()),
            'built_at' => now(),
        ]);

        $method = new \ReflectionMethod(GamerDnaService::class, 'peers');
        $method->setAccessible(true);

        $result = $method->invoke(app(GamerDnaService::class), $reader);

        $this->assertCount(2, $result);
        $this->assertSame('first-peer', $result[0]['username']);
        $this->assertSame('avatars/one.png', $result[0]['avatar_url']);
        $this->assertNull($result[1]['avatar_url']);
    }

    public function test_a_reader_with_no_peers_gets_an_empty_list(): void
    {
        $reader = User::factory()->create();

        $method = new \ReflectionMethod(GamerDnaService::class, 'peers');
        $method->setAccessible(true);

        $this->assertSame([], $method->invoke(app(GamerDnaService::class), $reader));
    }
}
