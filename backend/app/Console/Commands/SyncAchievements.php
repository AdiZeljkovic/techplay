<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Services\AchievementService;
use Illuminate\Console\Command;

class SyncAchievements extends Command
{
    protected $signature = 'achievements:sync {--user= : Sync for specific user ID}';

    protected $description = 'Retroactively check and unlock achievements for all users based on their current stats';

    public function handle(AchievementService $achievements): void
    {
        $userId = $this->option('user');

        $users = $userId
            ? User::where('id', $userId)->get()
            : User::all();

        $this->info("Syncing achievements for {$users->count()} user(s)...");

        $totalUnlocked = 0;

        foreach ($users as $user) {
            $unlocked = $achievements->check($user); // checks all criteria types
            $count = count($unlocked);
            $totalUnlocked += $count;

            if ($count > 0) {
                $names = collect($unlocked)->pluck('name')->join(', ');
                $this->line("  - {$user->username}: {$count} unlocked ({$names})");
            }
        }

        $this->info("Done! Total achievements unlocked: {$totalUnlocked}");
    }
}
