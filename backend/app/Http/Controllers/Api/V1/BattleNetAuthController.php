<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\WowCharacter;
use App\Services\BlizzardService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;

class BattleNetAuthController extends Controller
{
    /**
     * Redirect to Battle.net OAuth
     */
    public function redirect(Request $request)
    {
        $region = $request->get('region', 'us'); // Allow frontend to specify region
        session(['battlenet_region' => $region]); // Store in session for token exchange

        return Socialite::driver('battlenet')->stateless()->redirect();
    }

    /**
     * Handle Battle.net OAuth callback
     */
    public function callback(Request $request, BlizzardService $blizzardService)
    {
        try {
            $battlenetUser = Socialite::driver('battlenet')->stateless()->user();
            $region = session('battlenet_region', 'us');

            // Scenario 1: Existing user with battlenet_id (returning user)
            $user = User::where('battlenet_id', $battlenetUser->id)->first();

            if (! $user) {
                // Scenario 2: Existing email but no Battle.net (link to existing account)
                // Note: Battle.net doesn't provide email via userinfo, so this won't happen
                // unless we get email from a different source

                // Scenario 3: Brand new user - create account
                $user = User::create([
                    'name' => $battlenetUser->name ?? 'BattleNetUser', // "Garamel"
                    'username' => strtolower($battlenetUser->name ?? 'user').rand(1000, 9999),
                    'email' => $battlenetUser->battletag.'@battlenet.local', // Synthetic email
                    'email_verified_at' => now(), // Auto-verify
                    'password' => Hash::make(Str::random(32)), // Random password
                    'battlenet_id' => $battlenetUser->id,
                    'battlenet_token' => $battlenetUser->token,
                    'battlenet_refresh_token' => $battlenetUser->refreshToken,
                    'battlenet_region' => $region,
                    'battletag' => $battlenetUser->battletag,
                ]);
            } else {
                // Update tokens for existing user
                $user->update([
                    'battlenet_token' => $battlenetUser->token,
                    'battlenet_refresh_token' => $battlenetUser->refreshToken,
                ]);
            }

            // Fetch user's WoW characters from Battle.net API and auto-link
            $this->syncWowCharacters($user, $battlenetUser->token, $region, $blizzardService);

            // Issue Sanctum token
            $token = $user->createToken('battlenet_auth_token')->plainTextToken;

            // Redirect to frontend with token
            return redirect(config('app.frontend_url').'/auth/callback?token='.$token);

        } catch (\Exception $e) {
            Log::error('Battle.net OAuth failed: '.$e->getMessage());

            return redirect(config('app.frontend_url').'/login?error=oauth_failed');
        }
    }

    /**
     * Sync user's WoW characters from Battle.net API
     */
    protected function syncWowCharacters(User $user, string $oauthToken, string $region, BlizzardService $blizzardService)
    {
        try {
            // Call Blizzard API: GET /profile/user/wow (requires OAuth token, not client credentials)
            $response = Http::withToken($oauthToken)->get("https://{$region}.api.blizzard.com/profile/user/wow", [
                'namespace' => "profile-{$region}",
                'locale' => 'en_US',
            ]);

            if (! $response->successful()) {
                Log::warning('Failed to fetch WoW characters for user '.$user->id, [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);

                return;
            }

            $charactersData = $response->json();
            $wowAccounts = $charactersData['wow_accounts'] ?? [];

            foreach ($wowAccounts as $account) {
                foreach ($account['characters'] ?? [] as $char) {
                    // Extract character data
                    $realmSlug = $char['realm']['slug'] ?? 'unknown';
                    $characterName = $char['name'] ?? 'Unknown';
                    $level = $char['level'] ?? 80;
                    $faction = $char['faction']['type'] ?? 'UNKNOWN';
                    $characterClass = $char['playable_class']['name'] ?? null;

                    // Upsert character (create or update)
                    WowCharacter::updateOrCreate(
                        [
                            'user_id' => $user->id,
                            'character_name' => $characterName,
                            'realm_slug' => $realmSlug,
                            'region' => $region,
                        ],
                        [
                            'character_class' => $characterClass,
                            'faction' => strtolower($faction),
                            'level' => $level,
                            'is_main' => false, // User can set main later
                        ]
                    );
                }
            }

            Log::info('Successfully synced WoW characters for user '.$user->id, [
                'character_count' => $user->wowCharacters()->count(),
            ]);

        } catch (\Exception $e) {
            Log::error('WoW character sync failed: '.$e->getMessage(), [
                'user_id' => $user->id,
                'trace' => $e->getTraceAsString(),
            ]);
        }
    }
}
