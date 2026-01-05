<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\SupportTier;
use App\Models\UserSupport;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class SupportController extends Controller
{
    public function index()
    {
        $tiers = SupportTier::where('is_active', true)->get();
        return response()->json($tiers);
    }

    /**
     * Handle successful pledge/subscription.
     */
    public function pledge(Request $request)
    {
        $validated = $request->validate([
            'tier_id' => 'required|exists:support_tiers,id',
            'subscriptionID' => 'required|string',
        ]);

        $tier = SupportTier::findOrFail($validated['tier_id']);
        $user = Auth::user();

        // Check if user already has active support?
        // Allow upgrading/downgrading logic? For now, just create record.

        $support = UserSupport::create([
            'user_id' => $user->id,
            'support_tier_id' => $tier->id,
            'amount' => $tier->price,
            'status' => 'active',
            'expires_at' => now()->addMonth(), // Assuming monthly mainly
            'payment_id' => $validated['subscriptionID'],
            'is_recurring' => true,
        ]);

        // Update User fields for backward compatibility/badge display
        $user->update([
            'paypal_subscription_id' => $validated['subscriptionID'],
            'subscription_ends_at' => now()->addMonth(),
        ]);

        return response()->json([
            'message' => 'Thank you for your support!',
            'data' => $support,
            'tier' => $tier
        ], 201);
    }
}
