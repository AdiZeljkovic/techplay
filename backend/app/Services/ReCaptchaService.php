<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ReCaptchaService
{
    protected string $secretKey;
    protected float $minScore;

    public function __construct()
    {
        $this->secretKey = config('services.recaptcha.secret_key', env('RECAPTCHA_SECRET_KEY'));
        $this->minScore = 0.5; // Threshold score (0.0 - 1.0)
    }

    /**
     * Verify reCAPTCHA v3 token
     *
     * @param string $token The token from frontend
     * @param string $action Expected action name
     * @return array{success: bool, score: ?float, error: ?string}
     */
    public function verify(string $token, string $action = 'submit'): array
    {
        if (empty($this->secretKey)) {
            Log::warning('reCAPTCHA secret key not configured');
            return ['success' => true, 'score' => 1.0, 'error' => null]; // Skip if not configured
        }

        try {
            $response = Http::asForm()->post('https://challenges.cloudflare.com/turnstile/v0/siteverify', [
                'secret' => $this->secretKey,
                'response' => $token,
            ]);

            $data = $response->json();

            if (!($data['success'] ?? false)) {
                Log::warning('Turnstile verification failed', ['errors' => $data['error-codes'] ?? []]);
                return [
                    'success' => false,
                    'error' => 'Security verification failed'
                ];
            }

            // Cloudflare Turnstile is primarily Boolean success/fail

            return [
                'success' => true,
                'score' => 1.0, // Default to 1.0 as Turnstile is pass/fail
                'error' => null
            ];

            return [
                'success' => true,
                'score' => $score,
                'error' => null
            ];

        } catch (\Exception $e) {
            Log::error('reCAPTCHA verification exception: ' . $e->getMessage());
            return [
                'success' => false,
                'score' => null,
                'error' => 'Verification service unavailable'
            ];
        }
    }
}
