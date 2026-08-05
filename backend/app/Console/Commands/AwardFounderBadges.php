<?php

namespace App\Console\Commands;

use App\Models\Customization;
use App\Models\User;
use App\Models\UserCustomization;
use App\Notifications\FounderBadgeNotification;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 * "Founding gamers" seed campaign: awards the exclusive Founder badge to the
 * first N users who built a real profile (>= 5 games in their collection),
 * ordered by when they qualified (created_at of their 5th game). Award-only
 * badge — hidden from the store, granted only here. Safe to re-run daily
 * during the campaign; already-awarded users are skipped.
 */
class AwardFounderBadges extends Command
{
    protected $signature = 'campaign:founders
        {--limit=50 : Total number of Founder badges the campaign allows}
        {--min-games=5 : Games required in the collection to qualify}
        {--dry-run : List who would be awarded without writing anything}';

    protected $description = 'Award the exclusive Founder badge to the first N users with a full profile';

    public function handle(): int
    {
        $limit = max(1, (int) $this->option('limit'));
        $minGames = max(1, (int) $this->option('min-games'));

        $badge = Customization::updateOrCreate(
            ['slug' => 'founder'],
            [
                'name' => 'Founder',
                'type' => 'badge',
                'cost' => 0,
                'value' => '#DC143C',
                'is_active' => true,
                'description' => 'One of the first fully-built gamer profiles on TechPlay.',
                'sort_order' => 0,
            ],
        );

        $alreadyAwarded = UserCustomization::where('customization_id', $badge->id)->pluck('user_id');
        $slotsLeft = $limit - $alreadyAwarded->count();

        if ($slotsLeft <= 0) {
            $this->info("All {$limit} Founder badges have been awarded. Campaign complete.");

            return self::SUCCESS;
        }

        // Qualified = >= min-games games; qualified_at = created_at of the Nth game
        $qualified = DB::select(
            "SELECT user_id, (ARRAY_AGG(created_at ORDER BY created_at))[{$minGames}] AS qualified_at
             FROM user_games
             GROUP BY user_id
             HAVING COUNT(*) >= ?
             ORDER BY qualified_at ASC",
            [$minGames]
        );

        $winners = collect($qualified)
            ->reject(fn ($row) => $alreadyAwarded->contains($row->user_id))
            ->take($slotsLeft);

        if ($winners->isEmpty()) {
            $this->info("No new qualifying users ({$minGames}+ games). {$slotsLeft} badges still available.");

            return self::SUCCESS;
        }

        $users = User::whereIn('id', $winners->pluck('user_id'))->get()->keyBy('id');

        foreach ($winners as $row) {
            $user = $users->get($row->user_id);
            if (! $user) {
                continue;
            }

            if ($this->option('dry-run')) {
                $this->line("[dry-run] Would award Founder to {$user->username} (qualified {$row->qualified_at})");

                continue;
            }

            UserCustomization::firstOrCreate(
                ['user_id' => $user->id, 'customization_id' => $badge->id],
                ['acquired_via' => 'campaign'],
            );

            try {
                $user->notify(new FounderBadgeNotification($badge->name));
            } catch (\Throwable) {
                // Notification failure must not block the award loop
            }

            $this->line("Awarded Founder to {$user->username} (qualified {$row->qualified_at})");
        }

        $mode = $this->option('dry-run') ? 'would be awarded' : 'awarded';
        $this->info("{$winners->count()} Founder badges {$mode}. ".($slotsLeft - $winners->count())." of {$limit} remaining.");

        return self::SUCCESS;
    }
}
