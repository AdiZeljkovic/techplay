<?php

namespace App\Console\Commands;

use App\Models\Customization;
use App\Models\Quest;
use App\Models\QuestProgress;
use App\Models\Season;
use App\Models\UserCustomization;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * Concludes the active season once its end date has passed:
 * - awards an exclusive season badge to everyone who completed ALL of the
 *   season's quests (deterministic and fair — no leaderboard cutoffs)
 * - deactivates the season (and its quests via the season_id filter)
 *
 * Scheduled daily; exits quietly while the season is still running.
 * Use --force to conclude regardless of the end date.
 */
class ConcludeSeason extends Command
{
    protected $signature = 'season:conclude {--force : Conclude even if the season has not ended yet}';

    protected $description = 'Award season rewards and deactivate the finished season';

    public function handle(): int
    {
        // Not active(): that now excludes a season whose end date has passed,
        // which is exactly the season this command is here to close.
        $season = Season::flaggedActive();

        if (! $season) {
            $this->info('No active season.');

            return self::SUCCESS;
        }

        if (! $this->option('force') && $season->end_date?->isFuture()) {
            $this->info("Season '{$season->name}' still running (ends {$season->end_date->toDateString()}).");

            return self::SUCCESS;
        }

        $questIds = Quest::where('season_id', $season->id)->pluck('id');

        if ($questIds->isEmpty()) {
            $this->warn('Season has no quests — deactivating without rewards.');
        } else {
            // Users who completed EVERY seasonal quest
            $championIds = QuestProgress::whereIn('quest_id', $questIds)
                ->whereNotNull('completed_at')
                ->selectRaw('user_id, COUNT(DISTINCT quest_id) as done')
                ->groupBy('user_id')
                ->havingRaw('COUNT(DISTINCT quest_id) = ?', [$questIds->count()])
                ->pluck('user_id');

            $badge = Customization::firstOrCreate(
                ['slug' => 'season-'.Str::slug($season->slug ?: $season->name).'-champion'],
                [
                    'name' => "{$season->name} Champion",
                    'type' => 'badge',
                    'value' => '#FBBF24',
                    'cost' => 0,
                    'is_active' => true,
                    'description' => "Completed every quest of {$season->name}.",
                ],
            );

            $awarded = 0;
            foreach ($championIds as $userId) {
                $created = UserCustomization::firstOrCreate(
                    ['user_id' => $userId, 'customization_id' => $badge->id],
                    ['acquired_via' => 'season'],
                );
                if ($created->wasRecentlyCreated) {
                    $awarded++;
                }
            }

            $this->info("Awarded '{$badge->name}' badge to {$awarded} champions.");
        }

        $season->update(['is_active' => false]);
        Cache::forget('season.multipliers.v1');
        Cache::forget('season.active_id.v1');

        $this->info("Season '{$season->name}' concluded. ✓");

        // Concluding is half the job. Nothing here starts the next season, and
        // for a long while nothing anywhere could — so the site would simply
        // stop having one: no seasonal quests, multipliers back to 1.0, and no
        // error to notice. Seasons are editable in the admin panel now, but the
        // gap still has to announce itself.
        $successor = Season::where('start_date', '>', $season->end_date)->exists();

        if (! $successor) {
            $message = "No season follows '{$season->name}'. Seasonal quests and XP/bounty multipliers are inactive until one is created in the admin panel.";

            $this->warn($message);
            Log::warning("season:conclude — {$message}");
        }

        return self::SUCCESS;
    }
}
