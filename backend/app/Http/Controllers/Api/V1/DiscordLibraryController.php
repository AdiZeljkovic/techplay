<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\UserGame;
use App\Services\ProfileService;
use App\Services\TasteMatchService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * What the bot can say about a shelf.
 *
 * Everything here answers by Discord id rather than username, because that is
 * the only handle the bot has. Each one refuses a profile its owner has made
 * private — the same door the website uses, since a shelf read out in a
 * channel is still a shelf being read.
 */
class DiscordLibraryController extends Controller
{
    public function __construct(private readonly ProfileService $profiles) {}

    /**
     * A shelf, newest first, optionally narrowed to one status.
     */
    public function library(Request $request, string $discordId): JsonResponse
    {
        $user = $this->linked($discordId);

        if (! $user) {
            return response()->json(['message' => 'User not linked'], 404);
        }

        if ($this->hidden($user)) {
            return response()->json(['message' => 'This profile is private'], 403);
        }

        $status = $request->query('status');
        $valid = in_array($status, UserGame::STATUSES, true) ? $status : null;

        $games = UserGame::where('user_id', $user->id)
            ->when($valid, fn ($q) => $q->where('status', $valid))
            ->with(['game:id,slug,name,cover_url'])
            ->orderByRaw('COALESCE(last_played_at, updated_at) DESC')
            ->limit(25)
            ->get()
            ->map(fn (UserGame $ug) => [
                'name' => $ug->game?->name,
                'slug' => $ug->game?->slug,
                'status' => $ug->status,
                'hours' => (int) ($ug->hours_played ?? 0),
                'progress' => (int) ($ug->progress ?? 0),
                // Which stores reported it, so the bot can mark provenance the
                // way the website's cards do.
                'sources' => $ug->sources ?? [],
            ])
            ->filter(fn ($g) => $g['slug'] !== null)
            ->values();

        return response()->json([
            'username' => $user->username,
            'display_name' => $user->display_name ?: $user->name,
            'counts' => $this->profiles->collectionCounts($user),
            'filter' => $valid,
            'games' => $games,
            'profile_url' => $this->profileUrl($user),
        ]);
    }

    /**
     * How much two shelves overlap.
     *
     * The one question that belongs on Discord more than on the website: two
     * people are already in the same room, and the answer is about the pair
     * rather than about either one.
     */
    public function match(string $discordId, string $otherDiscordId): JsonResponse
    {
        $viewer = $this->linked($discordId);
        $target = $this->linked($otherDiscordId);

        if (! $viewer) {
            return response()->json(['message' => 'You are not linked', 'who' => 'viewer'], 404);
        }

        if (! $target) {
            return response()->json(['message' => 'They are not linked', 'who' => 'target'], 404);
        }

        if ($viewer->id === $target->id) {
            return response()->json(['message' => 'That is you'], 422);
        }

        if ($this->hidden($target)) {
            return response()->json(['message' => 'That profile is private'], 403);
        }

        return response()->json([
            'viewer' => $viewer->display_name ?: $viewer->username,
            'target' => $target->display_name ?: $target->username,
            'target_username' => $target->username,
            'match' => app(TasteMatchService::class)->between($viewer, $target),
        ]);
    }

    /**
     * What to play next, out of a backlog they already own.
     */
    public function backlog(string $discordId): JsonResponse
    {
        $user = $this->linked($discordId);

        if (! $user) {
            return response()->json(['message' => 'User not linked'], 404);
        }

        // Shortest first among the ones with a measured length, then the rest.
        // A backlog suggestion that opens with a 200-hour RPG is a suggestion
        // nobody takes.
        $games = UserGame::where('user_id', $user->id)
            ->where('status', 'backlog')
            ->with(['game:id,slug,name,cover_url,genres'])
            ->inRandomOrder()
            ->limit(3)
            ->get()
            ->map(fn (UserGame $ug) => [
                'name' => $ug->game?->name,
                'slug' => $ug->game?->slug,
                'genres' => array_slice((array) ($ug->game?->genres ?? []), 0, 2),
            ])
            ->filter(fn ($g) => $g['slug'] !== null)
            ->values();

        return response()->json([
            'username' => $user->username,
            'backlog_count' => UserGame::where('user_id', $user->id)->where('status', 'backlog')->count(),
            'picks' => $games,
        ]);
    }

    private function linked(string $discordId): ?User
    {
        return User::where('discord_id', $discordId)->first();
    }

    private function hidden(User $user): bool
    {
        return $user->hasPrivateProfile();
    }

    private function profileUrl(User $user): string
    {
        return rtrim(config('app.frontend_url'), '/').'/profile/'.$user->username;
    }
}
