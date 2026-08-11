<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\SupportTier;
use App\Models\UserSupport;
use App\Services\PayPalService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

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
    public function pledge(Request $request, PayPalService $paypal)
    {
        $validated = $request->validate([
            'tier_id' => 'required|exists:support_tiers,id',
            'subscriptionID' => 'nullable|string',
            'orderID' => 'nullable|string',
        ]);

        if (empty($validated['subscriptionID']) && empty($validated['orderID'])) {
            return response()->json(['message' => 'No payment reference supplied.'], 422);
        }

        $tier = SupportTier::findOrFail($validated['tier_id']);
        $user = Auth::user();

        // Everything below used to be taken on trust: any authenticated user
        // could POST an arbitrary string and be granted a paid tier. The
        // reference is now read back from PayPal before anything is granted.
        $recurring = ! empty($validated['subscriptionID']);
        $paymentId = $validated['subscriptionID'] ?? $validated['orderID'];

        // A completed PayPal reference buys exactly one support period. Without
        // this, keeping the orderID from a single cheapest-tier purchase and
        // re-posting it every month renewed the tier for free — and a second
        // account posting the same reference was granted it too.
        $spentElsewhere = UserSupport::where('payment_id', $paymentId)
            ->where('user_id', '!=', $user->id)
            ->exists();

        if ($spentElsewhere) {
            Log::warning('Pledge refused: payment already claimed', [
                'user_id' => $user->id, 'payment_id' => $paymentId,
            ]);

            return response()->json(['message' => 'That payment has already been claimed.'], 409);
        }

        // A one-off pass is spent once. Re-posting it would otherwise walk
        // expires_at forward another month each time. Recurring subscriptions
        // are exempt — renewing against the same subscription id is the point.
        if (! $recurring && UserSupport::where('payment_id', $paymentId)->where('user_id', $user->id)->exists()) {
            return response()->json(['message' => 'That payment has already been claimed.'], 409);
        }

        if ($recurring) {
            $subscription = $paypal->getSubscription($paymentId);
            $status = $subscription['status'] ?? null;

            if (! in_array($status, ['ACTIVE', 'APPROVED'], true)) {
                Log::warning('Pledge refused: subscription not active', [
                    'user_id' => $user->id, 'subscription' => $paymentId, 'status' => $status,
                ]);

                return response()->json(['message' => 'We could not verify that subscription with PayPal.'], 422);
            }

            $expiresAt = now()->addMonth();
        } else {
            // A one-off pass: capture it now. The client used to approve the
            // order and never capture, so the money was authorised, never
            // taken, and the supporter was told the payment failed.
            $order = $paypal->getOrder($paymentId);
            $status = $order['status'] ?? null;

            if ($status === 'APPROVED') {
                try {
                    $order = $paypal->captureOrder($paymentId);
                    $status = $order['status'] ?? null;
                } catch (\Throwable $e) {
                    Log::error('Support capture failed: '.$e->getMessage(), ['order' => $paymentId]);

                    return response()->json(['message' => 'We could not take that payment. Nothing was charged.'], 422);
                }
            }

            if ($status !== 'COMPLETED') {
                return response()->json(['message' => 'We could not verify that payment with PayPal.'], 422);
            }

            // The browser proposes the amount, so confirm what was actually
            // taken matches the tier. A cent of tolerance covers rounding.
            $paid = (float) ($order['purchase_units'][0]['payments']['captures'][0]['amount']['value']
                ?? $order['purchase_units'][0]['amount']['value'] ?? 0);

            if (abs($paid - (float) $tier->price) > 0.01) {
                Log::warning('Pledge amount mismatch', [
                    'user_id' => $user->id, 'tier' => $tier->id, 'expected' => $tier->price, 'paid' => $paid,
                ]);

                return response()->json(['message' => 'That payment does not match the tier price.'], 422);
            }

            $expiresAt = now()->addMonth();
        }

        // A second pledge used to create a second row and overwrite the stored
        // subscription id, orphaning the first one — which kept billing with
        // nothing left pointing at it.
        $existing = UserSupport::where('user_id', $user->id)
            ->where('status', 'active')
            ->where('payment_id', '!=', $paymentId)
            ->latest('id')
            ->first();

        if ($existing) {
            $existing->update(['status' => 'superseded']);
            Log::info('Support superseded', [
                'user_id' => $user->id, 'old_payment' => $existing->payment_id, 'new_payment' => $paymentId,
            ]);
        }

        $support = UserSupport::updateOrCreate(
            ['user_id' => $user->id, 'payment_id' => $paymentId],
            [
                'support_tier_id' => $tier->id,
                'amount' => $tier->price,
                'status' => 'active',
                'expires_at' => $expiresAt,
                'is_recurring' => $recurring,
            ]
        );

        $user->update([
            'paypal_subscription_id' => $recurring ? $paymentId : $user->paypal_subscription_id,
            'subscription_ends_at' => $expiresAt,
        ]);

        return response()->json([
            'message' => 'Thank you for your support!',
            'data' => $support,
            'tier' => $tier,
            'superseded' => (bool) $existing,
        ], 201);
    }

    /** What the signed-in reader is already supporting, so the page can say so. */
    public function mySupport(Request $request)
    {
        $support = UserSupport::with('tier')
            ->where('user_id', $request->user()->id)
            ->where('status', 'active')
            ->latest('id')
            ->first();

        return response()->json(['data' => $support]);
    }
}
