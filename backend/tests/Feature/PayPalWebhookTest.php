<?php

namespace Tests\Feature;

use App\Models\SupportTier;
use App\Models\User;
use App\Models\UserSupport;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

/**
 * The subscription half of the PayPal webhook.
 *
 * Everything here was found by reading the handler and is checked by running
 * it, because "the code looks right" is not a claim anyone should make about
 * money. Signature verification is stubbed — PayPal's verify endpoint is a
 * network call and is not what these tests are about.
 */
class PayPalWebhookTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        config(['paypal.webhook_id' => 'WH-TEST']);

        Http::fake([
            '*verify-webhook-signature*' => Http::response(['verification_status' => 'SUCCESS'], 200),
            '*oauth2/token*' => Http::response(['access_token' => 'test-token'], 200),
            '*' => Http::response([], 200),
        ]);
    }

    private function hook(array $payload)
    {
        return $this->withHeaders([
            'PAYPAL-TRANSMISSION-ID' => 'tx-1',
            'PAYPAL-TRANSMISSION-TIME' => now()->toIso8601String(),
            'PAYPAL-TRANSMISSION-SIG' => 'sig',
            'PAYPAL-CERT-URL' => 'https://api.paypal.com/cert',
            'PAYPAL-AUTH-ALGO' => 'SHA256withRSA',
        ])->postJson('/api/v1/webhooks/paypal', $payload);
    }

    private function subscriber(string $agreement = 'I-SUB-1'): User
    {
        $user = User::factory()->create([
            'paypal_subscription_id' => $agreement,
            'subscription_ends_at' => now()->addDays(3),
        ]);

        $tier = SupportTier::create([
            'name' => 'Fan', 'price' => 4.99, 'currency' => 'USD', 'is_active' => true,
        ]);

        UserSupport::create([
            'user_id' => $user->id, 'support_tier_id' => $tier->id,
            'payment_id' => 'PAY-1', 'amount' => 4.99, 'status' => 'active',
            'is_recurring' => true, 'expires_at' => now()->addDays(3),
        ]);

        return $user;
    }

    /**
     * The bug that cost the most: a renewal arrives as PAYMENT.SALE.COMPLETED
     * with no custom_id, the handler logged a warning and stopped, and the
     * paid-through date never moved while PayPal kept charging.
     */
    public function test_a_renewal_payment_extends_the_period(): void
    {
        $user = $this->subscriber();

        $this->hook([
            'id' => 'WH-EVT-renewal',
            'event_type' => 'PAYMENT.SALE.COMPLETED',
            'resource' => [
                'id' => 'SALE-9',
                'billing_agreement_id' => 'I-SUB-1',
                'billing_info' => ['next_billing_time' => now()->addMonth()->toIso8601String()],
            ],
        ])->assertOk();

        $this->assertTrue(
            $user->fresh()->subscription_ends_at->greaterThan(now()->addWeeks(3)),
            'a payment that renews must move the date it renews'
        );
    }

    /** The date comes from PayPal, not from a hardcoded month. */
    public function test_activation_takes_the_period_paypal_sends(): void
    {
        $user = $this->subscriber();
        $yearOut = now()->addYear()->startOfSecond();

        $this->hook([
            'id' => 'WH-EVT-activate',
            'event_type' => 'BILLING.SUBSCRIPTION.ACTIVATED',
            'resource' => [
                'id' => 'I-SUB-1',
                'billing_info' => ['next_billing_time' => $yearOut->toIso8601String()],
            ],
        ])->assertOk();

        $this->assertEquals(
            $yearOut->toDateString(),
            $user->fresh()->subscription_ends_at->toDateString(),
            'a yearly plan was being granted one month'
        );
    }

    /** Cancelled means "will not renew", not "is over now". */
    public function test_cancelling_leaves_the_paid_period_alone(): void
    {
        $user = $this->subscriber();
        $endsAt = $user->subscription_ends_at;

        $this->hook([
            'id' => 'WH-EVT-cancel',
            'event_type' => 'BILLING.SUBSCRIPTION.CANCELLED',
            'resource' => ['id' => 'I-SUB-1'],
        ])->assertOk();

        $fresh = $user->fresh();
        $this->assertNotNull($fresh->subscription_ends_at, 'they paid through this date');
        $this->assertEquals($endsAt->toDateString(), $fresh->subscription_ends_at->toDateString());
        $this->assertNotNull($fresh->paypal_subscription_id, 'the later EXPIRED event still has to find them');
        $this->assertFalse((bool) UserSupport::where('user_id', $user->id)->first()->is_recurring);
    }

    /** Expired is the event that ends it. */
    public function test_expiry_ends_the_subscription(): void
    {
        $user = $this->subscriber();

        $this->hook([
            'id' => 'WH-EVT-expire',
            'event_type' => 'BILLING.SUBSCRIPTION.EXPIRED',
            'resource' => ['id' => 'I-SUB-1'],
        ])->assertOk();

        $fresh = $user->fresh();
        $this->assertNull($fresh->subscription_ends_at);
        $this->assertNull($fresh->paypal_subscription_id);
        $this->assertSame('expired', UserSupport::where('user_id', $user->id)->first()->status);
    }

    /**
     * PayPal redelivers until it gets a 2xx, and this handler answers 500 on
     * any exception — so a redelivery is the normal path. Before the dedupe,
     * each one moved the date again.
     */
    public function test_the_same_event_twice_moves_nothing_twice(): void
    {
        $user = $this->subscriber();
        $payload = [
            'id' => 'WH-EVT-dup',
            'event_type' => 'BILLING.SUBSCRIPTION.ACTIVATED',
            'resource' => [
                'id' => 'I-SUB-1',
                'billing_info' => ['next_billing_time' => now()->addMonth()->toIso8601String()],
            ],
        ];

        $this->hook($payload)->assertOk();
        $first = $user->fresh()->subscription_ends_at;

        $second = $this->hook($payload);
        $second->assertOk();
        $this->assertSame('duplicate', $second->json('status'));
        $this->assertEquals($first->toIso8601String(), $user->fresh()->subscription_ends_at->toIso8601String());
    }

    /** A claimed event that then fails must be claimable again. */
    public function test_a_failed_event_can_be_redelivered(): void
    {
        Cache::add('paypal:event:WH-EVT-retry', true, now()->addDay());
        Cache::forget('paypal:event:WH-EVT-retry');

        $user = $this->subscriber();

        $this->hook([
            'id' => 'WH-EVT-retry',
            'event_type' => 'BILLING.SUBSCRIPTION.ACTIVATED',
            'resource' => [
                'id' => 'I-SUB-1',
                'billing_info' => ['next_billing_time' => now()->addMonth()->toIso8601String()],
            ],
        ])->assertOk();

        $this->assertTrue($user->fresh()->subscription_ends_at->greaterThan(now()->addWeeks(3)));
    }

    /** Never shortens: two events can arrive out of order. */
    public function test_an_older_event_cannot_shorten_a_longer_period(): void
    {
        $user = $this->subscriber();
        $user->update(['subscription_ends_at' => now()->addYear()]);

        $this->hook([
            'id' => 'WH-EVT-late',
            'event_type' => 'BILLING.SUBSCRIPTION.ACTIVATED',
            'resource' => [
                'id' => 'I-SUB-1',
                'billing_info' => ['next_billing_time' => now()->addMonth()->toIso8601String()],
            ],
        ])->assertOk();

        $this->assertTrue(
            $user->fresh()->subscription_ends_at->greaterThan(now()->addMonths(6)),
            'the longer paid period is the one they bought'
        );
    }
}
