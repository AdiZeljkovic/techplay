<?php

namespace Tests\Feature;

use App\Models\User;
use App\Services\EpicService;
use App\Services\GogService;
use App\Services\OpenXblService;
use App\Services\PlayStationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

/**
 * Linking a PlayStation account has to finish before Octane kills the worker.
 *
 * On 2 September a reader met one 422 and then seven 502s. The 502s had no
 * body: three calls to Sony budgeted at fifteen, fifteen and twenty seconds
 * could run for fifty, and the worker is terminated at thirty
 * (`config('octane.max_execution_time', 30)` — nothing sets that key, so it is
 * Octane's own default). A terminated worker writes no response, so our real
 * explanation never reached him and the browser fell back to "can't connect".
 *
 * He worked it out himself: Playnite was signed in to his PlayStation account
 * and rotating the token underneath him. That answer is now on the help page
 * and in the 422 — neither of which is any use if the request dies first.
 *
 * Reading the other three afterwards, all of them were worse, because
 * `retry(2, …)` is three attempts rather than two: Epic 63 seconds, GOG 78,
 * Xbox 94. None of them had produced a complaint yet, which only means nobody
 * had linked one on a slow day.
 */
class ConnectingFitsInsideTheRequestTest extends TestCase
{
    use RefreshDatabase;

    /** The ceiling, read the same way the Octane command reads it. */
    private function ceiling(): int
    {
        return (int) config('octane.max_execution_time', 30);
    }

    /**
     * Worst case per provider, counting every call a connect request makes.
     *
     * @return array<string, int>
     */
    public static function budgets(): array
    {
        return [
            // authorize + token exchange + profile read
            'playstation' => [(PlayStationService::CONNECT_TIMEOUT * 2) + PlayStationService::CONNECT_PROFILE_TIMEOUT],
            // one token exchange, one attempt
            'epic' => [EpicService::CONNECT_TIMEOUT],
            // token exchange, then the name lookup
            'gog' => [GogService::CONNECT_TIMEOUT + GogService::CONNECT_NAME_TIMEOUT],
            // one gamertag lookup
            'xbox' => [OpenXblService::CONNECT_TIMEOUT],
        ];
    }

    #[DataProvider('budgets')]
    public function test_the_whole_connect_flow_can_time_out_and_still_answer(int $worstCase): void
    {
        // Not merely under the ceiling — under it with room to spare. Landing on
        // 29 would mean every slow attempt races the killer, and the whole point
        // is to fail with a sentence rather than die without one.
        $this->assertLessThanOrEqual(
            $this->ceiling() - 5,
            $worstCase,
            'A worst case of '.$worstCase.'s leaves too little of the '
                .$this->ceiling().'s request for us to write an answer in.'
        );
    }

    /**
     * `retry(2, …)` is three attempts, and that is how these got so large.
     *
     * The connect paths ask for one. Retrying a single-use code that the store
     * has already refused cannot succeed — it only spends the request's budget
     * on a foregone conclusion.
     */
    public function test_the_connect_paths_do_not_retry_a_single_use_code(): void
    {
        foreach (['EpicService', 'GogService'] as $service) {
            $source = file_get_contents(app_path("Services/{$service}.php"));

            $this->assertStringContainsString(
                'attempts: 1',
                $source,
                "{$service}::exchangeCode should make one attempt, not three."
            );
        }
    }

    /**
     * The queue keeps the longer budget, and should.
     *
     * A library sync has no thirty-second ceiling over it, so shortening its
     * timeouts to match the connect flow would only make syncs fail on slow
     * days for no gain.
     */
    public function test_the_sync_path_is_not_dragged_down_with_it(): void
    {
        $source = file_get_contents(app_path('Services/PlayStationService.php'));

        $this->assertStringContainsString('int $timeout = 20', $source);
    }

    /** A refused token is answered, not swallowed — and the answer names both causes. */
    public function test_a_refused_token_comes_back_with_a_reason(): void
    {
        // The linking switch, which is off in the test environment.
        config()->set('services.psn.enabled', true);

        $user = User::factory()->create();

        Http::fake([
            'ca.account.sony.com/*' => Http::response('', 400),
        ]);

        $response = $this->actingAs($user)
            ->postJson('/api/v1/connected-accounts/playstation/connect', ['npsso' => str_repeat('a', 64)]);

        $response->assertStatus(422);

        $message = $response->json('message');

        $this->assertNotEmpty($message);
        // The cause we can stand behind: the token's short life. It is the
        // reason we can name without guessing, so it is the one stated.
        $this->assertStringContainsStringIgnoringCase('expires', $message);
    }
}
