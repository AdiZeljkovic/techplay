<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Traits\ApiResponse;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password as PasswordRule;

/**
 * Forgotten passwords.
 *
 * This did not exist. The login page has always linked to /forgot-password —
 * a page that was never built — and there was no endpoint behind it either, so
 * anyone who forgot their password was locked out of their account for good.
 *
 * It bites hardest for accounts created through Discord: those were given a
 * random 16-character password nobody ever saw, and changePassword requires the
 * current one, so a Discord signup could never obtain a password by any route.
 * With the Discord driver currently unregistered, those accounts have no way in
 * at all.
 *
 * The table (`password_reset_tokens`) and the trait (CanResetPassword, via
 * Illuminate\Foundation\Auth\User) were both already there. Only this was
 * missing.
 */
class PasswordResetController extends Controller
{
    use ApiResponse;

    /**
     * POST /auth/forgot-password
     *
     * Always answers the same way. Whether an address has an account is not
     * something a stranger gets to learn by asking.
     */
    public function sendLink(Request $request): JsonResponse
    {
        $request->validate(['email' => 'required|email']);

        $status = Password::sendResetLink($request->only('email'));

        if ($status !== Password::RESET_LINK_SENT) {
            // Logged, not returned: a throttled or unknown address must look
            // exactly like a successful one from the outside.
            Log::info('Password reset link not sent', ['status' => $status]);
        }

        return $this->success(null, 'If that address has an account, a reset link is on its way.');
    }

    /**
     * POST /auth/reset-password
     */
    public function reset(Request $request): JsonResponse
    {
        $request->validate([
            'token' => 'required|string',
            'email' => 'required|email',
            'password' => ['required', 'confirmed', PasswordRule::min(8)->letters()->numbers()->symbols()],
        ]);

        $status = Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function (User $user, string $password) {
                $user->forceFill([
                    'password' => $password, // the model's 'hashed' cast does the work
                    'remember_token' => Str::random(60),
                ])->save();

                // Whoever held a token before this moment loses it. A reset is
                // how someone recovers an account they may have lost control
                // of, so leaving old sessions alive would defeat the point.
                $user->tokens()->delete();

                // Someone proving they control the address also verifies it —
                // and a still-unverified account would otherwise be refused at
                // login immediately after a successful reset.
                if (! $user->hasVerifiedEmail()) {
                    $user->markEmailAsVerified();
                }

                event(new PasswordReset($user));
            }
        );

        if ($status !== Password::PASSWORD_RESET) {
            return $this->error('That reset link is invalid or has expired.', 422);
        }

        return $this->success(null, 'Your password has been reset. You can sign in now.');
    }
}
