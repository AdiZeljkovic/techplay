<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\GameRecommendationService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

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
}
