<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use RuntimeException;

class PriveeService
{
    private string $baseUrl;
    private string $apiKey;

    public function __construct()
    {
        $this->baseUrl = rtrim(config('services.privee.base_url', 'https://38wzs9wt1a.execute-api.eu-central-1.amazonaws.com/'), '/');
        $this->apiKey  = config('services.privee.api_key') ?? '';
    }

    /**
     * Authenticate user with email and password.
     *
     * @throws RuntimeException on failure
     */
    public function login(string $email, string $password): array
    {
        $response = Http::withHeaders([
            'x-api-key'    => $this->apiKey,
            'Content-Type' => 'application/json',
            'Accept'       => 'application/json',
        ])->timeout(15)->post("{$this->baseUrl}/auth/login", [
            'email'    => $email,
            'password' => $password,
        ]);

        $data = $this->parseResponse($response, 'email login');
        $data['email'] = $email; // Include submitted email for entry creation (API doesn't return user info)
        return $data;
    }

    /**
     * Authenticate user with Google ID token.
     *
     * @throws RuntimeException on failure
     */
    public function googleLogin(string $googleToken): array
    {
        $response = Http::withHeaders([
            'x-api-key'    => $this->apiKey,
            'Content-Type' => 'application/json',
            'Accept'       => 'application/json',
        ])->timeout(15)->post("{$this->baseUrl}/auth/google-login", [
            'token' => $googleToken,
        ]);

        return $this->parseResponse($response, 'google login');
    }

    /**
     * Parse Privee API response and extract auth data.
     *
     * @throws RuntimeException on failure
     */
    private function parseResponse(\Illuminate\Http\Client\Response $response, string $context): array
    {
        if ($response->failed()) {
            Log::warning("Privee API {$context} failed", [
                'status' => $response->status(),
                'body'   => $response->body(),
            ]);
            throw new RuntimeException('Authentication failed. Please check your credentials and try again.');
        }

        $body = $response->json();

        // Privee wraps responses: { data: { success: bool, data: { accessToken, ... } } }
        $outer = $body['data'] ?? $body;

        if (empty($outer['success'])) {
            $message = $outer['error'] ?? $outer['message'] ?? 'Invalid credentials.';
            Log::info("Privee API {$context} returned success=false", ['message' => $message]);
            throw new RuntimeException($message);
        }

        $inner = $outer['data'] ?? [];

        if (empty($inner['accessToken'])) {
            Log::error("Privee API {$context} missing accessToken", ['body' => $body]);
            throw new RuntimeException('Unexpected response from authentication service.');
        }

        // Flatten: tokens from inner, metadata from outer
        return array_merge($outer, $inner);
    }
}
