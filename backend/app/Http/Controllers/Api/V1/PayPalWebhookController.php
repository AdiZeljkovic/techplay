<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\User;
use App\Models\UserSupport;
use App\Services\AchievementService;
use App\Services\PayPalService;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * PayPal Webhook Handler with Signature Verification
 *
 * SECURITY: Verifies webhook authenticity using PayPal's signature mechanism
 * Prevents fraudulent payment confirmations and subscription manipulations
 *
 * Setup Required:
 * 1. Add to .env:
 *    PAYPAL_WEBHOOK_ID=your_webhook_id_from_paypal_dashboard
 * 2. Configure webhook URL in PayPal Dashboard:
 *    https://your-domain.com/api/v1/webhooks/paypal
 * 3. Subscribe to events: PAYMENT.SALE.COMPLETED, BILLING.SUBSCRIPTION.*, etc.
 */
class PayPalWebhookController extends Controller
{
    /**
     * Handle incoming PayPal webhook
     *
     * IMPORTANT: This endpoint must be EXEMPT from CSRF verification
     * Add to VerifyCsrfToken middleware exceptions: 'api/v1/webhooks/paypal'
     */
    public function handleWebhook(Request $request)
    {
        // 1. Verify webhook signature
        if (! $this->verifyWebhookSignature($request)) {
            Log::warning('PayPal webhook signature verification failed', [
                'ip' => $request->ip(),
                'headers' => $request->headers->all(),
            ]);

            return response()->json(['error' => 'Invalid signature'], 401);
        }

        // 2. Parse webhook data
        $eventType = $request->input('event_type');
        $resource = $request->input('resource');

        // 2a. Once only.
        //
        // PayPal redelivers an event until it gets a 2xx, and this handler
        // answers 500 on any exception — so retries are the normal path, not an
        // edge case. Most of what follows is idempotent by luck rather than by
        // design, and the subscription branch was not: each redelivery moved the
        // paid-through date again. `Cache::add` is atomic, so two workers racing
        // the same redelivery cannot both win it. A day covers PayPal's retry
        // window several times over.
        $eventId = $request->input('id');

        if ($eventId && ! Cache::add("paypal:event:{$eventId}", true, now()->addDay())) {
            Log::info('PayPal webhook already handled, skipping', [
                'event_id' => $eventId,
                'event_type' => $eventType,
            ]);

            return response()->json(['status' => 'duplicate'], 200);
        }

        Log::info('PayPal webhook received', [
            'event_type' => $eventType,
            'resource_id' => $resource['id'] ?? null,
        ]);

        // 3. Handle different event types
        try {
            match ($eventType) {
                'PAYMENT.SALE.COMPLETED' => $this->handlePaymentCompleted($resource),
                'PAYMENT.SALE.REFUNDED' => $this->handlePaymentRefunded($resource),
                'BILLING.SUBSCRIPTION.CREATED' => $this->handleSubscriptionCreated($resource),
                'BILLING.SUBSCRIPTION.ACTIVATED' => $this->handleSubscriptionActivated($resource),
                'BILLING.SUBSCRIPTION.CANCELLED' => $this->handleSubscriptionCancelled($resource),
                'BILLING.SUBSCRIPTION.EXPIRED' => $this->handleSubscriptionExpired($resource),
                'BILLING.SUBSCRIPTION.SUSPENDED' => $this->handleSubscriptionSuspended($resource),
                default => Log::info('Unhandled PayPal webhook event', ['type' => $eventType]),
            };

            return response()->json(['status' => 'success'], 200);

        } catch (\Exception $e) {
            // Hand the claim back. A 500 asks PayPal to redeliver, and a
            // redelivery that finds the event already marked handled would be
            // dropped — the failure would be permanent and silent.
            if ($eventId) {
                Cache::forget("paypal:event:{$eventId}");
            }

            Log::error('PayPal webhook processing error', [
                'event_type' => $eventType,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json(['error' => 'Processing failed'], 500);
        }
    }

    /**
     * Verify PayPal webhook signature
     *
     * SECURITY: Validates that webhook actually came from PayPal
     * Uses PAYPAL-TRANSMISSION-* headers to verify authenticity
     */
    private function verifyWebhookSignature(Request $request): bool
    {
        $webhookId = config('paypal.webhook_id');

        // If webhook ID not configured, skip verification in dev (UNSAFE in production!)
        if (empty($webhookId)) {
            Log::warning('PayPal webhook ID not configured - signature verification skipped');

            return config('app.env') === 'local'; // Only allow in local dev
        }

        // Get PayPal headers
        $transmissionId = $request->header('PAYPAL-TRANSMISSION-ID');
        $transmissionTime = $request->header('PAYPAL-TRANSMISSION-TIME');
        $transmissionSig = $request->header('PAYPAL-TRANSMISSION-SIG');
        $certUrl = $request->header('PAYPAL-CERT-URL');
        $authAlgo = $request->header('PAYPAL-AUTH-ALGO');

        if (! $transmissionId || ! $transmissionTime || ! $transmissionSig) {
            return false;
        }

        // Get raw body
        $body = $request->getContent();

        // TODO: Full implementation requires PayPal SDK
        // For now, we verify using PayPal's webhook verification API
        //
        // IMPLEMENTATION NOTE:
        // Use PayPal REST API POST /v1/notifications/verify-webhook-signature
        // Request body:
        // {
        //   "auth_algo": $authAlgo,
        //   "cert_url": $certUrl,
        //   "transmission_id": $transmissionId,
        //   "transmission_sig": $transmissionSig,
        //   "transmission_time": $transmissionTime,
        //   "webhook_id": $webhookId,
        //   "webhook_event": $body (parsed as JSON)
        // }
        //
        // Response: { "verification_status": "SUCCESS" | "FAILURE" }

        // Placeholder: Call PayPal verification API
        $verificationResult = $this->callPayPalVerificationAPI([
            'auth_algo' => $authAlgo,
            'cert_url' => $certUrl,
            'transmission_id' => $transmissionId,
            'transmission_sig' => $transmissionSig,
            'transmission_time' => $transmissionTime,
            'webhook_id' => $webhookId,
            'webhook_event' => json_decode($body, true),
        ]);

        return $verificationResult === 'SUCCESS';
    }

    /**
     * Call PayPal webhook verification API
     *
     * SECURITY: Server-side verification prevents replay attacks
     */
    private function callPayPalVerificationAPI(array $data): string
    {
        try {
            // Get PayPal access token
            $accessToken = app(PayPalService::class)->getAccessToken();

            $baseUrl = config('paypal.mode') === 'live'
                ? 'https://api.paypal.com'
                : 'https://api.sandbox.paypal.com';

            $response = Http::withToken($accessToken)
                ->post($baseUrl.'/v1/notifications/verify-webhook-signature', $data);

            if ($response->successful()) {
                $result = $response->json();

                return $result['verification_status'] ?? 'FAILURE';
            }

            Log::error('PayPal webhook verification API failed', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            return 'FAILURE';

        } catch (\Exception $e) {
            Log::error('PayPal webhook verification exception', [
                'error' => $e->getMessage(),
            ]);

            return 'FAILURE';
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // EVENT HANDLERS
    // ═══════════════════════════════════════════════════════════════

    private function handlePaymentCompleted(array $resource): void
    {
        $orderId = $resource['custom_id'] ?? null; // Your internal order ID
        $paypalTransactionId = $resource['id'] ?? null;

        if (! $orderId) {
            // A subscription renewal arrives as PAYMENT.SALE.COMPLETED too, and
            // carries no custom_id — it points at the agreement instead. This
            // branch used to log a warning and stop, which meant the very event
            // that says "they paid again" was the one that extended nothing:
            // subscription_ends_at was written once at activation and never
            // moved, so a paying subscriber's access lapsed after a month while
            // PayPal kept charging.
            if ($agreementId = $resource['billing_agreement_id'] ?? null) {
                $this->extendSubscription($agreementId, $resource, 'renewal');

                return;
            }

            Log::warning('Payment completed but no custom_id found', ['resource' => $resource]);

            return;
        }

        $order = Order::find($orderId);
        if (! $order) {
            Log::error('Order not found for completed payment', ['order_id' => $orderId]);

            return;
        }

        $order->update([
            // Lowercase, matching every other writer of this column and the
            // values the admin panel offers.
            'status' => 'completed',
            'paypal_transaction_id' => $paypalTransactionId,
        ]);

        // Same grant as the inline capture path — a payment that lands by
        // webhook is still a purchase.
        if ($order->user_id) {
            try {
                app(AchievementService::class)->check($order->user, ['orders_count']);
            } catch (\Throwable) {
            }
        }

        Log::info('Payment completed via webhook', ['order_id' => $orderId]);
    }

    private function handlePaymentRefunded(array $resource): void
    {
        $paypalTransactionId = $resource['sale_id'] ?? null;

        $order = Order::where('paypal_transaction_id', $paypalTransactionId)->first();
        if (! $order) {
            Log::error('Order not found for refund', ['transaction_id' => $paypalTransactionId]);

            return;
        }

        $order->update(['status' => 'refunded']);
        Log::info('Payment refunded via webhook', ['order_id' => $order->id]);
    }

    private function handleSubscriptionCreated(array $resource): void
    {
        Log::info('Subscription created', ['subscription_id' => $resource['id'] ?? null]);
    }

    private function handleSubscriptionActivated(array $resource): void
    {
        $this->extendSubscription($resource['id'] ?? null, $resource, 'activation');
    }

    /**
     * Move a subscriber's paid-through date forward.
     *
     * The date comes from PayPal (`billing_info.next_billing_time`) rather than
     * from `now()->addMonth()`, which is what stood here under a comment saying
     * it should be parsed from the resource. A yearly plan was being granted a
     * month, and every redelivery of the same event re-stamped the date — PayPal
     * retries on any non-2xx, so that was not hypothetical.
     *
     * Never shortens: two events can arrive out of order, and the later-dated
     * one is the one the subscriber paid for.
     */
    private function extendSubscription(?string $subscriptionId, array $resource, string $reason): void
    {
        if (! $subscriptionId) {
            return;
        }

        $user = User::where('paypal_subscription_id', $subscriptionId)->first();
        if (! $user) {
            Log::error('User not found for subscription event', [
                'subscription_id' => $subscriptionId,
                'reason' => $reason,
            ]);

            return;
        }

        $paidThrough = $this->nextBillingTime($resource) ?? now()->addMonth();

        if ($user->subscription_ends_at && $user->subscription_ends_at->greaterThan($paidThrough)) {
            $paidThrough = $user->subscription_ends_at;
        }

        $user->update(['subscription_ends_at' => $paidThrough]);

        UserSupport::where('user_id', $user->id)
            ->where('status', 'active')
            ->update(['expires_at' => $paidThrough]);

        Log::info('Subscription period extended', [
            'user_id' => $user->id,
            'reason' => $reason,
            'paid_through' => $paidThrough->toIso8601String(),
        ]);
    }

    /** PayPal's own next charge date, when it sends one. */
    private function nextBillingTime(array $resource): ?Carbon
    {
        $raw = $resource['billing_info']['next_billing_time'] ?? null;

        if (! $raw) {
            return null;
        }

        try {
            return Carbon::parse($raw);
        } catch (\Throwable) {
            return null;
        }
    }

    /**
     * Cancelled means "will not renew" — not "is over now".
     *
     * This used to null both the agreement id and the paid-through date, which
     * took away the rest of a period the subscriber had already paid for, and
     * left the later EXPIRED event with no user to find. Now the date stands
     * and runs out on its own; only the renewal is stopped.
     */
    private function handleSubscriptionCancelled(array $resource): void
    {
        $subscriptionId = $resource['id'] ?? null;

        $user = User::where('paypal_subscription_id', $subscriptionId)->first();
        if (! $user) {
            Log::error('User not found for subscription cancellation', ['subscription_id' => $subscriptionId]);

            return;
        }

        UserSupport::where('user_id', $user->id)
            ->where('status', 'active')
            ->update(['is_recurring' => false]);

        Log::info('Subscription will not renew', [
            'user_id' => $user->id,
            'runs_until' => $user->subscription_ends_at?->toIso8601String(),
        ]);
    }

    /** Expired is the one that actually ends it: the paid term is over. */
    private function handleSubscriptionExpired(array $resource): void
    {
        $subscriptionId = $resource['id'] ?? null;

        $user = User::where('paypal_subscription_id', $subscriptionId)->first();
        if (! $user) {
            return;
        }

        $user->update([
            'paypal_subscription_id' => null,
            'subscription_ends_at' => null,
        ]);

        UserSupport::where('user_id', $user->id)
            ->where('status', 'active')
            ->update(['status' => 'expired', 'is_recurring' => false]);

        Log::info('Subscription expired', ['user_id' => $user->id]);
    }

    private function handleSubscriptionSuspended(array $resource): void
    {
        $subscriptionId = $resource['id'] ?? null;

        $user = User::where('paypal_subscription_id', $subscriptionId)->first();
        if (! $user) {
            return;
        }

        // Mark as suspended but keep subscription ID for potential reactivation
        Log::warning('Subscription suspended via webhook', ['user_id' => $user->id]);
    }
}
