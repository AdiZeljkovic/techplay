<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Clan;
use App\Models\ClanLedger;
use App\Models\ClanMember;
use App\Models\ClanProject;
use App\Services\ClanBaseService;
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
    public function show(string $slug, Request $request, ClanBaseService $base, ClanLevelService $levels, ClanMissionService $missions): JsonResponse
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

    private function membership(Clan $clan, Request $request): ?ClanMember
    {
        $user = $request->user();

        return $user
            ? ClanMember::where('clan_id', $clan->id)->where('user_id', $user->id)->first()
            : null;
    }
}
