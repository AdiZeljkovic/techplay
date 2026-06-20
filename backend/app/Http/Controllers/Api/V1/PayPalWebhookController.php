<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\User;
use App\Services\PayPalService;
use Illuminate\Http\Request;
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
            Log::warning('Payment completed but no custom_id found', ['resource' => $resource]);

            return;
        }

        $order = Order::find($orderId);
        if (! $order) {
            Log::error('Order not found for completed payment', ['order_id' => $orderId]);

            return;
        }

        $order->update([
            'status' => 'COMPLETED',
            'paypal_transaction_id' => $paypalTransactionId,
        ]);

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

        $order->update(['status' => 'REFUNDED']);
        Log::info('Payment refunded via webhook', ['order_id' => $order->id]);
    }

    private function handleSubscriptionCreated(array $resource): void
    {
        Log::info('Subscription created', ['subscription_id' => $resource['id'] ?? null]);
    }

    private function handleSubscriptionActivated(array $resource): void
    {
        $subscriptionId = $resource['id'] ?? null;

        $user = User::where('paypal_subscription_id', $subscriptionId)->first();
        if (! $user) {
            Log::error('User not found for subscription activation', ['subscription_id' => $subscriptionId]);

            return;
        }

        $user->update([
            'subscription_ends_at' => now()->addMonth(), // Should parse from resource
        ]);

        Log::info('Subscription activated via webhook', ['user_id' => $user->id]);
    }

    private function handleSubscriptionCancelled(array $resource): void
    {
        $subscriptionId = $resource['id'] ?? null;

        $user = User::where('paypal_subscription_id', $subscriptionId)->first();
        if (! $user) {
            Log::error('User not found for subscription cancellation', ['subscription_id' => $subscriptionId]);

            return;
        }

        $user->update([
            'paypal_subscription_id' => null,
            'subscription_ends_at' => null,
        ]);

        Log::info('Subscription cancelled via webhook', ['user_id' => $user->id]);
    }

    private function handleSubscriptionExpired(array $resource): void
    {
        $this->handleSubscriptionCancelled($resource); // Same logic
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
