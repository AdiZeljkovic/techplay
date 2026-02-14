<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class OpenAIService
{
    protected string $apiKey;
    protected string $model;
    protected bool $verifySSL;

    public function __construct()
    {
        $this->apiKey = config('services.openai.api_key');
        $this->model = config('services.openai.model', 'gpt-4-turbo');
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
     * Analyze WoW character for Midnight expansion readiness
     *
     * @param array $characterData Minified character data from BlizzardDataTransformer
     * @return array|null {score: int, advice: string[], missing: string[]}
     */
    public function analyzeCharacterReadiness(array $characterData): ?array
    {
        $systemPrompt = $this->buildSystemPrompt();
        $userPrompt = $this->buildUserPrompt($characterData);

        try {
            $response = $this->http(60)
                ->withHeaders([
                    'Authorization' => "Bearer {$this->apiKey}",
                    'Content-Type' => 'application/json',
                ])
                ->post('https://api.openai.com/v1/chat/completions', [
                    'model' => $this->model,
                    'messages' => [
                        ['role' => 'system', 'content' => $systemPrompt],
                        ['role' => 'user', 'content' => $userPrompt],
                    ],
                    'response_format' => ['type' => 'json_object'],
                    'temperature' => 0.7,
                    'max_tokens' => 800,
                ]);

            if ($response->failed()) {
                Log::error('OpenAI API Failed', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);
                return null;
            }

            $data = $response->json();
            $content = $data['choices'][0]['message']['content'] ?? null;

            if (!$content) {
                Log::error('OpenAI returned empty content');
                return null;
            }

            return json_decode($content, true);
        } catch (\Exception $e) {
            Log::error('OpenAI Exception: ' . $e->getMessage());
            return null;
        }
    }

    protected function buildSystemPrompt(): string
    {
        return <<<PROMPT
You are a World of Warcraft analyst specializing in the upcoming Midnight expansion.

Your task: Analyze a character's achievements and mounts to estimate their readiness for Midnight (0-100%).

Focus areas:
- Quel'Thalas lore achievements (Sunwell Plateau era)
- Void-themed mounts and collections
- Allied Races (especially Void Elves)
- Warbands progress (new Midnight feature)
- Overall achievement completion

Return JSON format ONLY:
{
  "score": <number 0-100>,
  "advice": ["<tip 1>", "<tip 2>", "<tip 3>"],
  "missing": ["<essential item 1>", "<essential item 2>", ...]
}

Tips should be:
- Short (max 15 words each)
- Witty and engaging
- Actionable and useful

Missing essentials:
- List 3-5 key things the character lacks for Midnight readiness
- Focus on lore-relevant content
PROMPT;
    }

    protected function buildUserPrompt(array $characterData): string
    {
        return json_encode($characterData, JSON_PRETTY_PRINT);
    }
}
