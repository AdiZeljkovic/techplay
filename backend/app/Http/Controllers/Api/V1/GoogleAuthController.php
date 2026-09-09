<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;

/**
 * Sign in with Google.
 *
 * Its own controller rather than another branch inside SocialAuthController:
 * that one carries the Discord guild join, the Discord token store and a
 * "verified" check written around Discord's own quirks, and none of it means
 * anything here. What is carried over is the part that was paid for in bugs.
 *
 * Two lessons, both from the Discord flow, both of which apply unchanged.
 *
 * A member who presses Connect while signed in must be identified by proof,
 * not by address. On 30 August 2026 a member with 1,895 XP connected Discord,
 * his Discord address was not the address on his account — most people's are
 * not — and the callback made him a second, empty account and signed him into
 * it. So the browser carries a nonce that says who asked, and the callback
 * links to that member and nobody else.
 *
 * And an address matching an existing account is not proof of owning it. That
 * used to link and hand back a full token on the match alone, which meant
 * anyone who could put a victim's address on a social account could walk into
 * the victim's TechPlay account. Both sides have to have proved the same
 * mailbox before the identities are joined.
 *
 * One thing is genuinely different from Discord, and better: Google says
 * whether it verified the address, and it is telling the truth about its own
 * users. Discord hands out addresses nobody proved they control.
 */
class GoogleAuthController extends Controller
{
    use ApiResponse;

    /** How long a half-finished link stays valid. */
    private const LINK_TTL = 600;

    /** One namespace, so a stray cache key cannot be mistaken for an intent. */
    private function linkKey(string $nonce): string
    {
        return 'google:link-intent:'.$nonce;
    }

    /**
     * POST /auth/google/link-intent — "this is me, about to connect Google".
     *
     * Requires a token, which means the caller has already proved who they
     * are. The nonce it hands back is what the callback trusts instead of
     * guessing from an email address.
     */
    public function linkIntent(Request $request): JsonResponse
    {
        $nonce = Str::random(40);

        Cache::put($this->linkKey($nonce), $request->user()->id, self::LINK_TTL);

        return $this->success(['state' => $nonce]);
    }

    /**
     * GET /auth/google/redirect
     *
     * An actual redirect, not JSON: the frontend navigates the browser here,
     * so a JSON body would land the reader on a page of raw JSON instead of
     * Google.
     */
    public function redirect(Request $request)
    {
        $driver = Socialite::driver('google')
            ->stateless()
            ->scopes(['openid', 'profile', 'email']);

        $state = (string) $request->query('state', '');

        if ($state !== '') {
            // Socialite adds no state of its own in stateless mode, and with()
            // merges over the code fields, so this is the whole mechanism.
            $driver->with(['state' => $state]);
        }

        return $driver->redirect();
    }

    public function callback(Request $request)
    {
        try {
            $googleUser = Socialite::driver('google')->stateless()->user();
        } catch (\Throwable $e) {
            Log::channel('connections')->error('Google OAuth failed: '.$e->getMessage());

            return $this->toFrontend('/login', ['error' => 'Google sign-in failed. Please try again.']);
        }

        /*
         * A member who was signed in and pressed Connect.
         *
         * First, on purpose. Everything below identifies people by address,
         * and this is the one case where the address is the wrong question.
         */
        $linkedUserId = Cache::pull($this->linkKey((string) $request->query('state', '')));

        if ($linkedUserId && ($linker = User::find($linkedUserId))) {
            return $this->linkToSignedInMember($linker, $googleUser);
        }

        // Signing in again with a Google account we already know.
        $existing = User::where('google_id', $googleUser->getId())->first();

        if ($existing) {
            $existing->forceFill(['google_avatar' => $googleUser->getAvatar()])->save();

            /*
             * Google proved the address, so it can prove ours.
             *
             * Somebody who registered with a password, never opened the
             * verification mail, and now signs in with the same Google account
             * has demonstrated the mailbox. Making them chase the email again
             * would be asking for proof we already have.
             */
            if (! $existing->email_verified_at && $this->addressIsVerified($googleUser)) {
                $existing->forceFill(['email_verified_at' => now()])->save();
            }

            return $this->signIn($existing);
        }

        // Everything below creates or claims an account from an address.
        if (! $googleUser->getEmail()) {
            return $this->toFrontend('/login', [
                'error' => 'Google did not share an email address. Try signing in with your password.',
            ]);
        }

        if (! $this->addressIsVerified($googleUser)) {
            return $this->toFrontend('/login', [
                'error' => 'That Google address is not verified. Verify it with Google first, then try again.',
            ]);
        }

        $onThatAddress = User::where('email', $googleUser->getEmail())->first();

        if ($onThatAddress) {
            return $this->claimExistingAccount($onThatAddress, $googleUser);
        }

        return $this->createAccount($googleUser);
    }

