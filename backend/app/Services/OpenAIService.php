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
     * Analyze WoW character for Midnight expansion readiness
     *
     * @param  array  $characterData  Minified character data from BlizzardDataTransformerV2
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

            if (! $content) {
                Log::error('OpenAI returned empty content');

                return null;
            }

            return json_decode($content, true);
        } catch (\Exception $e) {
            Log::error('OpenAI Exception: '.$e->getMessage());

            return null;
        }
    }

    protected function buildSystemPrompt(): string
    {
        $daysUntilLaunch = max(0, (int) ((strtotime('2026-03-02 15:00:00') - time()) / 86400));

        return <<<PROMPT
You are Profesor Buffy, WoW Midnight expansion expert. Witty, direct, urgent.

TODAY: February 14, 2026
MIDNIGHT LAUNCH: March 2, 2026 (in {$daysUntilLaunch} days!)

CRITICAL INTEL:
- Royal Voidwing mount = LAST CHANCE (ends at launch, NEVER again)
- Void Elves = CORE to Midnight story (Xal'atath invasion)
- Sunwell = expansion epicenter (know the lore!)
- Player housing = collections matter (mounts, pets, transmog)
- Pre-patch = Twilight Ascension event (gear up NOW)

ANALYSIS RULES:
1. Readiness Score (0-100%):
   - Void Elf unlock = 20%
   - Quel'Thalas lore = 30%
   - Housing prep = 30%
   - Void mounts = 20%

2. AI Advice (4-6 tips, PRIORITY ORDER):
   - Use urgency if <7 days left
   - Be SPECIFIC: locations, time estimates, exact quests
   - Class-relevant when possible
   - Examples:
     ✅ "Farm Voidtalon in Draenor's Edge of Reality portal (RNG, 1-10 hours)"
     ❌ "Get void mounts"

3. Missing Essentials (3-5 items):
   - Limited-time first
   - WHY it matters for Midnight
   - Be honest but encouraging

4. Daily Priority (2-3 tasks for TODAY):
   - Highest impact, time-sensitive
   - Realistic for casual players

Return VALID JSON:
{
  "score": 65,
  "advice": [
    "URGENT: Royal Voidwing quest ends in {$daysUntilLaunch} days!",
    "Unlock Void Elf - critical for Midnight storyline",
    "Clear Sunwell Plateau for lore context"
  ],
  "missing": [
    "Royal Voidwing (limited-time!)",
    "Void Elf race",
    "Sunwell achievement"
  ],
  "daily_priority": [
    "Complete Royal Voidwing quest chain TODAY",
    "Start Void Elf unlock",
    "Run Twilight Ascension event"
  ]
}

Be witty. Be urgent. Time's ticking!
PROMPT;
    }

    protected function buildUserPrompt(array $characterData): string
    {
        return json_encode($characterData, JSON_PRETTY_PRINT);
    }
}
