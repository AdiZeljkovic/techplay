<?php

namespace App\Services;

use App\Models\Clan;
use App\Models\ClanActivity;
use App\Models\ClanBuilding;
use App\Models\ClanProject;
use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

/**
 * The base: buildings, and the projects that raise them. A project is
 * funded from the treasury, then builds on a timer; completion is applied
 * lazily whenever the base is read, so no scheduler has to be on time for
 * the clan to get its level.
 */
class ClanBaseService
{
    public function __construct(
        private ClanResourceService $resources,
        private ClanLevelService $levels,
    ) {}

    /* ── reads ────────────────────────────────────────────────────────── */

    /** Building levels keyed by building key, missing buildings at 0. */
    public function levels(Clan $clan): array
    {
        $built = ClanBuilding::where('clan_id', $clan->id)->pluck('level', 'key')->all();

        return collect(ClanBuilding::KEYS)
            ->mapWithKeys(fn (string $key) => [$key => (int) ($built[$key] ?? 0)])
            ->all();
    }

    /**
     * The whole base, ready to draw: every building with its level, cost of
     * the next level, what gates it, and what it does now / at the next level.
     */
    public function overview(Clan $clan): array
    {
        $this->settleDueProjects($clan);

        $levels = $this->levels($clan);
        $cc = $levels['command_center'];
        $active = ClanProject::where('clan_id', $clan->id)
            ->whereIn('status', ['funding', 'building'])
            ->get();

        $buildings = collect(config('clan.buildings'))->map(function (array $def, string $key) use ($levels, $cc, $active, $clan) {
            $level = $levels[$key];
            $maxLevel = (int) config('clan.building_max_level', 10);
            $gate = (int) $def['requires_cc'];

            // The Command Center itself is capped by the clan's tier — the
            // base cannot outgrow the clan that runs it.
            $tierCap = $key === 'command_center'
                ? $this->levels->tierForLevel((int) $clan->level)['tier'] * 2
                : $maxLevel;

            $project = $active->firstWhere('building_key', $key);

            return [
                'key' => $key,
                'name' => $def['name'],
                'level' => $level,
                'max_level' => min($maxLevel, $tierCap),
                'locked' => $cc < $gate,
                'requires_cc' => $gate,
                'next_cost' => $level < min($maxLevel, $tierCap) ? $this->cost($key, $level + 1) : null,
                'build_hours' => ($level + 1) * (int) config('clan.build_hours_per_level', 6),
                'effects' => $this->effects($key, $level),
                'next_effects' => $level < min($maxLevel, $tierCap) ? $this->effects($key, $level + 1) : [],
                'project_id' => $project?->id,
            ];
        })->values()->all();

        return [
            'buildings' => $buildings,
            'projects' => $active->map(fn (ClanProject $p) => $this->presentProject($p))->values()->all(),
            'project_slots' => $this->projectSlots($cc),
        ];
    }

    /* ── the lifecycle ────────────────────────────────────────────────── */

    /**
     * Officer starts a project: the next level of one building, if the
     * Command Center allows it and a slot is free.
     */
    public function startProject(Clan $clan, User $user, string $buildingKey): ClanProject
    {
        $def = config("clan.buildings.{$buildingKey}");

        if (! $def) {
            throw new \RuntimeException('Unknown building.');
        }

        $levels = $this->levels($clan);
        $cc = $levels['command_center'];

        if ($cc < (int) $def['requires_cc']) {
            throw new \RuntimeException("Requires Command Center level {$def['requires_cc']}.");
        }

        $target = $levels[$buildingKey] + 1;
        $maxLevel = (int) config('clan.building_max_level', 10);

        if ($buildingKey === 'command_center') {
            $tierCap = $this->levels->tierForLevel((int) $clan->level)['tier'] * 2;
            if ($target > $tierCap) {
                throw new \RuntimeException('The Command Center is capped by your clan tier — level the clan first.');
            }
        }

        if ($target > $maxLevel) {
            throw new \RuntimeException('This building is already at its maximum.');
        }

        $running = ClanProject::where('clan_id', $clan->id)->whereIn('status', ['funding', 'building']);

        if ($running->clone()->where('building_key', $buildingKey)->exists()) {
            throw new \RuntimeException('This building already has a project running.');
        }

        if ($running->count() >= $this->projectSlots($cc)) {
            throw new \RuntimeException('All project slots are busy — finish something first.');
        }

        $cost = $this->cost($buildingKey, $target);

        $project = ClanProject::create([
            'clan_id' => $clan->id,
            'building_key' => $buildingKey,
            'target_level' => $target,
            'cost_intel' => $cost['intel'],
            'cost_materials' => $cost['materials'],
            'started_by' => $user->id,
        ]);

        ClanActivity::create([
            'clan_id' => $clan->id,
            'user_id' => $user->id,
            'type' => 'project_started',
            'title' => "{$user->username} started {$def['name']} → Level {$target}",
            'meta' => ['building' => $buildingKey, 'target' => $target],
        ]);

        return $project;
    }

