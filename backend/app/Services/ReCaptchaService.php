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
            $response = Http::asForm()->post('https://www.google.com/recaptcha/api/siteverify', [
                'secret' => $this->secretKey,
                'response' => $token,
            ]);

            $data = $response->json();

            if (!$data['success']) {
                Log::warning('reCAPTCHA verification failed', ['errors' => $data['error-codes'] ?? []]);
                return [
                    'success' => false,
                    'score' => null,
                    'error' => 'reCAPTCHA verification failed'
                ];
            }

            // Check action matches
            if (isset($data['action']) && $data['action'] !== $action) {
                Log::warning('reCAPTCHA action mismatch', [
                    'expected' => $action,
                    'received' => $data['action']
                ]);
            }

            // Check score threshold
            $score = $data['score'] ?? 0;
            if ($score < $this->minScore) {
                Log::warning('reCAPTCHA score too low', ['score' => $score]);
                return [
                    'success' => false,
                    'score' => $score,
                    'error' => 'Suspicious activity detected'
                ];
            }

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