    /** The Connect button in Settings, where we already know who is asking. */
    private function linkToSignedInMember(User $linker, $googleUser)
    {
        $takenBy = User::where('google_id', $googleUser->getId())
            ->where('id', '!=', $linker->id)
            ->first();

        if ($takenBy) {
            Log::channel('connections')->warning('Google link refused: already on another account', [
                'held_by' => $takenBy->id,
                'requested_by' => $linker->id,
            ]);

            return $this->toFrontend('/settings', [
                'error' => 'That Google account is already connected to another TechPlay account.',
            ]);
        }

        $linker->forceFill([
            'google_id' => $googleUser->getId(),
            'google_avatar' => $googleUser->getAvatar(),
        ])->save();

        Log::channel('connections')->info('Google linked to the account that asked', ['user_id' => $linker->id]);

        // No new token: they were already signed in, and handing back a fresh
        // one would replace the session they started this from.
        return $this->toFrontend('/settings', ['google' => 'linked']);
    }

    /**
     * A stranger signs in with Google, and we already hold their address.
     *
     * Only joined when the local account has proved the same mailbox. Without
     * that rule, an account somebody else created with your address — and
     * never verified — becomes the account you are signed into, along with
     * whatever its creator left in it and the password they still know.
     */
    private function claimExistingAccount(User $user, $googleUser)
    {
        if (! $user->hasVerifiedEmail()) {
            Log::channel('connections')->warning('Google link refused: local account unverified', [
                'user_id' => $user->id,
            ]);

            return $this->toFrontend('/login', [
                'error' => 'An account already uses that address. Sign in with your password and connect Google from Settings.',
            ]);
        }

        $user->forceFill([
            'google_id' => $googleUser->getId(),
            'google_avatar' => $googleUser->getAvatar(),
        ])->save();

        return $this->signIn($user);
    }

    private function createAccount($googleUser)
    {
        $user = User::create([
            'name' => $googleUser->getName() ?: $googleUser->getNickname(),
            'username' => $this->uniqueUsername($googleUser->getNickname() ?: $googleUser->getName()),
            'email' => $googleUser->getEmail(),
            // Never used to sign in — the account has no password anybody
            // knows, which is the point of arriving this way.
            'password' => bcrypt(Str::random(32)),
            'google_id' => $googleUser->getId(),
            'google_avatar' => $googleUser->getAvatar(),
        ]);

        /*
         * Marked verified after the create, not inside it.
         *
         * `email_verified_at` is deliberately not mass assignable — it is the
         * flag that decides whether an address has been proved, and a request
         * body must never be able to set it. Passing it to `create()` does not
         * fail, it is silently dropped, so the account comes out unverified
         * while the line above it says otherwise. The test that caught this
         * asserts the column, not the intent.
         */
        $user->forceFill(['email_verified_at' => now()])->save();

        Log::channel('connections')->info('Account created from Google', ['user_id' => $user->id]);

        return $this->signIn($user);
    }

    private function signIn(User $user)
    {
        return $this->toFrontend('/auth/callback', [
            'token' => $user->createToken('auth_token')->plainTextToken,
        ]);
    }

    /**
     * Did Google say the owner confirmed this address?
     *
     * Socialite exposes the raw claim, and `email_verified` is the one that
     * matters: Google will hand back an address on an account that has not
     * confirmed it, and an unconfirmed address is not identity.
     */
    private function addressIsVerified($googleUser): bool
    {
        $raw = $googleUser->user ?? [];

        return ($raw['email_verified'] ?? $raw['verified_email'] ?? false) === true;
    }

    private function uniqueUsername(?string $preferred): string
    {
        $base = strtolower(preg_replace('/[^a-zA-Z0-9_]/', '', (string) $preferred));
        $base = substr($base, 0, 20) ?: 'player';

        if (! User::byUsername($base)->exists()) {
            return $base;
        }

        for ($attempt = 0; $attempt < 50; $attempt++) {
            $candidate = $base.random_int(1000, 999999);

            if (! User::byUsername($candidate)->exists()) {
                return $candidate;
            }
        }

        return $base.Str::lower(Str::random(8));
    }

    /** Back to the site, with one parameter, escaped. */
    private function toFrontend(string $path, array $query)
    {
        return redirect(config('app.frontend_url').$path.'?'.http_build_query($query));
    }
}
