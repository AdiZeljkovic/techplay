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
     * Analyze WoW character for Midnight expansion readiness using Groq
     *
     * @param  array  $characterData  Minified character data from BlizzardDataTransformerV2
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
                            'content' => $prompt,
                        ],
                    ],
                    'temperature' => 0.7,
                    'max_tokens' => 2048,
                    'response_format' => ['type' => 'json_object'],
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

            if (! $content) {
                Log::error('Groq returned empty content', ['response' => $data]);

                return null;
            }

            // Groq with json_object mode returns clean JSON
            $result = json_decode($content, true);

            if ($result === null) {
                Log::error('Groq JSON decode failed', [
                    'content' => $content,
                    'json_error' => json_last_error_msg(),
                ]);

                return null;
            }

            return $result;
        } catch (\Exception $e) {
            Log::error('Groq Exception: '.$e->getMessage());

            return null;
        }
    }

    /**
     * Midnight's launch, 2 March 2026 at 15:00 UTC.
     *
     * The prompt used to compute "days left" against this and clamp at zero, so
     * from 2 March onward every analysis told the reader the expansion "launches
     * March 2, 2026 - 0 days left". It had been saying that for the better part
     * of six months. A countdown that has run out is not a countdown; past the
     * date the prompt should say the expansion is live, and the sentence below
     * now does.
     */
    private const MIDNIGHT_LAUNCH = '2026-03-02 15:00:00';

    protected function buildPrompt(array $characterData): string
    {
        $launch = strtotime(self::MIDNIGHT_LAUNCH);
        $days = (int) floor(($launch - time()) / 86400);

        $timing = $days > 0
            ? "launches March 2, 2026 — {$days} days away"
            : 'live since March 2, 2026';

        $characterClass = $characterData['character']['class'] ?? 'Unknown';
        $itemLevel = $characterData['equipment']['item_level'] ?? 0;

        return <<<PROMPT
You are an expert World of Warcraft analyst. Analyze this {$characterClass} character for the Midnight expansion ({$timing}).

PROVIDE SPEC-SPECIFIC ANALYSIS:
- {$characterClass}-specific rotation tips
- Best stat priorities for {$characterClass}
- Recommended talent builds for M+ and raids
- Optimal gear upgrades for current iLvL ({$itemLevel})

{$this->midnightFactors($days > 0)}

{$this->affixSection()}
CHARACTER DATA:
{$this->formatCharacterData($characterData)}

Return ONLY valid JSON with this exact structure:
{
  "score": [0-100 readiness percentage],
  "advice": [
    "{$characterClass}-specific rotation tip",
    "Gear upgrade priority (BiS item suggestion)",
    "Mythic+ strategy — affix-specific if this week's affixes are listed above, otherwise general",
    "Midnight collection tip",
    "Profession tip (if applicable)"
  ],
  "missing": ["critical missing item 1", "critical missing item 2"],
  "daily_priority": ["priority task 1 (specific to {$characterClass})", "priority task 2"]
}

IMPORTANT: Make advice ACTIONABLE and SPECIFIC to this {$characterClass} character. No generic tips!
PROMPT;
    }

    /**
     * What matters about Midnight depends on whether it has started.
     *
     * The list was written before launch and never revisited, so months into the
     * expansion the tool was still telling people to chase a mount that stopped
     * being obtainable at launch and to have professions ready to craft on day
     * one — day one having been in March. Half of a pre-launch checklist is
     * actively wrong once the thing has launched.
     */
    protected function midnightFactors(bool $beforeLaunch): string
    {
        $shared = [
            'Void Elves (core to Midnight story)',
            "Quel'Thalas lore (Sunwell raid, Silvermoon)",
            'Housing collections (mounts, pets, toys, transmog)',
        ];

        $timed = $beforeLaunch
            ? [
                'Royal Voidwing mount (ends at launch, NEVER returns)',
                'Profession readiness (crafting high-level gear day 1)',
            ]
            : [
                'Current-season gearing paths and weekly caps',
                'Profession progress toward current-tier crafted gear',
            ];

        $heading = $beforeLaunch ? 'KEY MIDNIGHT FACTORS (pre-launch)' : 'KEY MIDNIGHT FACTORS';

        return $heading.":\n- ".implode("\n- ", [...$timed, ...$shared]);
    }

    /**
     * This week's affixes, or silence.
     *
     * Three of them were written into the prompt by hand. They were correct for
     * one week in early 2026 and wrong every week after, and the model repeated
     * strategies for them as confidently as it did the parts drawn from the
     * character's own data — which is worse than saying nothing, because the
     * reader cannot tell the two apart.
     *
     * If Raider.IO cannot be reached the section is omitted rather than guessed,
     * and the JSON contract below asks for a general Mythic+ tip in that case.
     */
    protected function affixSection(): string
    {
        $affixes = app(RaiderIOService::class)->getCurrentAffixes();

        if (! $affixes) {
            return '';
        }

        return "THIS WEEK'S MYTHIC+ AFFIXES (provide affix-specific strategies):\n- "
            .implode("\n- ", $affixes)."\n\n";
    }

    protected function formatCharacterData(array $data): string
    {
        return json_encode([
            'character' => [
                'name' => $data['character']['name'] ?? 'Unknown',
                'class' => $data['character']['class'] ?? 'Unknown',
                'race' => $data['character']['race'] ?? 'Unknown',
                'level' => $data['character']['level'] ?? 80,
                'faction' => $data['character']['faction'] ?? 'Unknown',
            ],
            'equipment' => [
                'item_level' => $data['equipment']['item_level'] ?? 0,
                'tier_pieces' => $data['equipment']['tier_pieces'] ?? 0,
                'missing_enchants' => count($data['equipment']['missing_enchants'] ?? []),
                'missing_gems' => count($data['equipment']['missing_gems'] ?? []),
            ],
            'mythic_plus' => [
                'score' => $data['mythic_plus']['score'] ?? 0,
                'completed_runs' => count($data['mythic_plus']['best_runs'] ?? []),
                'vault_unlocked' => $data['mythic_plus']['vault_unlocked'] ?? false,
            ],
            'raids' => [
                'current_tier' => $data['raids']['current_tier'] ?? 'Unknown',
                'summary' => $data['raids']['summary'] ?? '0/8',
            ],
            'pvp' => [
                'honor_level' => $data['pvp']['honor_level'] ?? 0,
                'highest_rating' => max(
                    $data['pvp']['arena_2v2'] ?? 0,
                    $data['pvp']['arena_3v3'] ?? 0,
                    $data['pvp']['rbg_rating'] ?? 0
                ),
            ],
            'reputations' => [
                'exalted_count' => $data['reputations']['exalted_count'] ?? 0,
                'midnight_factions_ready' => count(array_filter(
                    $data['reputations']['midnight_factions'] ?? [],
                    fn ($f) => $f['tier'] >= 7 // Exalted
                )),
            ],
            'collections' => [
                'pets' => $data['collections']['pets']['unique'] ?? 0,
                'toys' => $data['collections']['toys']['collected'] ?? 0,
                'mounts' => $data['collections']['mounts_count'] ?? 0,
                'transmog_appearances' => $data['collections']['transmog']['total_appearances'] ?? 0,
            ],
            'professions' => [
                'primary_count' => count($data['professions']['primary'] ?? []),
                'secondary_count' => count($data['professions']['secondary'] ?? []),
                'maxed_professions' => count(array_filter(
                    array_merge(
                        $data['professions']['primary'] ?? [],
                        $data['professions']['secondary'] ?? []
                    ),
                    fn ($p) => $p['skill_level'] >= $p['max_skill']
                )),
            ],
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
