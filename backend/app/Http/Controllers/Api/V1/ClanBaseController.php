<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Clan;
use App\Models\ClanBuilding;
use App\Models\ClanLedger;
use App\Models\ClanMember;
use App\Models\ClanPoll;
use App\Models\ClanPollVote;
use App\Models\ClanProject;
use App\Models\ClanTrophy;
use App\Services\ClanBaseService;
use App\Services\ClanBoostService;
use App\Services\ClanDnaService;
use App\Services\ClanLevelService;
use App\Services\ClanMissionService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * The clan base — members only. Reading settles due constructions, so a
 * finished timer becomes a finished building the moment anyone looks.
 */
class ClanBaseController extends Controller
{
    use ApiResponse;

    /**
     * GET /clans/{slug}/base
     */
    public function show(string $slug, Request $request, ClanBaseService $base, ClanLevelService $levels, ClanMissionService $missions, ClanBoostService $boosts): JsonResponse
    {
        $clan = Clan::where('slug', $slug)->firstOrFail();
        $membership = $this->membership($clan, $request);

        if (! $membership) {
            return $this->error('The base is for members only.', 403);
        }

        $overview = $base->overview($clan);
        $clan->refresh();

        // Hourly rates from the last 7 days of the ledger — the honest "/hr".
        $rates = ClanLedger::where('clan_id', $clan->id)
            ->where('amount', '>', 0)
            ->where('created_at', '>=', now()->subDays(7))
            ->selectRaw('resource, SUM(amount) as earned')
            ->groupBy('resource')
            ->pluck('earned', 'resource')
            ->map(fn ($earned) => round((int) $earned / (7 * 24), 1));

        // Member contributions off the ledger: week / season(month) / all.
        $contributions = collect(['week' => 7, 'month' => 30, 'all' => null])
            ->map(function (?int $days) use ($clan) {
                return ClanLedger::where('clan_id', $clan->id)
                    ->whereNotNull('user_id')
                    ->where('amount', '>', 0)
                    ->when($days, fn ($q) => $q->where('clan_ledger.created_at', '>=', now()->subDays($days)))
                    ->join('users', 'users.id', '=', 'clan_ledger.user_id')
                    ->selectRaw('users.username, users.avatar_url, SUM(clan_ledger.amount) as total')
                    ->groupBy('users.username', 'users.avatar_url')
                    ->orderByDesc('total')
                    ->limit(8)
                    ->get()
                    ->map(fn ($row) => [
                        'username' => $row->username,
                        'avatar_url' => $row->avatar_url,
                        'total' => (int) $row->total,
                    ]);
            });

        return $this->success([
            'clan' => [
                'name' => $clan->name,
                'slug' => $clan->slug,
                'tag' => $clan->tag,
                'motto' => $clan->motto,
                'logo' => $clan->logo,
                'region' => $clan->region,
                'level' => (int) $clan->level,
                'progress' => $levels->progress((int) $clan->xp),
                'member_limit' => $clan->effectiveMemberLimit(),
                'members_count' => $clan->members()->count(),
            ],
            'resources' => [
                'intel' => (int) $clan->intel,
                'materials' => (int) $clan->materials,
                'prestige' => (int) $clan->prestige,
                'prestige_lifetime' => (int) $clan->prestige_lifetime,
                'rates' => $rates,
                'capacity' => (int) config('clan.vault_capacity_base', 10000)
                    + (int) ($base->levels($clan)['vault'] ?? 0) * (int) config('clan.vault_capacity_per_level', 10000),
            ],
            'base' => $overview,
            'missions' => $missions->activeFor($clan),
            'boosts' => $boosts->panel($clan),
            'dna' => ($base->levels($clan)['archive'] ?? 0) >= 1
                ? app(ClanDnaService::class)->build($clan)
                : null,
            'themes' => $this->themesPanel($clan, (int) ($base->levels($clan)['workshop'] ?? 0)),
            'polls' => $this->pollsPanel($clan, $request, (int) ($base->levels($clan)['communications_hub'] ?? 0)),
            'trophies' => ClanTrophy::where('clan_id', $clan->id)->orderByDesc('awarded_at')->limit(12)
                ->get(['id', 'key', 'title', 'description', 'awarded_at']),
            'contributions' => $contributions,
            'recent_activity' => $clan->activities()->with('user:id,username,avatar_url')->latest()->limit(10)->get(),
            'viewer_role' => $membership->role,
            'can_manage' => $membership->isOfficerOrAbove(),
        ]);
    }