    /**
     * Move treasury resources into the project. Partial funding is fine —
     * the treasury fills as members play; once both costs are met the
     * timer starts.
     */
    public function fund(ClanProject $project, User $user, int $intel, int $materials): ClanProject
    {
        if ($project->status !== 'funding') {
            throw new \RuntimeException('This project is not taking funds.');
        }

        // Never take more than the project still needs.
        $intel = max(0, min($intel, $project->cost_intel - $project->funded_intel));
        $materials = max(0, min($materials, $project->cost_materials - $project->funded_materials));

        if ($intel === 0 && $materials === 0) {
            throw new \RuntimeException('Nothing left to fund on this project.');
        }

        DB::transaction(function () use ($project, $user, $intel, $materials) {
            $label = config("clan.buildings.{$project->building_key}.name");

            if ($intel > 0) {
                $this->resources->spend($project->clan, 'intel', $intel, "project_funding:{$project->building_key}", $user);
            }
            if ($materials > 0) {
                $this->resources->spend($project->clan, 'materials', $materials, "project_funding:{$project->building_key}", $user);
            }

            $project->funded_intel += $intel;
            $project->funded_materials += $materials;

            if ($project->isFullyFunded()) {
                $project->status = 'building';
                $project->finishes_at = now()->addHours(
                    $project->target_level * (int) config('clan.build_hours_per_level', 6)
                );

                ClanActivity::create([
                    'clan_id' => $project->clan_id,
                    'user_id' => $user->id,
                    'type' => 'construction_started',
                    'title' => "{$label} → Level {$project->target_level} construction has begun",
                ]);
            }

            $project->save();
        });

        return $project->fresh();
    }

    /** Prestige buys the remaining hours. The only Prestige sink in F3. */
    public function speedUp(ClanProject $project, User $user): ClanProject
    {
        if ($project->status !== 'building' || ! $project->finishes_at) {
            throw new \RuntimeException('Nothing is under construction here.');
        }

        $hoursLeft = max(0.1, now()->diffInMinutes($project->finishes_at, false) / 60);
        $cost = max(
            (int) config('clan.speedup_prestige_min', 100),
            (int) ceil($hoursLeft * (int) config('clan.speedup_prestige_per_hour', 30))
        );

        DB::transaction(function () use ($project, $user, $cost) {
            $this->resources->spend($project->clan, 'prestige', $cost, "speedup:{$project->building_key}", $user);
            $project->finishes_at = now();
            $project->save();
        });

        $this->settleDueProjects($project->clan->fresh());

        return $project->fresh();
    }

    public function cancel(ClanProject $project, User $user): void
    {
        if (! in_array($project->status, ['funding', 'building'], true)) {
            throw new \RuntimeException('This project cannot be cancelled.');
        }

        DB::transaction(function () use ($project, $user) {
            // Funds go back to the treasury in full — cancelling is a
            // decision, not a punishment.
            if ($project->funded_intel > 0) {
                $this->resources->grant($project->clan, 'intel', $project->funded_intel, "project_refund:{$project->building_key}", $user);
            }
            if ($project->funded_materials > 0) {
                $this->resources->grant($project->clan, 'materials', $project->funded_materials, "project_refund:{$project->building_key}", $user);
            }

            $project->update(['status' => 'cancelled']);
        });
    }

