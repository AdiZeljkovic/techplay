<?php

namespace App\Console\Commands;

use App\Models\Achievement;
use App\Models\User;
use Illuminate\Console\Command;

class SyncAchievements extends Command
{
    protected $signature = 'achievements:sync {--user= : Sync for specific user ID}';
    protected $description = 'Retroactively sync achievements for all users based on their current stats';

    public function handle()
    {
        $userId = $this->option('user');

        $users = $userId
            ? User::where('id', $userId)->get()
            : User::all();

        $this->info("Syncing achievements for {$users->count()} user(s)...");

        $achievements = Achievement::all()->keyBy('name');
        $totalUnlocked = 0;

        foreach ($users as $user) {
            $unlocked = $this->syncUserAchievements($user, $achievements);
            $totalUnlocked += $unlocked;

            if ($unlocked > 0) {
                $this->line("  - {$user->username}: {$unlocked} achievements unlocked");
            }
        }

        $this->info("Done! Total achievements unlocked: {$totalUnlocked}");
    }

    protected function syncUserAchievements(User $user, $achievements)
    {
        $unlocked = 0;
        $postCount = $user->posts()->count();
        $threadCount = $user->threads()->count();
        $commentCount = $user->comments()->count();
        $reputation = $user->forum_reputation ?? 0;

        // Forum Post Achievements
        if ($postCount >= 1) {
            $unlocked += $this->unlock($user, $achievements->get('First Steps'));
        }
        if ($postCount >= 10) {
            $unlocked += $this->unlock($user, $achievements->get('Active Voice'));
        }
        if ($postCount >= 50) {
            $unlocked += $this->unlock($user, $achievements->get('Prolific Poster'));
        }
        if ($postCount >= 200) {
            $unlocked += $this->unlock($user, $achievements->get('Forum Legend'));
        }

        // Thread Achievements
        if ($threadCount >= 1) {
            $unlocked += $this->unlock($user, $achievements->get('Conversation Starter'));
        }
        if ($threadCount >= 10) {
            $unlocked += $this->unlock($user, $achievements->get('Discussion Leader'));
        }

        // Reputation Achievements
        if ($reputation >= 100) {
            $unlocked += $this->unlock($user, $achievements->get('Rising Star'));
        }
        if ($reputation >= 500) {
            $unlocked += $this->unlock($user, $achievements->get('Community Pillar'));
        }

        return $unlocked;
    }

    protected function unlock(User $user, ?Achievement $achievement): int
    {
        if (!$achievement) {
            return 0;
        }

        if ($user->achievements()->where('achievement_id', $achievement->id)->exists()) {
            return 0;
        }

        $user->achievements()->attach($achievement->id, ['unlocked_at' => now()]);
        return 1;
    }
}
