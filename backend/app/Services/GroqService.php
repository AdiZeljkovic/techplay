<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GroqService
{
    protected string $apiKey;
    protected string $model;
    protected bool $verifySSL;

    public function __construct()
    {
        $this->apiKey = config('services.groq.api_key');
        $this->model = config('services.groq.model', 'llama-3.3-70b-versatile');
        $this->verifySSL = !app()->environment('local');
    }

    protected function http(int $timeout = 60)
    {
        $client = Http::timeout($timeout);
        if (!$this->verifySSL) {
            $client = $client->withoutVerifying();
        }
        return $client;
    }

    /**
     * Analyze WoW character for Midnight expansion readiness using Groq
     *
     * @param array $characterData Minified character data from BlizzardDataTransformer
     * @return array|null {score: int, advice: string[], missing: string[], daily_priority: string[]}
     */
    public function analyzeCharacterReadiness(array $characterData): ?array
    {
        $prompt = $this->buildPrompt($characterData);

        try {
            $response = $this->http(60)
                ->withHeaders([
                    'Authorization' => "Bearer {$this->apiKey}",
                    'Content-Type' => 'application/json',
                ])
                ->post('https://api.groq.com/openai/v1/chat/completions', [
                    'model' => $this->model,
                    'messages' => [
                        [
                            'role' => 'user',
                            'content' => $prompt
                        ]
                    ],
                    'temperature' => 0.7,
                    'max_tokens' => 2048,
                    'response_format' => ['type' => 'json_object']
                ]);

            if ($response->failed()) {
                Log::error('Groq API Failed', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);
                return null;
            }

            $data = $response->json();
            $content = $data['choices'][0]['message']['content'] ?? null;

            if (!$content) {
                Log::error('Groq returned empty content', ['response' => $data]);
                return null;
            }

            // Groq with json_object mode returns clean JSON
            $result = json_decode($content, true);

            if ($result === null) {
                Log::error('Groq JSON decode failed', [
                    'content' => $content,
                    'json_error' => json_last_error_msg()
                ]);
                return null;
            }

            return $result;
        } catch (\Exception $e) {
            Log::error('Groq Exception: ' . $e->getMessage());
            return null;
        }
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

Return ONLY valid JSON with this exact structure:
{
  "score": [0-100 readiness percentage],
  "advice": ["specific tip 1", "specific tip 2", "specific tip 3"],
  "missing": ["missing item 1", "missing item 2"],
  "daily_priority": ["priority task 1", "priority task 2"]
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
