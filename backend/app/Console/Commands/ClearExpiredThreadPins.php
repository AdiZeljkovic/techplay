<?php

namespace App\Console\Commands;

use App\Models\Thread;
use App\Support\ForumCache;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;

/**
 * Clear Expired Self-Pins
 *
 * Bounty-funded self-pins (ForumController::selfPinThread) only last 24h.
 * Runs hourly to unpin threads once their pinned_until has passed.
 */
class ClearExpiredThreadPins extends Command
{
    protected $signature = 'forum:clear-expired-pins';

    protected $description = 'Unpin forum threads whose bounty-funded self-pin has expired';

    public function handle(): int
    {
        $expired = Thread::whereNotNull('pinned_until')
            ->where('pinned_until', '<=', now())
            ->with('category:id,slug')
            ->get(['id', 'slug', 'category_id']);

        if ($expired->isEmpty()) {
            $this->info('No expired self-pins.');

            return Command::SUCCESS;
        }

        foreach ($expired as $thread) {
            $thread->update(['is_pinned' => false, 'pinned_until' => null]);
            Cache::forget("forum.thread.{$thread->slug}");

            if ($thread->category) {
                for ($page = 1; $page <= 20; $page++) {
                    Cache::forget("forum.category.{$thread->category->slug}.page_{$page}");
                }
            }
        }

        ForumCache::forgetShared();

        $this->info("Unpinned {$expired->count()} expired thread(s).");

        return Command::SUCCESS;
    }
}
