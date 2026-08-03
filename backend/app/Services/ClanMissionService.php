<?php

namespace App\Services;

use App\Models\Clan;
use App\Models\ClanActivity;
use App\Models\ClanBuilding;
use App\Models\ClanMission;
use App\Models\ClanMissionProgress;
use App\Models\ClanMissionTemplate;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * The mission engine. Templates are authored once in the admin panel;
 * every clan with a Mission Control gets its own instances, with targets
 * scaled to the members who actually play. Progress rides the same events
 * that pay resources — one action, one pipeline, everything moves.
 */
class ClanMissionService
{
    public function __construct(private ClanResourceService $resources) {}

    /* ── spawning ─────────────────────────────────────────────────────── */

    /**
     * Weekly board for every clan that can receive one. Run each Monday;
     * idempotent, because it only fills empty slots.
     */
    public function spawnWeekly(): int
    {
        $spawned = 0;

        Clan::query()->chunkById(100, function ($clans) use (&$spawned) {
            foreach ($clans as $clan) {
                $spawned += $this->spawnForClan($clan);
            }
        });

        return $spawned;
    }

    public function spawnForClan(Clan $clan): int
    {
        $mc = (int) (ClanBuilding::levelsFor($clan->id)['mission_control'] ?? 0);

        if ($mc < 1) {
            return 0;
        }

        $active = ClanMission::where('clan_id', $clan->id)->where('status', 'active')->with('template')->get();
        $slots = $this->weeklySlots($mc);
        $spawned = 0;

        $weeklyRunning = $active->filter(fn ($m) => $m->template && $m->template->type !== 'operation')->count();
        $operationRunning = $active->filter(fn ($m) => $m->template && $m->template->type === 'operation')->count();

        $pool = ClanMissionTemplate::where('is_active', true)
            ->where('min_mission_control', '<=', $mc)
            ->get()
            ->shuffle();

        foreach ($pool as $template) {
            $isOperation = $template->type === 'operation';

            if ($isOperation && ($mc < 3 || $operationRunning >= 1)) {
                continue;
            }

            if (! $isOperation && $weeklyRunning >= $slots) {
                continue;
            }

            // Never two instances of the same template at once.
            if ($active->contains(fn ($m) => $m->template_id === $template->id)) {
                continue;
            }

            $this->instantiate($clan, $template);
            $spawned++;

            $isOperation ? $operationRunning++ : $weeklyRunning++;

            if ($weeklyRunning >= $slots && $operationRunning >= 1) {
                break;
            }
        }

        return $spawned;
    }

    private function instantiate(Clan $clan, ClanMissionTemplate $template): ClanMission
    {
        $mission = ClanMission::create([
            'clan_id' => $clan->id,
            'template_id' => $template->id,
            'target' => $this->scaledTarget($clan, $template),
            'starts_at' => now(),
            'ends_at' => now()->addDays($template->duration_days),
        ]);

        ClanActivity::create([
            'clan_id' => $clan->id,
            'user_id' => null,
            'type' => 'mission_started',
            'title' => ($template->type === 'operation' ? 'Operation' : 'Mission')." briefed: {$template->name}",
            'meta' => ['mission_id' => $mission->id],
        ]);

        return $mission;
    }

    /**
     * target = base × (active / baseline)^0.8 — ten actives play the base
     * number; fifty play ~3.6×, not 5×. Small clans get a real chance.
     */
    public function scaledTarget(Clan $clan, ClanMissionTemplate $template): int
    {
        if (! $template->scales) {
            return $template->base_target;
        }

        $active = max(1, $clan->activeMemberCount());
        $baseline = (int) config('clan.mission_scale_baseline', 10);
        $exponent = (float) config('clan.mission_scale_exponent', 0.8);

        return (int) ceil($template->base_target * max(1, pow($active / $baseline, $exponent)));
    }

    /* ── progress ─────────────────────────────────────────────────────── */

    /**
     * One qualifying action happened. Called from the earn pipeline —
     * fire-and-forget, capped per member per day, and it settles the
     * mission the moment the bar fills.
     */
    public function record(int $clanId, User $user, string $criteriaType): void
    {
        try {
            $missions = ClanMission::where('clan_id', $clanId)
                ->where('status', 'active')
                ->where('ends_at', '>', now())
                ->whereHas('template', fn ($q) => $q->where('criteria_type', $criteriaType))
                ->with('template')
                ->get();

            foreach ($missions as $mission) {
                $this->push($mission, $user);
            }
        } catch (\Throwable $e) {
            Log::warning("ClanMissionService::record failed: {$e->getMessage()}", [
                'clan_id' => $clanId, 'criteria' => $criteriaType,
            ]);
        }
    }

    private function push(ClanMission $mission, User $user): void
    {
        DB::transaction(function () use ($mission, $user) {
            $cap = (int) config('clan.mission_daily_member_cap', 10);

            $row = ClanMissionProgress::lockForUpdate()->firstOrCreate(
                ['clan_mission_id' => $mission->id, 'user_id' => $user->id, 'day' => now()->toDateString()],
                ['amount' => 0]
            );

            if ($row->amount >= $cap) {
                return;
            }

            $row->increment('amount');

            $fresh = ClanMission::whereKey($mission->id)->lockForUpdate()->first();
            $fresh->progress += 1;
            $fresh->save();

            $this->settleStages($fresh);
        });
    }

