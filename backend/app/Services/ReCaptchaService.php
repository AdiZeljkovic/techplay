<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ReCaptchaService
{
    protected string $secretKey;

    protected bool $enabled;

    public function __construct()
    {
        $this->secretKey = config('services.turnstile.secret_key') ?? '';
        $this->enabled = config('services.turnstile.enabled', true);
    }

    /**
     * Verify Cloudflare Turnstile token
     *
     * @param  string  $token  The token from frontend
     * @param  string  $action  Expected action name (unused for Turnstile but kept for API compatibility)
     * @return array{success: bool, score: ?float, error: ?string}
     */
    public function verify(string $token, string $action = 'submit'): array
    {
        if (! $this->enabled) {
            Log::info('Turnstile verification disabled');

            return ['success' => true, 'score' => 1.0, 'error' => null];
        }

        if (empty($this->secretKey)) {
            Log::warning('Turnstile secret key not configured');

            return ['success' => true, 'score' => 1.0, 'error' => null];
        }

        try {
            $response = Http::asForm()->post('https://challenges.cloudflare.com/turnstile/v0/siteverify', [
                'secret' => $this->secretKey,
                'response' => $token,
            ]);

            $data = $response->json();

            if (! ($data['success'] ?? false)) {
                Log::warning('Turnstile verification failed', [
                    'errors' => $data['error-codes'] ?? [],
                    'token_length' => strlen($token),
                ]);

                return [
                    'success' => false,
                    'score' => null,
                    'error' => 'Security verification failed',
                ];
            }

            return [
                'success' => true,
                'score' => 1.0,
                'error' => null,
            ];

        } catch (\Exception $e) {
            Log::error('Turnstile verification exception: '.$e->getMessage());

            return [
                'success' => false,
                'score' => null,
                'error' => 'Verification service unavailable',
            ];
        }
    }
}
