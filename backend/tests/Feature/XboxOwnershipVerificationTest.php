<?php

namespace Tests\Feature;

use App\Models\ConnectedAccount;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Proving a gamertag is yours.
 *
 * Anyone can type any gamertag, so linking one proves nothing; the check is a
 * short code the reader puts in their Xbox profile bio and we read back.
 *
 * It could never pass. `OpenXblService::playerSummary()` builds its answer
 * from three settings — gamertag, gamerscore, avatar — and the confirm step
 * asked it for a fourth, `bio`, which was never in there. So every attempt
 * compared the code against an empty string and failed, and the reader was
 * told Xbox had not published their change yet: a sentence that would have
 * stayed false however long they waited. Measured on a real account, the bio
 * held the code the whole time.
 */
class XboxOwnershipVerificationTest extends TestCase
{
    use RefreshDatabase;

    /** An Xbox profile as OpenXBL returns one: a flat list of id/value pairs. */
    private function fakeProfile(string $bio): void
    {
        Http::fake(['*xbl.io*' => Http::response(['content' => ['profileUsers' => [[
            'settings' => [
                ['id' => 'Gamertag', 'value' => 'RespawnBA'],
                ['id' => 'Gamerscore', 'value' => '1234'],
                ['id' => 'GameDisplayPicRaw', 'value' => 'https://example.test/pic.png'],
                ['id' => 'Bio', 'value' => $bio],
            ],
        ]]]])]);
    }

    private function linkedUser(): User
    {
        $user = User::factory()->create();

        ConnectedAccount::create([
            'user_id' => $user->id,
            'provider' => 'xbox',
            'provider_user_id' => '2533274884774855',
            'display_name' => 'RespawnBA',
            'sync_status' => 'done',
        ]);

        Sanctum::actingAs($user);

        return $user;
    }

    private function startAndGetCode(): string
    {
        return $this->postJson('/api/v1/connected-accounts/xbox/verify')
            ->assertOk()
            ->json('data.code');
    }

    public function test_a_code_in_the_bio_verifies_the_gamertag(): void
    {
        $user = $this->linkedUser();
        $code = $this->startAndGetCode();

        $this->fakeProfile("Some words and {$code} in the bio");

        $this->postJson('/api/v1/connected-accounts/xbox/verify/confirm')->assertOk();

        $account = ConnectedAccount::where('user_id', $user->id)->where('provider', 'xbox')->first();

        $this->assertNotNull(data_get($account->metadata, 'verified_at'));
        // The code is cleared once spent, so a stale one cannot be replayed.
        $this->assertNull(data_get($account->metadata, 'verification_code'));
    }

    public function test_xbox_sends_the_bio_with_a_carriage_return_and_it_still_matches(): void
    {
        $this->linkedUser();
        $code = $this->startAndGetCode();

        // Measured, not imagined: the real profile came back as "TP-F0ZIVN\r".
        $this->fakeProfile($code."\r");

        $this->postJson('/api/v1/connected-accounts/xbox/verify/confirm')->assertOk();
    }

    public function test_an_empty_bio_is_refused(): void
    {
        $this->linkedUser();
        $this->startAndGetCode();
        $this->fakeProfile('');

        $this->postJson('/api/v1/connected-accounts/xbox/verify/confirm')->assertStatus(422);
    }

    public function test_somebody_elses_code_does_not_verify_this_account(): void
    {
        $this->linkedUser();
        $this->startAndGetCode();
        $this->fakeProfile('TP-NOTMINE');

        $this->postJson('/api/v1/connected-accounts/xbox/verify/confirm')->assertStatus(422);
    }

    public function test_an_unreachable_xbox_is_not_reported_as_a_missing_code(): void
    {
        $this->linkedUser();
        $this->startAndGetCode();

        Http::fake(['*xbl.io*' => Http::response([], 500)]);

        // 503, not 422: the reader editing their bio again cannot help, and
        // telling them the code is missing sends them to do exactly that.
        $this->postJson('/api/v1/connected-accounts/xbox/verify/confirm')->assertStatus(503);
    }
}
