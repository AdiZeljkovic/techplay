<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Game;
use App\Models\GamingMoment;
use App\Models\PlaySession;
use App\Models\User;
use App\Services\ClanResourceService;
use App\Services\JournalService;
use App\Services\SanitizationService;
use App\Traits\ApiResponse;
use App\Traits\ProfilePrivacy;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class JournalController extends Controller
{
    use ApiResponse, ProfilePrivacy;

    /** Clip hosts we can render. Anything else is refused rather than embedded blind. */
    private const CLIP_HOSTS = [
        'youtube.com' => 'youtube', 'youtu.be' => 'youtube',
        'twitch.tv' => 'twitch', 'clips.twitch.tv' => 'twitch',
        'streamable.com' => 'streamable',
        'medal.tv' => 'medal',
    ];

    /** A journal is a personal record, not a photo host. */
    private const MAX_MOMENTS_PER_SESSION = 4;

    /**
     * GET /users/{username}/journal
     *
     * The whole journal for one player: sessions, the derived calendar and
     * totals, the completed timeline and their published reviews.
     */
    public function index(string $username, Request $request, JournalService $journal): JsonResponse
    {
        $user = User::where('username', $username)->firstOrFail();

        if ($this->profileHidden($user)) {
            return $this->error('This profile is private.', 403);
        }

        $isOwner = $this->viewer()?->id === $user->id;

        $sessions = PlaySession::where('user_id', $user->id)
            ->when(! $isOwner, fn ($q) => $q->where('is_private', false))
            ->with(['game:id,slug,name,cover_url', 'moments'])
            ->orderByDesc('played_on')
            ->orderByDesc('id')
            ->get();

        $visible = $sessions->take((int) $request->integer('limit', 40) ?: 40);

        return $this->success([
            'sessions' => $visible->map(fn (PlaySession $s) => $this->presentSession($s, $isOwner))->all(),
            'total_sessions' => $sessions->count(),
            // Aggregates read the whole history, not just the page on screen.
            'summary' => $journal->summary($user, $sessions),
            'calendar' => $journal->calendar($sessions),
            'per_game' => $journal->perGame($sessions),
            'completed_timeline' => $journal->completedTimeline($user),
            'reviews' => $journal->reviews($user),
            'moods' => PlaySession::MOODS,
            'is_owner' => $isOwner,
        ]);
    }

    /**
     * POST /journal/sessions
     */
    public function store(Request $request, JournalService $journal, SanitizationService $sanitizer): JsonResponse
    {
        $data = $request->validate($this->rules());

        $game = Game::where('slug', $data['game_slug'])->firstOrFail();
        $user = $request->user();

        $session = PlaySession::create($this->attributes($data, $sanitizer) + [
            'user_id' => $user->id,
            'game_id' => $game->id,
        ]);

        $journal->syncPlaytime($user, $game->id);

        // A quick note is not playtime; a real sitting feeds the clan.
        if ((int) $session->minutes >= (int) config('clan.session_min_minutes', 30)) {
            app(ClanResourceService::class)->award($user, 'session_logged');
        }

        return $this->success($this->presentSession($session->load('game', 'moments'), true), 'Session logged.');
    }

    /**
     * PUT /journal/sessions/{session}
     */
    public function update(Request $request, PlaySession $session, JournalService $journal, SanitizationService $sanitizer): JsonResponse
    {
        if ($session->user_id !== $request->user()->id) {
            return $this->error('Not your session.', 403);
        }

        $data = $request->validate($this->rules(false));
        $session->update($this->attributes($data, $sanitizer));

        $journal->syncPlaytime($request->user(), $session->game_id);

        return $this->success($this->presentSession($session->fresh()->load('game', 'moments'), true), 'Session updated.');
    }

    /**
     * DELETE /journal/sessions/{session}
     */
    public function destroy(Request $request, PlaySession $session, JournalService $journal): JsonResponse
    {
        if ($session->user_id !== $request->user()->id) {
            return $this->error('Not your session.', 403);
        }

        $gameId = $session->game_id;

        // Stored screenshots go with it — an orphaned file is a leak.
        foreach ($session->moments as $moment) {
            if ($moment->path) {
                Storage::disk('public')->delete($moment->path);
            }
        }

        $session->delete();
        $journal->syncPlaytime($request->user(), $gameId);

        return $this->success(null, 'Session deleted.');
    }

    /**
     * POST /journal/sessions/{session}/moments
     *
     * A screenshot is uploaded; a clip is a link to a host we can render.
     * Video is never stored here.
     */
    public function addMoment(Request $request, PlaySession $session, SanitizationService $sanitizer): JsonResponse
    {
        if ($session->user_id !== $request->user()->id) {
            return $this->error('Not your session.', 403);
        }

        if ($session->moments()->count() >= self::MAX_MOMENTS_PER_SESSION) {
            return $this->error('A session can hold '.self::MAX_MOMENTS_PER_SESSION.' moments.', 422);
        }

        $data = $request->validate([
            'type' => 'required|in:screenshot,clip',
            'image' => 'required_if:type,screenshot|image|max:4096',
            'url' => 'required_if:type,clip|url|max:500',
            'caption' => 'nullable|string|max:200',
            'has_spoilers' => 'boolean',
        ]);

        $attributes = [
            'user_id' => $session->user_id,
            'game_id' => $session->game_id,
            'play_session_id' => $session->id,
            'type' => $data['type'],
            'caption' => isset($data['caption']) ? $sanitizer->sanitizePlainText($data['caption']) : null,
            'has_spoilers' => (bool) ($data['has_spoilers'] ?? $session->has_spoilers),
            'is_private' => $session->is_private,
        ];

        if ($data['type'] === 'screenshot') {
            $attributes['path'] = $request->file('image')->store('journal', 'public');
        } else {
            $provider = $this->clipProvider($data['url']);

            if (! $provider) {
                return $this->error('Clips must be a YouTube, Twitch, Streamable or Medal link.', 422);
            }

            $attributes['url'] = $data['url'];
            $attributes['provider'] = $provider;
            $attributes['thumbnail_url'] = $this->clipThumbnail($data['url'], $provider);
        }

        $moment = GamingMoment::create($attributes);

        return $this->success($this->presentMoment($moment), 'Moment added.');
    }

    /**
     * DELETE /journal/moments/{moment}
     */
    public function deleteMoment(Request $request, GamingMoment $moment): JsonResponse
    {
        if ($moment->user_id !== $request->user()->id) {
            return $this->error('Not your moment.', 403);
        }

        if ($moment->path) {
            Storage::disk('public')->delete($moment->path);
        }

        $moment->delete();

        return $this->success(null, 'Moment removed.');
    }

    /* ── helpers ──────────────────────────────────────────────────────── */

    private function rules(bool $creating = true): array
    {
        return [
            'game_slug' => ($creating ? 'required' : 'sometimes').'|string|exists:games,slug',
            'played_on' => ($creating ? 'required' : 'sometimes').'|date|before_or_equal:today',
            // 24h is the ceiling for one sitting; anything longer is two sessions.
            'minutes' => ($creating ? 'required' : 'sometimes').'|integer|min:1|max:1440',
            'platform' => 'nullable|string|max:40',
            'progress_label' => 'nullable|string|max:120',
            'progress_percent' => 'nullable|integer|min:0|max:100',
            'note' => 'nullable|string|max:2000',
            'mood' => 'nullable|string|in:'.implode(',', PlaySession::MOODS),
            'companions' => 'nullable|array|max:8',
            'companions.*' => 'string|max:40',
            'has_spoilers' => 'boolean',
            'is_private' => 'boolean',
        ];
    }

    private function attributes(array $data, SanitizationService $sanitizer): array
    {
        $attributes = collect($data)->except('game_slug')->all();

        foreach (['note', 'progress_label', 'platform'] as $field) {
            if (isset($attributes[$field])) {
                $attributes[$field] = $sanitizer->sanitizePlainText($attributes[$field]);
            }
        }

        if (isset($attributes['companions'])) {
            $attributes['companions'] = array_values(array_filter(array_map(
                fn (string $name) => $sanitizer->sanitizePlainText($name),
                $attributes['companions']
            )));
        }

        return $attributes;
    }

    private function presentSession(PlaySession $session, bool $isOwner): array
    {
        return [
            'id' => $session->id,
            'played_on' => $session->played_on?->toDateString(),
            'minutes' => (int) $session->minutes,
            'platform' => $session->platform,
            'progress_label' => $session->progress_label,
            'progress_percent' => $session->progress_percent,
            'note' => $session->note,
            'mood' => $session->mood,
            'companions' => $session->companions ?? [],
            'has_spoilers' => $session->has_spoilers,
            'is_private' => $session->is_private,
            'can_edit' => $isOwner,
            'game' => $session->game ? [
                'slug' => $session->game->slug,
                'name' => $session->game->name,
                'cover_url' => $session->game->cover_url,
            ] : null,
            'moments' => $session->moments->map(fn (GamingMoment $m) => $this->presentMoment($m))->all(),
        ];
    }

    private function presentMoment(GamingMoment $moment): array
    {
        return [
            'id' => $moment->id,
            'type' => $moment->type,
            'url' => $moment->url,
            'provider' => $moment->provider,
            'thumbnail_url' => $moment->thumbnail_url,
            'path' => $moment->path,
            'caption' => $moment->caption,
            'has_spoilers' => $moment->has_spoilers,
        ];
    }

    private function clipProvider(string $url): ?string
    {
        $host = strtolower((string) parse_url($url, PHP_URL_HOST));
        $host = preg_replace('/^www\./', '', $host);

        return self::CLIP_HOSTS[$host] ?? null;
    }

    /**
     * YouTube exposes a predictable thumbnail; the rest don't, so the card
     * falls back to the game art rather than guessing at a URL.
     */
    private function clipThumbnail(string $url, string $provider): ?string
    {
        if ($provider !== 'youtube') {
            return null;
        }

        $host = strtolower((string) parse_url($url, PHP_URL_HOST));

        if (str_contains($host, 'youtu.be')) {
            $id = trim((string) parse_url($url, PHP_URL_PATH), '/');
        } else {
            parse_str((string) parse_url($url, PHP_URL_QUERY), $query);
            $id = $query['v'] ?? null;
        }

        return $id ? "https://img.youtube.com/vi/{$id}/hqdefault.jpg" : null;
    }
}