    /**
     * Apply stage rewards on each crossing, and finish the mission when the
     * bar is full. Squad missions finish on people, not on the bar: N
     * members must each reach the per-head requirement.
     */
    private function settleStages(ClanMission $mission): void
    {
        $template = $mission->template;

        // Operations pay out stage by stage.
        if ($template->type === 'operation' && is_array($template->stages)) {
            foreach ($template->stages as $index => $stage) {
                if ($mission->stage > $index) {
                    continue;
                }
                if ($mission->progress < (int) ($stage['target'] ?? PHP_INT_MAX)) {
                    break;
                }

                $mission->stage = $index + 1;
                $mission->save();
                $this->payout($mission, [
                    'intel' => (int) ($stage['intel'] ?? 0),
                    'materials' => (int) ($stage['materials'] ?? 0),
                    'prestige' => (int) ($stage['prestige'] ?? 0),
                ], "Stage {$mission->stage} of {$template->name}");
            }

            if ($mission->stage >= count($template->stages)) {
                $this->complete($mission);
            }

            return;
        }

        if ($template->type === 'squad') {
            $perHead = max(1, (int) $template->per_member_target);
            $qualified = ClanMissionProgress::where('clan_mission_id', $mission->id)
                ->selectRaw('user_id, SUM(amount) as total')
                ->groupBy('user_id')
                ->havingRaw('SUM(amount) >= ?', [$perHead])
                ->get()
                ->count();

            if ($qualified >= $mission->target) {
                $this->complete($mission);
            }

            return;
        }

        if ($mission->progress >= $mission->target) {
            $this->complete($mission);
        }
    }

    private function complete(ClanMission $mission): void
    {
        if ($mission->status !== 'active') {
            return;
        }

        $template = $mission->template;

        $mission->update(['status' => 'completed', 'completed_at' => now()]);

        $this->payout($mission, [
            'intel' => $template->reward_intel,
            'materials' => $template->reward_materials,
            'prestige' => $template->reward_prestige,
        ], $template->name);

        ClanActivity::create([
            'clan_id' => $mission->clan_id,
            'user_id' => null,
            'type' => 'mission_completed',
            'title' => ($template->type === 'operation' ? 'Operation' : 'Mission')." complete: {$template->name}",
            'meta' => ['mission_id' => $mission->id],
        ]);
    }

    private function payout(ClanMission $mission, array $rewards, string $label): void
    {
        $clan = $mission->clan;

        foreach ($rewards as $resource => $amount) {
            if ($amount > 0) {
                $this->resources->grant($clan, $resource, $amount, "mission_reward:{$label}");
            }
        }
    }

    /* ── reads ────────────────────────────────────────────────────────── */

    /** Expire what ran out; called from the base read, cheap when idle. */
    public function settleExpired(Clan $clan): void
    {
        ClanMission::where('clan_id', $clan->id)
            ->where('status', 'active')
            ->where('ends_at', '<=', now())
            ->update(['status' => 'expired']);
    }

    public function activeFor(Clan $clan): array
    {
        $this->settleExpired($clan);

        return ClanMission::where('clan_id', $clan->id)
            ->whereIn('status', ['active', 'completed'])
            ->where('ends_at', '>', now()->subDays(3)) // keep fresh wins on the board briefly
            ->with('template')
            ->orderByRaw("CASE WHEN status = 'active' THEN 0 ELSE 1 END")
            ->orderBy('ends_at')
            ->get()
            ->map(fn (ClanMission $m) => $this->present($m))
            ->values()
            ->all();
    }

    public function present(ClanMission $mission): array
    {
        $template = $mission->template;

        $top = ClanMissionProgress::where('clan_mission_id', $mission->id)
            ->join('users', 'users.id', '=', 'clan_mission_progress.user_id')
            ->selectRaw('users.username, SUM(clan_mission_progress.amount) as total')
            ->groupBy('users.username')
            ->orderByDesc('total')
            ->limit(3)
            ->get()
            ->map(fn ($r) => ['username' => $r->username, 'amount' => (int) $r->total]);

        $qualified = null;
        if ($template->type === 'squad') {
            $qualified = ClanMissionProgress::where('clan_mission_id', $mission->id)
                ->selectRaw('user_id, SUM(amount) as total')
                ->groupBy('user_id')
                ->havingRaw('SUM(amount) >= ?', [max(1, (int) $template->per_member_target)])
                ->get()
                ->count();
        }

        return [
            'id' => $mission->id,
            'name' => $template->name,
            'description' => $template->description,
            'type' => $template->type,
            'criteria_type' => $template->criteria_type,
            'target' => $mission->target,
            'progress' => $mission->progress,
            'percent' => min(100, (int) round($mission->progress / max(1, $mission->target) * 100)),
            'per_member_target' => $template->per_member_target,
            'qualified_members' => $qualified,
            'stage' => $mission->stage,
            'stages' => $template->type === 'operation' ? ($template->stages ?? []) : null,
            'status' => $mission->status,
            'ends_at' => $mission->ends_at?->toIso8601String(),
            'rewards' => [
                'intel' => $template->reward_intel,
                'materials' => $template->reward_materials,
                'prestige' => $template->reward_prestige,
            ],
            'top_contributors' => $top,
        ];
    }

    private function weeklySlots(int $mc): int
    {
        return 1 + ($mc >= 5 ? 1 : 0) + ($mc >= 10 ? 1 : 0);
    }
}
