<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\UserGame;
use App\Services\GameRecommendationService;
use App\Services\PremiumService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class BacklogAdvisorController extends Controller
{
    use ApiResponse;

    private const MOODS = ['action', 'relaxed', 'story', 'competitive', 'any'];

    /**
     * GET /backlog/recommendations — scored suggestions from the whole
     * catalogue. No model, no quota: every point comes from a component the
     * payload publishes, so the card can show its own working.
     */
    public function recommendations(Request $request, GameRecommendationService $recommender): JsonResponse
    {
        $data = $request->validate([
            'mood' => 'nullable|in:any,action,story,chill,competitive',
            'genres' => 'nullable|array|max:8',
            'genres.*' => 'string|max:60',
            'exclude_backlog' => 'nullable|boolean',
            'exclude_played' => 'nullable|boolean',
        ]);

        $user = $request->user();

        $filters = [
            'mood' => ($data['mood'] ?? 'any') === 'any' ? null : $data['mood'],
            'genres' => $data['genres'] ?? [],
            'exclude_backlog' => $request->boolean('exclude_backlog', true),
            'exclude_played' => $request->boolean('exclude_played', true),
        ];

        return $this->success([
            'summary' => $recommender->summary($user),
            'genres' => $recommender->availableGenres(),
            'recommendations' => $recommender->recommend($user, $filters),
            'weights' => [
                ['key' => 'genre', 'label' => 'Your collection', 'note' => 'The genres you own, finish and favourite.'],
                ['key' => 'peers', 'label' => 'Players like you', 'note' => 'What shelves that overlap yours also hold.'],
                ['key' => 'quality', 'label' => 'Quality', 'note' => 'Player ratings and Metacritic, where we have them.'],
                ['key' => 'era', 'label' => 'Your era', 'note' => 'How close it sits to the years you play in.'],
            ],
        ]);
    }

    /**
     * POST /backlog/suggest — AI picks the best backlog game based on mood + time.
     * Free users: 3 requests/day. Premium: unlimited.
     */
    public function suggest(Request $request, PremiumService $premium): JsonResponse
    {
        $request->validate([
            'mood' => 'nullable|in:action,relaxed,story,competitive,any',
            'time_available' => 'nullable|integer|min:1|max:100',
            'platform' => 'nullable|string|max:60',
        ]);

        $user = $request->user();

        if (! $premium->isPremium($user)) {
            $cacheKey = "backlog_advisor_uses:{$user->id}:".now()->format('Y-m-d');
            $uses = (int) Cache::get($cacheKey, 0);

            if ($uses >= 3) {
                return $this->error('Free users can use the Backlog Advisor 3 times per day. Upgrade to Premium for unlimited access!', 429);
            }

            Cache::put($cacheKey, $uses + 1, now()->endOfDay());
        }

        $mood = $request->input('mood', 'any');
        $timeAvailable = $request->input('time_available', 3);
        $platform = $request->input('platform', '');

        $backlog = UserGame::where('user_id', $user->id)
            ->where('status', 'backlog')
            ->with('game:id,name,slug,background_image,genre_names,platform_names,rating')
            ->orderByDesc('updated_at')
            ->limit(40)
            ->get();

        if ($backlog->isEmpty()) {
            return $this->error('Your backlog is empty — add some games first!', 422);
        }

        $gameList = $backlog->map(function ($entry) {
            $g = $entry->game;
            if (! $g) {
                return null;
            }
            $genres = is_array($g->genre_names) ? implode(', ', array_slice($g->genre_names, 0, 3)) : '';

            return "- {$g->name}".($genres ? " [{$genres}]" : '').($g->rating ? " (rating: {$g->rating})" : '');
        })->filter()->implode("\n");

        $platformNote = $platform ? "The user prefers playing on: {$platform}." : '';
        $moodNote = $mood !== 'any' ? "Current mood: {$mood} games." : '';
        $timeNote = "Available time: approximately {$timeAvailable} hour(s).";

        $prompt = <<<PROMPT
You are a gaming advisor. The user has these games in their backlog:

{$gameList}

{$moodNote} {$timeNote} {$platformNote}

Pick the SINGLE BEST game from the list above that fits the user's current mood and available time. Respond ONLY in JSON with this exact structure:
{
  "game_name": "<exact name from the list>",
  "reason": "<2-3 sentence explanation why this fits now>",
  "mood_match": "<how it fits the mood>",
  "estimated_hours": <number>
}
PROMPT;

        try {
            $apiKey = config('services.gemini.api_key');
            $model = config('services.gemini.model', 'gemini-2.5-flash');

            $response = Http::timeout(30)->post(
                "https://generativelanguage.googleapis.com/v1/models/{$model}:generateContent?key={$apiKey}",
                [
                    'contents' => [['parts' => [['text' => $prompt]]]],
                    'generationConfig' => ['temperature' => 0.7, 'maxOutputTokens' => 512],
                ]
            );

            if ($response->failed()) {
                throw new \RuntimeException('Gemini API call failed: '.$response->status());
            }

            $text = $response->json('candidates.0.content.parts.0.text', '');
            $text = preg_replace('/```json|```/', '', $text);
            $aiData = json_decode(trim($text), true);

            if (! is_array($aiData) || empty($aiData['game_name'])) {
                throw new \RuntimeException('Invalid AI response');
            }

            // Find matching game in backlog for slug + image
            $matched = $backlog->first(fn ($e) => $e->game && strtolower($e->game->name) === strtolower($aiData['game_name']));

            return $this->success([
                'game_name' => $aiData['game_name'],
                'reason' => $aiData['reason'] ?? '',
                'mood_match' => $aiData['mood_match'] ?? '',
                'estimated_hours' => $aiData['estimated_hours'] ?? $timeAvailable,
                'game' => $matched?->game ? [
                    'slug' => $matched->game->slug,
                    'background_image' => $matched->game->background_image,
                    'rating' => $matched->game->rating,
                ] : null,
            ]);
        } catch (\Throwable $e) {
            Log::warning('BacklogAdvisor AI failed', ['error' => $e->getMessage()]);

            // Graceful fallback: pick random from backlog
            $fallback = $backlog->random();

            return $this->success([
                'game_name' => $fallback->game?->name ?? 'Unknown',
                'reason' => 'Our AI advisor is taking a break. Here\'s a random pick from your backlog!',
                'mood_match' => '',
                'estimated_hours' => $timeAvailable,
                'game' => $fallback->game ? [
                    'slug' => $fallback->game->slug,
                    'background_image' => $fallback->game->background_image,
                    'rating' => $fallback->game->rating,
                ] : null,
            ]);
        }
    }
}
