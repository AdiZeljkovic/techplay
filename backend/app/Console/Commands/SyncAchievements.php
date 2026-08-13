<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Services\AchievementService;
use Illuminate\Console\Command;

/**
 * The safety net under the achievement system.
 *
 * Most achievements are granted the moment they come true, by whichever
 * controller caused it. A dozen have no such moment — being an early adopter,
 * supporting the site for a year, collecting upvotes on a thread someone else
 * reads — and before this ran on a schedule they could only be handed out by
 * someone remembering to type this command. "Early Adopter" sat at 1/1, earned
 * and ungranted, on the founder's own profile.
 *
 * Nightly, so the untriggered dozen arrive within a day, and so anything a
 * failed inline check dropped gets picked up on the next pass.
 */
class SyncAchievements extends Command
{
    protected $signature = 'achievements:sync {--user= : Sync for specific user ID}';

    protected $description = 'Retroactively check and unlock achievements for all users based on their current stats';

    public function handle(AchievementService $achievements): int
    {
        $userId = $this->option('user');

        $query = $userId ? User::whereKey($userId) : User::query();
        $total = (clone $query)->count();

        $this->info("Syncing achievements for {$total} user(s)…");

        $unlockedTotal = 0;
        $seen = 0;

        // chunkById, not all(): this used to hold every user in memory at once,
        // which is fine at a few hundred and not fine later.
        $query->chunkById(200, function ($users) use ($achievements, &$unlockedTotal, &$seen) {
            foreach ($users as $user) {
                $seen++;

                // One user's bad row must not end the sweep for everyone after
                // them — the whole point of the nightly pass is that it
                // finishes.
                try {
                    $unlocked = $achievements->check($user);
                } catch (\Throwable $e) {
                    $this->warn("  ! {$user->username}: {$e->getMessage()}");

                    continue;
                }

                if ($unlocked !== []) {
                    $unlockedTotal += count($unlocked);
                    $names = collect($unlocked)->pluck('name')->join(', ');
                    $this->line("  - {$user->username}: ".count($unlocked)." unlocked ({$names})");
                }
            }
        });

        $this->info("Done — {$seen} checked, {$unlockedTotal} unlocked. ✓");

        return self::SUCCESS;
    }
}
