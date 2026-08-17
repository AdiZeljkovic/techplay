<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\AchievementService;
use Illuminate\Auth\Events\Verified;
use Illuminate\Http\Request;

class VerificationController extends Controller
{
    /**
     * Resend email verification link
     */
    public function resend(Request $request)
    {
        $user = $request->user();

        if ($user->hasVerifiedEmail()) {
            return response()->json(['message' => 'Email already verified'], 200);
        }

        $user->sendEmailVerificationNotification();

        return response()->json(['message' => 'Verification link sent']);
    }

    /**
     * Resend by email address, for someone who cannot be signed in yet: an
     * unverified account is issued no token, so the authenticated resend was
     * unreachable by exactly the people who needed it.
     *
     * Answers the same way whether or not the address exists, so the endpoint
     * cannot be used to discover who has an account here.
     */
    public function resendPublic(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|email',
        ]);

        $user = User::where('email', $validated['email'])->first();

        if ($user && ! $user->hasVerifiedEmail()) {
            $user->sendEmailVerificationNotification();
        }

        return response()->json([
            'message' => 'If that address needs verifying, a new link is on its way.',
        ]);
    }

    /**
     * Verify email from signed URL
     */
    public function verify(Request $request, $id, $hash)
    {
        // Laravel mails a signed, expiring URL — but nothing here ever checked
        // the signature, so the sha1 of an email address was the entire secret.
        // Anyone could register an address they do not own and then verify it,
        // permanently locking out the real owner.
        if (! $request->hasValidSignature()) {
            return response()->json(['message' => 'This verification link is invalid or has expired.'], 403);
        }

        $user = User::find($id);

        if (! $user || ! hash_equals((string) $hash, sha1($user->getEmailForVerification()))) {
            return response()->json(['message' => 'Invalid verification link'], 403);
        }

        if ($user->hasVerifiedEmail()) {
            return response()->json(['message' => 'Email already verified'], 200);
        }

        if ($user->markEmailAsVerified()) {
            event(new Verified($user));

            // "Verified Gamer" is counted off exactly this and nothing checked
            // it here, so the one achievement every account can earn on day one
            // waited for a nightly sweep.
            try {
                app(AchievementService::class)->check($user, ['email_verified']);
            } catch (\Throwable) {
            }
        }

        // Redirect to frontend verification page with query param
        $frontendUrl = config('app.site_url');

        return redirect()->away($frontendUrl.'/verify-email?verified=1');
    }

    /**
     * Check verification status
     */
    public function status(Request $request)
    {
        return response()->json([
            'verified' => $request->user()->hasVerifiedEmail(),
            'email' => $request->user()->email,
        ]);
    }
}