    /**
     * Apply every construction whose timer has run out. Called on read and
     * cheap when there is nothing to do.
     */
    public function settleDueProjects(Clan $clan): void
    {
        $due = ClanProject::where('clan_id', $clan->id)
            ->where('status', 'building')
            ->where('finishes_at', '<=', now())
            ->get();

        foreach ($due as $project) {
            DB::transaction(function () use ($clan, $project) {
                ClanBuilding::updateOrCreate(
                    ['clan_id' => $clan->id, 'key' => $project->building_key],
                    ['level' => $project->target_level]
                );

                $project->update(['status' => 'done', 'completed_at' => now()]);

                $name = config("clan.buildings.{$project->building_key}.name");

                ClanActivity::create([
                    'clan_id' => $clan->id,
                    'user_id' => null,
                    'type' => 'construction_done',
                    'title' => "{$name} reached Level {$project->target_level}",
                    'meta' => ['building' => $project->building_key, 'level' => $project->target_level],
                ]);
            });

            Cache::forget("clan.buildings.{$clan->id}");
        }
    }

    /* ── numbers ──────────────────────────────────────────────────────── */

    /** @return array{intel:int,materials:int} */
    public function cost(string $buildingKey, int $target): array
    {
        $base = config("clan.buildings.{$buildingKey}.base_cost");
        $exponent = (float) config('clan.cost_exponent', 1.6);
        $round = fn (float $v) => (int) (round($v / 10) * 10);

        return [
            'intel' => $round($base['intel'] * pow($target, $exponent)),
            'materials' => $round($base['materials'] * pow($target, $exponent)),
        ];
    }

    public function projectSlots(int $ccLevel): int
    {
        return 1 + ($ccLevel >= 5 ? 1 : 0) + ($ccLevel >= 8 ? 1 : 0);
    }

    /**
     * What a building does at a level. Effects whose systems land in later
     * phases say so instead of pretending.
     *
     * @return string[]
     */
    private function effects(string $key, int $level): array
    {
        if ($level === 0) {
            return ['Not built yet'];
        }

        return match ($key) {
            'command_center' => array_values(array_filter([
                '+'.($level * (int) config('clan.member_slots_per_cc_level', 10)).' roster slots',
                $this->projectSlots($level).' concurrent project'.($this->projectSlots($level) > 1 ? 's' : ''),
                $level >= 3 ? 'Archive unlocked' : null,
                $level >= 4 ? 'Workshop unlocked' : null,
                $level >= 5 ? 'Communications Hub unlocked' : null,
            ])),
            'vault' => [
                'Resource capacity '.number_format(
                    (int) config('clan.vault_capacity_base', 10000)
                    + $level * (int) config('clan.vault_capacity_per_level', 10000)
                ).' per resource',
            ],
            'training_grounds' => [
                '+'.($level * (int) config('clan.training_xp_percent_per_level', 2)).'% Clan XP from achievements',
            ],
            'mission_control' => ['Clan missions activate in a coming update — higher levels will mean more and bigger missions'],
            'archive' => ['Clan DNA, shared lists and Game of the Month activate in a coming update'],
            'workshop' => ['Clan cosmetics activate in a coming update — level decides what can be earned'],
            'communications_hub' => ['Announcements, polls and event scheduling activate in a coming update'],
            'trophy_hall' => ['Trophies land here as seasons and operations conclude'],
            default => [],
        };
    }

    public function presentProject(ClanProject $project): array
    {
        $name = config("clan.buildings.{$project->building_key}.name");
        $total = max(1, $project->cost_intel + $project->cost_materials);
        $funded = $project->funded_intel + $project->funded_materials;

        return [
            'id' => $project->id,
            'building_key' => $project->building_key,
            'building_name' => $name,
            'target_level' => $project->target_level,
            'status' => $project->status,
            'cost_intel' => $project->cost_intel,
            'cost_materials' => $project->cost_materials,
            'funded_intel' => $project->funded_intel,
            'funded_materials' => $project->funded_materials,
            'funded_percent' => (int) round($funded / $total * 100),
            'finishes_at' => $project->finishes_at?->toIso8601String(),
            'started_by' => $project->starter?->username,
        ];
    }
}
