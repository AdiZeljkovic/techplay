<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\NewsletterSubscriber;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use App\Mail\NewsletterVerification;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

class NewsletterController extends Controller
{
    public function subscribe(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|email',
        ]);

        $subscriber = NewsletterSubscriber::where('email', $validated['email'])->first();

        if ($subscriber && $subscriber->email_verified_at) {
            return response()->json(['message' => 'You are already subscribed to the newsletter.'], 409);
        }

        if (!$subscriber) {
            $subscriber = new NewsletterSubscriber();
            $subscriber->email = $validated['email'];
        }

        $subscriber->is_active = true; // Subscribed but maybe not verified
        $subscriber->verification_token = Str::random(60);
        $subscriber->email_verified_at = null; // Reset verification requires new verification
        $subscriber->save();

        try {
            Mail::to($subscriber->email)->send(new NewsletterVerification($subscriber));
        } catch (\Exception $e) {
            Log::error('Newsletter email failed: ' . $e->getMessage());
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

        if (!$subscriber) {
            return response()->json(['message' => 'Invalid verification token.'], 404);
        }

        $subscriber->email_verified_at = now();
        $subscriber->verification_token = null; // Clear token
        $subscriber->save();

        return response()->json(['message' => 'Email verified successfully!'], 200);
    }
}
