<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class PayPalService
{
    protected $baseUrl;

    protected $clientId;

    protected $clientSecret;

    protected $verifySSL;

    public function __construct()
    {
        $this->clientId = config('services.paypal.client_id');
        $this->clientSecret = config('services.paypal.secret');
        $this->baseUrl = config('services.paypal.base_url');
        // Only disable SSL verification in local development
        $this->verifySSL = ! app()->environment('local');
    }

    /**
     * Get HTTP client with proper SSL configuration
     */
    protected function http()
    {
        $client = Http::timeout(30);
        if (! $this->verifySSL) {
            $client = $client->withoutVerifying();
        }

        return $client;
    }

    /**
     * Get PayPal OAuth access token
     *
     * Changed from protected to public for webhook signature verification
     */
    public function getAccessToken()
    {
        $response = $this->http()
            ->withBasicAuth($this->clientId, $this->clientSecret)
            ->asForm()
            ->post("{$this->baseUrl}/v1/oauth2/token", [
                'grant_type' => 'client_credentials',
            ]);

        if ($response->failed()) {
            Log::error('PayPal Auth Failed: '.$response->body());
            throw new \Exception('Could not authenticate with PayPal');
        }

        return $response->json()['access_token'];
    }

    /**
     * Site prices are in convertible marks; PayPal charges in euro. The mark
     * is pegged at 1.95583 to the euro, so this is an exact conversion, not a
     * rate lookup. Rounds up to the cent so we are never short.
     */
    public function toPayableAmount(float $bam): float
    {
        if (strtoupper((string) config('paypal.currency')) === 'BAM') {
            return round($bam, 2);
        }

        return ceil(($bam / (float) config('paypal.bam_per_eur', 1.95583)) * 100) / 100;
    }

    public function createOrder($amount, $currency = 'EUR')
    {
        $token = $this->getAccessToken();

        $response = $this->http()->withToken($token)
            ->post("{$this->baseUrl}/v2/checkout/orders", [
                'intent' => 'CAPTURE',
                'purchase_units' => [
                    [
                        'amount' => [
                            'currency_code' => $currency,
                            'value' => number_format($amount, 2, '.', ''),
                        ],
                    ],
                ],
            ]);

        if ($response->failed()) {
            Log::error('PayPal Create Order Failed: '.$response->body());
            throw new \Exception('Could not create PayPal order');
        }

        return $response->json();
    }

    public function captureOrder($orderId)
    {
        $token = $this->getAccessToken();

        $response = $this->http()->withToken($token)
            ->post("{$this->baseUrl}/v2/checkout/orders/{$orderId}/capture", [
                'headers' => [
                    'Content-Type' => 'application/json',
                ],
            ]);

        // Note: 422 usually means already captured or invalid status, but let's handle generic fail
        if ($response->failed()) {
            Log::error('PayPal Capture Failed: '.$response->body());
            throw new \Exception('Could not capture PayPal order');
        }

        return $response->json();
    }

    /**
     * Read a subscription back from PayPal. Used before any benefit is granted:
     * a subscription id supplied by the browser proves nothing on its own.
     */
    public function getSubscription(string $subscriptionId): ?array
    {
        $response = $this->http()->withToken($this->getAccessToken())
            ->get("{$this->baseUrl}/v1/billing/subscriptions/{$subscriptionId}");

        if ($response->failed()) {
            Log::warning('PayPal subscription lookup failed: '.$response->body());

            return null;
        }

        return $response->json();
    }

    /** Read an order back, to confirm a one-off payment actually captured. */
    public function getOrder(string $orderId): ?array
    {
        $response = $this->http()->withToken($this->getAccessToken())
            ->get("{$this->baseUrl}/v2/checkout/orders/{$orderId}");

        if ($response->failed()) {
            Log::warning('PayPal order lookup failed: '.$response->body());

            return null;
        }

        return $response->json();
    }

    public function createProduct($name, $description, $type = 'SERVICE', $category = 'SOFTWARE')
    {
        $token = $this->getAccessToken();

        $response = $this->http()->withToken($token)
            ->post("{$this->baseUrl}/v1/catalogs/products", [
                'name' => $name,
                'description' => $description,
                'type' => $type,
                'category' => $category,
            ]);

        return $response->json(); // Returns 'id'
    }

    public function createPlan($productId, $name, $description, $intervalUnit = 'MONTH', $intervalCount = 1, $amount = '10.00', $currency = 'USD')
    {
        $token = $this->getAccessToken();

        $response = $this->http()->withToken($token)
            ->post("{$this->baseUrl}/v1/billing/plans", [
                'product_id' => $productId,
                'name' => $name,
                'description' => $description,
                'status' => 'ACTIVE',
                'billing_cycles' => [
                    [
                        'frequency' => [
                            'interval_unit' => $intervalUnit,
                            'interval_count' => $intervalCount,
                        ],
                        'tenure_type' => 'REGULAR',
                        'sequence' => 1,
                        'total_cycles' => 0, // Infinite
                        'pricing_scheme' => [
                            'fixed_price' => [
                                'value' => $amount,
                                'currency_code' => $currency,
                            ],
                        ],
                    ],
                ],
                'payment_preferences' => [
                    'auto_bill_outstanding' => true,
                    'setup_fee_failure_action' => 'CONTINUE',
                    'payment_failure_threshold' => 3,
                ],
            ]);

        if ($response->failed()) {
            Log::error('PayPal Create Plan Failed: '.$response->body());
            throw new \Exception('Could not create PayPal plan');
        }

        return $response->json();
    }
}
