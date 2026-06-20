<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GeminiService
{
    protected string $apiKey;

    protected string $model;

    protected bool $verifySSL;

    public function __construct()
    {
        $this->apiKey = config('services.gemini.api_key');
        $this->model = config('services.gemini.model', 'gemini-2.5-flash');
        $this->verifySSL = ! app()->environment('local');
    }

    protected function http(int $timeout = 60)
    {
        $client = Http::timeout($timeout);
        if (! $this->verifySSL) {
            $client = $client->withoutVerifying();
        }

        return $client;
    }

    /**
     * Analyze WoW character for Midnight expansion readiness using Google Gemini
     *
     * @param  array  $characterData  Minified character data from BlizzardDataTransformer
     * @return array|null {score: int, advice: string[], missing: string[], daily_priority: string[]}
     */
    public function analyzeCharacterReadiness(array $characterData): ?array
    {
        $prompt = $this->buildPrompt($characterData);

        try {
            $response = $this->http(60)
                ->post("https://generativelanguage.googleapis.com/v1/models/{$this->model}:generateContent?key={$this->apiKey}", [
                    'contents' => [
                        [
                            'parts' => [
                                ['text' => $prompt],
                            ],
                        ],
                    ],
                    'generationConfig' => [
                        'temperature' => 0.7,
                        'maxOutputTokens' => 2048,
                        'topP' => 0.95,
                        'topK' => 40,
                    ],
                ]);

            if ($response->failed()) {
                Log::error('Gemini API Failed', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);

                return null;
            }

            $data = $response->json();

            // DEBUG: Log full Gemini response
            Log::warning('Gemini full response', [
                'finishReason' => $data['candidates'][0]['finishReason'] ?? 'unknown',
                'usageMetadata' => $data['usageMetadata'] ?? null,
                'full_data' => $data,
            ]);

            $content = $data['candidates'][0]['content']['parts'][0]['text'] ?? null;

            if (! $content) {
                Log::error('Gemini returned empty content', ['response' => $data]);

                return null;
            }

            // Extract JSON from Gemini response (it might be wrapped in markdown)
            $jsonContent = $this->extractJSON($content);

            // DEBUG: Log extracted JSON
            Log::warning('Gemini JSON extracted', ['json' => $jsonContent]);

            $result = json_decode($jsonContent, true);

            if ($result === null) {
                Log::error('Gemini JSON decode failed', [
                    'raw_content' => $content,
                    'extracted_json' => $jsonContent,
                    'json_error' => json_last_error_msg(),
                ]);

                return null;
            }

            return $result;
        } catch (\Exception $e) {
            Log::error('Gemini Exception: '.$e->getMessage());

            return null;
        }
    }

    /**
     * Extract JSON from Gemini response (handles markdown code blocks)
     */
    protected function extractJSON(string $content): string
    {
        // If wrapped in ```json ... ``` or ``` ... ```
        if (preg_match('/```(?:json)?\s*(\{.*?\})\s*```/s', $content, $matches)) {
            return $matches[1];
        }

        // If plain JSON
        if (str_starts_with(trim($content), '{')) {
            return $content;
        }

        // Try to find JSON anywhere in the text
        if (preg_match('/(\{.*\})/s', $content, $matches)) {
            return $matches[1];
        }

        return $content;
    }

    protected function buildPrompt(array $characterData): string
    {
        $daysUntilLaunch = max(0, (int) ((strtotime('2026-03-02 15:00:00') - time()) / 86400));

        return <<<PROMPT
Analyze WoW character for Midnight expansion (launches March 2, 2026 - {$daysUntilLaunch} days left).

KEY FACTORS:
- Royal Voidwing mount (ends at launch, NEVER returns)
- Void Elves (core to Midnight story)
- Quel'Thalas lore (Sunwell raid)
- Housing collections (mounts, achievements)

CHARACTER:
{$this->formatCharacterData($characterData)}

Return ONLY this JSON (no markdown, no extra text):
{
  "score": [0-100 readiness %],
  "advice": ["tip 1", "tip 2", "tip 3"],
  "missing": ["item 1", "item 2"],
  "daily_priority": ["task 1", "task 2"]
}
PROMPT;
    }

    protected function formatCharacterData(array $data): string
    {
        return json_encode([
            'character' => $data['character'] ?? [],
            'achievements' => [
                'total_completed' => $data['achievements']['total_completed'] ?? 0,
                'has_void_elf' => $data['achievements']['has_void_elf'] ?? false,
                'midnight_relevant' => count($data['achievements']['midnight_achievements'] ?? []),
            ],
            'mounts' => [
                'total' => $data['mounts']['total_mounts'] ?? 0,
                'void_themed' => $data['mounts']['void_mount_count'] ?? 0,
            ],
            'housing_score' => $data['housing']['housing_score'] ?? 0,
            'midnight_readiness' => $data['midnight_readiness'] ?? 0,
        ], JSON_PRETTY_PRINT);
    }
}
