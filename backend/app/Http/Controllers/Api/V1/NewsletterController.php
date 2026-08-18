<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Mail\NewsletterVerification;
use App\Models\MailSuppression;
use App\Models\NewsletterSubscriber;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class NewsletterController extends Controller
{
    public function subscribe(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|email',
        ]);

        $subscriber = NewsletterSubscriber::where('email', $validated['email'])->first();

        /*
         * "Already subscribed" has to mean *currently* subscribed.
         *
         * This used to check only `email_verified_at`, which survives an
         * unsubscribe — so anybody who left was told they were already on the
         * list every time they tried to come back, while receiving nothing. A
         * dead end with a reassuring message on it.
         */
        if ($subscriber && $subscriber->email_verified_at && ! $subscriber->unsubscribed_at) {
            return response()->json(['message' => 'You are already subscribed to the newsletter.'], 409);
        }

        if (! $subscriber) {
            $subscriber = new NewsletterSubscriber;
            $subscriber->email = $validated['email'];
        }

        /*
         * Somebody who unsubscribed and is now signing up again has changed
         * their mind, and that is allowed — but it has to be *them* doing it,
         * which a verification mail proves. The suppression is lifted only when
         * they confirm, in `verify()`, never on the form post alone.
         */
        $subscriber->is_active = true; // Subscribed but maybe not verified
        $subscriber->verification_token = Str::random(60);
        $subscriber->email_verified_at = null; // Reset verification requires new verification
        $subscriber->save();

        try {
            Mail::to($subscriber->email)->send(new NewsletterVerification($subscriber));
        } catch (\Exception $e) {
            Log::error('Newsletter email failed: '.$e->getMessage());
            // Continue even if email fails, or handle error?
        }

        // SECURITY: Do NOT return subscriber data - token must only be sent via email
        return response()->json([
            'message' => 'Please check your email to verify your subscription.',
        ], 200);
    }

    public function verify(Request $request)
    {
        $request->validate(['token' => 'required|string']);

        $subscriber = NewsletterSubscriber::where('verification_token', $request->token)->first();

        if (! $subscriber) {
            return response()->json(['message' => 'Invalid verification token.'], 404);
        }

        $subscriber->email_verified_at = now();
        $subscriber->verification_token = null; // Clear token
        $subscriber->unsubscribed_at = null;
        $subscriber->save();

        // They asked to come back, and proved the address is theirs.
        MailSuppression::where('email', $subscriber->email)
            ->where('reason', MailSuppression::UNSUBSCRIBED)
            ->delete();

        return response()->json(['message' => 'Email verified successfully!'], 200);
    }

    /**
     * Off the list, in one click, without logging in.
     *
     * There was no way off at all before this. Not a nicety: since February
     * 2024 Gmail and Yahoo require a one-click unsubscribe from anyone sending
     * in bulk, and the GDPR requires consent be as easy to withdraw as it was
     * to give.
     *
     * Two verbs on purpose:
     *
     * - **POST** is what a mail client calls by itself when the reader presses
     *   the unsubscribe button in Gmail's header. RFC 8058 requires it act
     *   immediately — no confirmation page, no login.
     * - **GET** is what a person clicks in the body of the mail. Same effect,
     *   then somewhere that says so.
     *
     * An unknown token is answered exactly like a known one. A token is a
     * secret, and "no such subscriber" would turn this into a way of asking
     * whether an address is on the list.
     */
    public function unsubscribe(Request $request, string $token)
    {
        $subscriber = NewsletterSubscriber::where('unsubscribe_token', $token)->first();

        $subscriber?->unsubscribe('newsletter');

        if ($request->isMethod('post')) {
            // RFC 8058: the mail client wants a bare acknowledgement.
            return response()->noContent();
        }

        return redirect()->away(
            rtrim((string) config('app.site_url'), '/').'/newsletter/unsubscribed'
        );
    }
}