    /**
     * POST /clans/{slug}/base/projects  { building: key }
     */
    public function startProject(string $slug, Request $request, ClanBaseService $base): JsonResponse
    {
        $clan = Clan::where('slug', $slug)->firstOrFail();
        $membership = $this->membership($clan, $request);

        if (! $membership?->isOfficerOrAbove()) {
            return $this->error('Only officers can start construction.', 403);
        }

        $data = $request->validate(['building' => 'required|string']);

        try {
            $project = $base->startProject($clan, $request->user(), $data['building']);
        } catch (\RuntimeException $e) {
            return $this->error($e->getMessage(), 422);
        }

        return $this->success($base->presentProject($project), 'Project started.');
    }

    /**
     * POST /clans/{slug}/base/projects/{project}/fund  { intel, materials }
     */
    public function fund(string $slug, ClanProject $project, Request $request, ClanBaseService $base): JsonResponse
    {
        $clan = Clan::where('slug', $slug)->firstOrFail();
        $membership = $this->membership($clan, $request);

        if (! $membership?->isOfficerOrAbove() || $project->clan_id !== $clan->id) {
            return $this->error('Only officers can move the treasury.', 403);
        }

        $data = $request->validate([
            'intel' => 'nullable|integer|min:0',
            'materials' => 'nullable|integer|min:0',
        ]);

        try {
            $project = $base->fund($project, $request->user(), (int) ($data['intel'] ?? 0), (int) ($data['materials'] ?? 0));
        } catch (\RuntimeException $e) {
            return $this->error($e->getMessage(), 422);
        }

        return $this->success($base->presentProject($project), 'Funded.');
    }

    /**
     * POST /clans/{slug}/base/projects/{project}/speed-up
     */
    public function speedUp(string $slug, ClanProject $project, Request $request, ClanBaseService $base): JsonResponse
    {
        $clan = Clan::where('slug', $slug)->firstOrFail();
        $membership = $this->membership($clan, $request);

        if (! $membership?->isOfficerOrAbove() || $project->clan_id !== $clan->id) {
            return $this->error('Only officers can spend Prestige.', 403);
        }

        try {
            $project = $base->speedUp($project, $request->user());
        } catch (\RuntimeException $e) {
            return $this->error($e->getMessage(), 422);
        }

        return $this->success($base->presentProject($project), 'Construction completed.');
    }

    /**
     * DELETE /clans/{slug}/base/projects/{project}
     */
    public function cancel(string $slug, ClanProject $project, Request $request, ClanBaseService $base): JsonResponse
    {
        $clan = Clan::where('slug', $slug)->firstOrFail();
        $membership = $this->membership($clan, $request);

        if (! $membership?->isOfficerOrAbove() || $project->clan_id !== $clan->id) {
            return $this->error('Only officers can cancel a project.', 403);
        }

        try {
            $base->cancel($project, $request->user());
        } catch (\RuntimeException $e) {
            return $this->error($e->getMessage(), 422);
        }

        return $this->success(null, 'Project cancelled — funds returned to the treasury.');
    }

    /**
     * POST /clans/{slug}/base/boosts  { key }
     */
    public function activateBoost(string $slug, Request $request, ClanBoostService $boosts): JsonResponse
    {
        $clan = Clan::where('slug', $slug)->firstOrFail();
        $membership = $this->membership($clan, $request);

        if (! $membership?->isOfficerOrAbove()) {
            return $this->error('Only officers can activate boosters.', 403);
        }

        $data = $request->validate(['key' => 'required|string']);

        try {
            $boost = $boosts->activate($clan, $request->user(), $data['key']);
        } catch (\RuntimeException $e) {
            return $this->error($e->getMessage(), 422);
        }

        return $this->success([
            'key' => $boost->key,
            'ends_at' => $boost->ends_at->toIso8601String(),
        ], 'Booster activated.');
    }

    /**
     * POST /clans/{slug}/base/theme  { key } — equip a Workshop theme.
     */
    public function equipTheme(string $slug, Request $request): JsonResponse
    {
        $clan = Clan::where('slug', $slug)->firstOrFail();
        $membership = $this->membership($clan, $request);

        if (! $membership?->isOfficerOrAbove()) {
            return $this->error('Only officers can change the theme.', 403);
        }

        $data = $request->validate(['key' => 'nullable|string']);
        $key = $data['key'] ?? null;

        if ($key !== null) {
            $def = config("clan.themes.{$key}");

            if (! $def) {
                return $this->error('Unknown theme.', 422);
            }

            $workshop = (int) (ClanBuilding::levelsFor($clan->id)['workshop'] ?? 0);

            if ($workshop < (int) $def['requires_workshop'] || (int) $clan->prestige_lifetime < (int) $def['requires_prestige']) {
                return $this->error('This theme is not unlocked yet.', 422);
            }
        }

        $clan->update(['equipped_theme' => $key]);

        return $this->success(['equipped_theme' => $key], $key ? 'Theme equipped.' : 'Theme cleared.');
    }

