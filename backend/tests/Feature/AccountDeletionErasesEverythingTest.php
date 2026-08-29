<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

/**
 * "Delete my account" has to mean it.
 *
 * The method anonymises rather than drops the row — forum posts and list
 * authorship have to keep pointing somewhere — which is a legitimate reading of
 * erasure, and it is thorough. It was thorough by hand, though: a list of
 * column names written once, and four of the twelve names on it are columns
 * this table does not have. `array_key_exists` made that harmless and also
 * hid it, so nobody noticed that `gamertags` — which does exist, and holds the
 * player's handles on every platform — was never on the list at all. Seven
 * accounts carried one.
 *
 * This test does not take a list. It reads the table, and asks whether anything
 * that can name a person survived.
 */
class AccountDeletionErasesEverythingTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Columns that may still hold a value after deletion, and why.
     *
     * @var array<string, string>
     */
    private const KEPT = [
        'id' => 'the row has to stay for the posts that point at it',
        'email' => 'replaced with deleted_{id}@deleted.techplay.gg, not emptied',
        'username' => 'replaced with deleted_user_{id}',
        'name' => 'replaced with "Deleted User"',
        'password' => 'left hashed — the account cannot be signed into either way',
        'created_at' => 'not personal',
        'updated_at' => 'not personal',
        'email_verified_at' => 'not personal',
        'role' => 'not personal',
        'rank_id' => 'not personal',
        'xp' => 'not personal',
        'forum_reputation' => 'not personal',
        'bounty_balance' => 'not personal',
        'is_banned' => 'moderation state, not identity',
        'banned_until' => 'moderation state',
        'daily_streak' => 'not personal',
        'last_daily_claim' => 'not personal',
        'last_seen_at' => 'not personal',
        'email_notifications' => 'a flag',
        'settings' => 'preferences, no handle in them',
        'subscription_ends_at' => 'financial record',
        'paypal_customer_id' => 'financial record — kept for accounting, not display',
        'paypal_subscription_id' => 'financial record',
        'remember_token' => 'cleared on save by Laravel, not identity',
        'playstyle_tags' => 'a set of labels, not a handle',

        // Preferences and counters. None of them can name anybody, and
        // wiping them would only make the row look tampered with.
        'post_color' => 'a UI preference',
        'profile_visibility' => 'a preference',
        'auto_add_played_games' => 'a preference',
        'active_days_count' => 'a counter',
        'dna_score' => 'a computed number',
        'ban_reason' => 'moderation record, kept with is_banned',
    ];

    public function test_nothing_that_names_a_person_survives_deletion(): void
    {
        $user = User::factory()->create(['password' => bcrypt('tajna-lozinka')]);

        // Fill every column the table has with something identifiable, so the
        // test fails when a new column is added and forgotten — which is
        // exactly how gamertags was missed.
        $filled = [];
        foreach (Schema::getColumnListing('users') as $column) {
            if (array_key_exists($column, self::KEPT)) {
                continue;
            }

            $value = match (true) {
                str_contains($column, 'tags') || str_contains($column, 'links') || str_contains($column, 'specs') => json_encode(['handle' => 'ProbeHandle77']),
                default => 'ProbeHandle77',
            };

            try {
                $user->forceFill([$column => $value])->save();
                $filled[] = $column;
            } catch (\Throwable) {
                // A column that will not take a string — a date, an integer, a
                // foreign key. Nothing a handle hides in.
            }
        }

        $this->assertNotEmpty($filled, 'No column took a probe value — the test is not testing anything.');

        $this->actingAs($user->fresh())
            ->deleteJson('/api/v1/user/account', ['current_password' => 'tajna-lozinka'])
            ->assertOk();

        $after = $user->fresh();

        $survived = [];
        foreach ($filled as $column) {
            if (str_contains((string) $after->getRawOriginal($column), 'ProbeHandle77')) {
                $survived[] = $column;
            }
        }

        $this->assertSame(
            [],
            $survived,
            'These columns still name the person after deletion: '.implode(', ', $survived),
        );
    }

    /**
     * The picture, not just the column that pointed at it.
     *
     * Avatars are stored as `asset('storage/…')`, an absolute URL, and the
     * cleanup skipped anything starting with "http" — so the guard written to
     * remove orphaned uploads could never match the one kind of upload people
     * make, and every deleted account left its portrait readable on the public
     * disk. Covers were stored relative and were removed, which is why this
     * went unnoticed.
     */
    public function test_the_uploaded_avatar_is_removed_from_disk(): void
    {
        Storage::fake('public');

        $user = User::factory()->create(['password' => bcrypt('tajna-lozinka')]);

        Storage::disk('public')->put('avatars/probni.jpg', 'slika');
        Storage::disk('public')->put('covers/probni.jpg', 'slika');

        $user->forceFill([
            'avatar_url' => asset('storage/avatars/probni.jpg'),
            'cover_image' => 'covers/probni.jpg',
        ])->save();

        $this->actingAs($user->fresh())
            ->deleteJson('/api/v1/user/account', ['current_password' => 'tajna-lozinka'])
            ->assertOk();

        Storage::disk('public')->assertMissing('avatars/probni.jpg');
        Storage::disk('public')->assertMissing('covers/probni.jpg');
    }

    /**
     * The open letter keeps its own copy of the address.
     *
     * `last_disc_signatures` collects an email of its own, because the letter is
     * open to people who are not signed in. Its `user_id` is `nullOnDelete`,
     * which never fires here — the account is anonymised in place rather than
     * dropped — so the real address stayed in that table beside a name.
     */
    public function test_the_campaign_signature_stops_naming_the_person(): void
    {
        $user = User::factory()->create([
            'email' => 'stvarna@adresa.test',
            'password' => bcrypt('tajna-lozinka'),
        ]);

        DB::table('last_disc_signatures')->insert([
            'user_id' => $user->id,
            'email' => 'stvarna@adresa.test',
            'name' => 'Pravo Ime',
            'display' => 'name',
            'wants_updates' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->actingAs($user->fresh())
            ->deleteJson('/api/v1/user/account', ['current_password' => 'tajna-lozinka'])
            ->assertOk();

        $signature = DB::table('last_disc_signatures')->where('user_id', $user->id)->first();

        $this->assertNotNull($signature, 'The signature itself should survive — it counts toward a public tally.');
        $this->assertNotSame('stvarna@adresa.test', $signature->email);
        $this->assertNull($signature->name);
    }

    public function test_deletion_refuses_without_the_current_password(): void
    {
        // Irreversible, and once reachable with nothing but a bearer token —
        // one XSS-exfiltrated token was the whole barrier.
        $user = User::factory()->create(['password' => bcrypt('tajna-lozinka')]);

        $this->actingAs($user)
            ->deleteJson('/api/v1/user/account', ['current_password' => 'pogresna'])
            ->assertStatus(422);

        $this->assertStringNotContainsString('deleted_', $user->fresh()->email);
    }
}
