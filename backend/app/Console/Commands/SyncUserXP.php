<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;

class SyncUserXP extends Command
{
    protected $signature = 'xp:sync {--user= : Sync for specific user ID}';
    protected $description = 'Retroactively calculate and sync XP for all users based on their activity';

    // XP values per action
    const XP_PER_POST = 20;
    const XP_PER_THREAD = 50;
    const XP_PER_COMMENT = 10;

    public function handle()
    {
        $userId = $this->option('user');

        $users = $userId
            ? User::where('id', $userId)->get()
            : User::all();

        $this->info("Syncing XP for {$users->count()} user(s)...");

        foreach ($users as $user) {
            $postCount = $user->posts()->count();
            $threadCount = $user->threads()->count();
            $commentCount = $user->comments()->where('status', 'approved')->count();

            $calculatedXP =
                ($postCount * self::XP_PER_POST) +
                ($threadCount * self::XP_PER_THREAD) +
                ($commentCount * self::XP_PER_COMMENT);

            $oldXP = $user->xp ?? 0;

            // Only update if calculated is higher (don't take away XP)
            if ($calculatedXP > $oldXP) {
                $user->update(['xp' => $calculatedXP]);
                $gained = $calculatedXP - $oldXP;
                $this->line("  - {$user->username}: {$oldXP} -> {$calculatedXP} XP (+{$gained})");
            }

            // Update rank based on new XP
            $newRank = \App\Models\Rank::where('min_xp', '<=', $user->xp)
                ->orderBy('min_xp', 'desc')
                ->first();

            if ($newRank && $user->rank_id !== $newRank->id) {
                $user->update(['rank_id' => $newRank->id]);
                $this->line("    ^ Rank updated to: {$newRank->name}");
            }
        }

        $this->info("Done!");
    }
}