    /**
     * POST /clans/{slug}/base/polls  { question, options[], days }
     */
    public function createPoll(string $slug, Request $request): JsonResponse
    {
        $clan = Clan::where('slug', $slug)->firstOrFail();
        $membership = $this->membership($clan, $request);

        if (! $membership?->isOfficerOrAbove()) {
            return $this->error('Only officers can open a poll.', 403);
        }

        if ((int) (ClanBuilding::levelsFor($clan->id)['communications_hub'] ?? 0) < 1) {
            return $this->error('Build the Communications Hub to open polls.', 422);
        }

        $data = $request->validate([
            'question' => 'required|string|max:200',
            'options' => 'required|array|min:2|max:5',
            'options.*' => 'string|max:80',
            'days' => 'nullable|integer|min:1|max:14',
        ]);

        $poll = ClanPoll::create([
            'clan_id' => $clan->id,
            'question' => $data['question'],
            'options' => array_values($data['options']),
            'ends_at' => now()->addDays((int) ($data['days'] ?? 3)),
            'created_by' => $request->user()->id,
        ]);

        return $this->success(['id' => $poll->id], 'Poll opened.');
    }

    /**
     * POST /clans/polls/{poll}/vote  { option } — one vote, changeable.
     */
    public function vote(ClanPoll $poll, Request $request): JsonResponse
    {
        $membership = $this->membership($poll->clan, $request);

        if (! $membership) {
            return $this->error('Members only.', 403);
        }

        if ($poll->ends_at->isPast()) {
            return $this->error('This poll has closed.', 422);
        }

        $data = $request->validate(['option' => 'required|integer|min:0']);

        if ($data['option'] >= count($poll->options)) {
            return $this->error('No such option.', 422);
        }

        ClanPollVote::updateOrCreate(
            ['clan_poll_id' => $poll->id, 'user_id' => $request->user()->id],
            ['option' => (int) $data['option']],
        );

        return $this->success(null, 'Vote counted.');
    }

    private function themesPanel(Clan $clan, int $workshop): array
    {
        return [
            'equipped' => $clan->equipped_theme,
            'catalog' => collect(config('clan.themes'))->map(fn (array $def, string $key) => [
                'key' => $key,
                'name' => $def['name'],
                'value' => $def['value'],
                'requires_workshop' => (int) $def['requires_workshop'],
                'requires_prestige' => (int) $def['requires_prestige'],
                'unlocked' => $workshop >= (int) $def['requires_workshop']
                    && (int) $clan->prestige_lifetime >= (int) $def['requires_prestige'],
            ])->values()->all(),
            'workshop_level' => $workshop,
        ];
    }

    private function pollsPanel(Clan $clan, Request $request, int $comms): array
    {
        $polls = ClanPoll::where('clan_id', $clan->id)
            ->where('ends_at', '>', now()->subDays(7))
            ->withCount('votes')
            ->orderByDesc('ends_at')
            ->limit(3)
            ->get();

        $myVotes = ClanPollVote::whereIn('clan_poll_id', $polls->pluck('id'))
            ->where('user_id', $request->user()->id)
            ->pluck('option', 'clan_poll_id');

        return [
            'enabled' => $comms >= 1,
            'items' => $polls->map(function (ClanPoll $poll) use ($myVotes) {
                $tally = ClanPollVote::where('clan_poll_id', $poll->id)
                    ->selectRaw('option, COUNT(*) as votes')
                    ->groupBy('option')
                    ->pluck('votes', 'option');

                $total = max(1, (int) $tally->sum());

                return [
                    'id' => $poll->id,
                    'question' => $poll->question,
                    'ends_at' => $poll->ends_at->toIso8601String(),
                    'closed' => $poll->ends_at->isPast(),
                    'total_votes' => (int) $tally->sum(),
                    'my_vote' => $myVotes->has($poll->id) ? (int) $myVotes[$poll->id] : null,
                    'options' => collect($poll->options)->map(fn (string $label, int $i) => [
                        'label' => $label,
                        'votes' => (int) ($tally[$i] ?? 0),
                        'percent' => (int) round((int) ($tally[$i] ?? 0) / $total * 100),
                    ])->values()->all(),
                ];
            })->values()->all(),
        ];
    }

    private function membership(Clan $clan, Request $request): ?ClanMember
    {
        $user = $request->user();

        return $user
            ? ClanMember::where('clan_id', $clan->id)->where('user_id', $user->id)->first()
            : null;
    }
}
