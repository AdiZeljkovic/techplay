<?php

namespace App\Console\Commands;

use App\Models\Clan;
use App\Models\ClanActivity;
use App\Models\ClanLedger;
use App\Models\ClanTrophy;
use App\Models\Season;
use App\Services\ClanResourceService;
use Illuminate\Console\Command;

/**
 * When a season ends, the clans that carried it get their trophies — the
 * permanent record the Trophy Hall shows. Idempotent per season: the unique
 * (clan, key, season) index makes a re-run a no-op.
 *
 * Scheduled daily; settles any season that has ended and was never settled.
 * Season score = everything the clan EARNED inside the season window, read
 * off the ledger — not the balance, which spending would punish.
 */
class SettleClanSeason extends Command
{
    protected $signature = 'clans:settle-season {--season= : Season id to settle (defaults to any ended, unsettled season)}';

    protected $description = 'Award season trophies and Prestige to the top clans of an ended season';

    public function handle(ClanResourceService $resources): int
    {
        $season = $this->option('season')
            ? Season::findOrFail((int) $this->option('season'))
            : Season::whereNotNull('end_date')
                ->where('end_date', '<', now()->startOfDay())
                ->whereDoesntHave('clanTrophies')
                ->orderByDesc('end_date')
                ->first();

        if (! $season) {
            $this->info('Nothing to settle.');

            return self::SUCCESS;
        }

        if (ClanTrophy::where('season_id', $season->id)->exists()) {
            $this->info("Season '{$season->name}' is already settled.");

            return self::SUCCESS;
        }

        $start = $season->start_date?->startOfDay() ?? now()->subMonths(3);
        $end = $season->end_date->endOfDay();

        // Season score per clan: positive ledger inside the window.
        $scores = ClanLedger::whereBetween('created_at', [$start, $end])
            ->where('amount', '>', 0)
            ->selectRaw('clan_id, SUM(amount) as score')
            ->groupBy('clan_id')
            ->orderByDesc('score')
            ->pluck('score', 'clan_id');

        if ($scores->isEmpty()) {
            $this->info('No clan earned anything this season.');

            return self::SUCCESS;
        }

        $overallRewards = (array) config('clan.season_rewards.overall', [1000, 600, 300]);
        $medals = ['Champions', 'Runners-up', 'Third place'];
        $awarded = 0;

        foreach (array_slice($scores->keys()->all(), 0, 3) as $index => $clanId) {
            $clan = Clan::find($clanId);

            if (! $clan) {
                continue;
            }

            $this->award(
                $resources,
                $clan,
                $season,
                'season_champion_'.($index + 1),
                "{$season->name} — {$medals[$index]}",
                (int) ($overallRewards[$index] ?? 0),
                ['rank' => $index + 1, 'score' => (int) $scores[$clanId]],
            );
            $awarded++;
        }

        // Best of each size category — small clans compete among their own.
        $small = (int) config('clan.size_categories.small', 15);
        $medium = (int) config('clan.size_categories.medium', 50);
        $categoryReward = (int) config('clan.season_rewards.category', 400);
        $best = [];

        foreach ($scores->keys() as $clanId) {
            $clan = Clan::find($clanId);

            if (! $clan) {
                continue;
            }

            $active = $clan->activeMemberCount();
            $category = $active <= $small ? 'small' : ($active <= $medium ? 'medium' : 'large');

            if (! isset($best[$category])) {
                $best[$category] = $clan;
            }
        }

        foreach ($best as $category => $clan) {
            $this->award(
                $resources,
                $clan,
                $season,
                "season_best_{$category}",
                "{$season->name} — Best ".ucfirst($category).' Clan',
                $categoryReward,
                ['category' => $category, 'score' => (int) $scores[$clan->id]],
            );
            $awarded++;
        }

        $this->info("Settled '{$season->name}' — {$awarded} trophies awarded.");

        return self::SUCCESS;
    }

    private function award(ClanResourceService $resources, Clan $clan, Season $season, string $key, string $title, int $prestige, array $meta): void
    {
        ClanTrophy::firstOrCreate(
            ['clan_id' => $clan->id, 'key' => $key, 'season_id' => $season->id],
            ['title' => $title, 'meta' => $meta, 'awarded_at' => now()],
        );

        if ($prestige > 0) {
            $resources->grant($clan, 'prestige', $prestige, "season_trophy:{$key}");
        }

        ClanActivity::create([
            'clan_id' => $clan->id,
            'user_id' => null,
            'type' => 'trophy_awarded',
            'title' => "Trophy earned: {$title}",
            'meta' => $meta + ['key' => $key],
        ]);
    }
}
