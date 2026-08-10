<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Registrations that were never confirmed.
 *
 * Login refuses an unverified account, so these can do nothing at all — but
 * `unique:users,email` and `unique:users,username` still apply to them. A
 * typo'd address, an abandoned signup or somebody registering an address they
 * do not own takes that address and that name out of circulation permanently,
 * and the rightful owner is told it is already registered.
 *
 * Deliberately conservative. It refuses to touch an account that has done
 * anything at all, because "unverified" is a state some long-standing accounts
 * may be in for reasons that predate verification being enforced — and a
 * cleanup job that deletes a real person's history is worse than the problem it
 * solves.
 */
class PruneUnverifiedUsers extends Command
{
    protected $signature = 'users:prune-unverified
                            {--days=30 : How old an unconfirmed registration must be}
                            {--dry-run : List what would go, delete nothing}';

    protected $description = 'Delete registrations that were never verified and never used';

    public function handle(): int
    {
        $days = max(7, (int) $this->option('days'));
        $cutoff = now()->subDays($days);
        $dryRun = (bool) $this->option('dry-run');

        $candidates = User::query()
            ->whereNull('email_verified_at')
            ->where('created_at', '<', $cutoff)
            // Anything below means somebody was actually here.
            ->where(fn ($q) => $q->whereNull('xp')->orWhere('xp', '<=', 0))
            ->where(fn ($q) => $q->whereNull('bounty_balance')->orWhere('bounty_balance', '<=', 0))
            ->whereNotExists(fn ($q) => $q->select(DB::raw(1))->from('posts')->whereColumn('posts.author_id', 'users.id'))
            ->whereNotExists(fn ($q) => $q->select(DB::raw(1))->from('threads')->whereColumn('threads.author_id', 'users.id'))
            ->whereNotExists(fn ($q) => $q->select(DB::raw(1))->from('comments')->whereColumn('comments.user_id', 'users.id'))
            ->whereNotExists(fn ($q) => $q->select(DB::raw(1))->from('orders')->whereColumn('orders.user_id', 'users.id'))
            ->whereNotExists(fn ($q) => $q->select(DB::raw(1))->from('user_games')->whereColumn('user_games.user_id', 'users.id'))
            // Never linked a platform account either.
            ->whereNull('discord_id');

        $total = (clone $candidates)->count();

        if ($total === 0) {
            $this->info("Nothing to prune: no unverified registrations older than {$days} days without activity.");

            return self::SUCCESS;
        }

        $this->info(($dryRun ? 'Would delete ' : 'Deleting ')
            .number_format($total)." unverified registration(s) older than {$days} days.");

        if ($dryRun) {
            $this->table(
                ['id', 'username', 'email', 'registered'],
                (clone $candidates)->orderBy('id')->limit(25)
                    ->get(['id', 'username', 'email', 'created_at'])
                    ->map(fn (User $u) => [
                        $u->id,
                        $u->username,
                        // Enough to recognise a pattern, not enough to be a
                        // mailing list in the terminal scrollback.
                        preg_replace('/(?<=.).(?=[^@]*@)/', '*', (string) $u->email),
                        $u->created_at?->toDateString(),
                    ])->all()
            );

            if ($total > 25) {
                $this->line('  … and '.number_format($total - 25).' more.');
            }

            return self::SUCCESS;
        }

        $deleted = 0;

        // Chunked by id so the pass is not one enormous transaction, and
        // forceDelete because a soft-deleted row still holds the unique index.
        (clone $candidates)->orderBy('id')->chunkById(500, function ($users) use (&$deleted) {
            foreach ($users as $user) {
                try {
                    $user->tokens()->delete();
                    $user->forceDelete();
                    $deleted++;
                } catch (\Throwable $e) {
                    Log::warning('Could not prune unverified user', [
                        'user_id' => $user->id,
                        'error' => $e->getMessage(),
                    ]);
                }
            }
        });

        Log::info('Pruned unverified registrations', ['deleted' => $deleted, 'older_than_days' => $days]);
        $this->info('Deleted '.number_format($deleted).'.');

        return self::SUCCESS;
    }
}
