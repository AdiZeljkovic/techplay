<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Services\Chronicle\ChronicleBuilder;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Rebuilds chronicles: all of them, one user, or just the users whose
 * signals moved since their last build (the nightly mode). Also the
 * deploy-day bootstrap — and the escape hatch when the builder's weights
 * change and VERSION bumps.
 */
class RebuildChronicles extends Command
{
    protected $signature = 'chronicle:rebuild
        {--all : Every user}
        {--user= : One user id or username}
        {--stale : Users with activity since their last build (nightly mode)}';

    protected $description = 'Rebuild user chronicles from the tables the site already keeps';

    public function handle(ChronicleBuilder $builder): int
    {
        $users = match (true) {
            (bool) $this->option('user') => User::where('id', $this->option('user'))
                ->orWhere('username', $this->option('user')),
            (bool) $this->option('stale') => $this->stale(),
            default => User::query(),
        };

        $total = $users->count();
        $bar = $this->output->createProgressBar($total);
        $built = 0;
        $failed = [];

        foreach ($users->cursor() as $user) {
            try {
                $builder->build($user);
                $built++;
            } catch (\Throwable $e) {
                // One unbuildable user used to abort the whole run, so everyone
                // after them was never rebuilt — and the same user poisoned it
                // again the next night, forever, silently.
                $failed[] = $user->id;
                Log::warning('Chronicle build failed', ['user_id' => $user->id, 'error' => $e->getMessage()]);
            }
            $bar->advance();
        }

        $bar->finish();
        $this->newLine();

        $this->info('Chronicle izgrađen za '.number_format($built).' korisnika.');

        if ($failed !== []) {
            // A non-zero exit so the scheduler's failure hook can see it.
            $this->error(count($failed).' korisnika nije uspjelo: '.implode(', ', array_slice($failed, 0, 20)));

            return self::FAILURE;
        }

        return self::SUCCESS;
    }

    /** Users whose collection, ratings or sessions moved after their last build. */
    private function stale()
    {
        $built = DB::table('user_chronicles')->pluck('built_at', 'user_id');

        // Ask each source once for everyone who moved, instead of five queries
        // per user. At twenty thousand users the old shape was a hundred
        // thousand round trips before a single chronicle was built.
        $moved = collect();
        foreach (['user_games', 'game_ratings', 'play_sessions', 'article_reads', 'player_signals'] as $table) {
            $column = $table === 'player_signals' ? 'day' : 'updated_at';
            $moved = $moved->merge(
                DB::table($table)
                    ->select('user_id', DB::raw("MAX({$column}) as moved_at"))
                    ->groupBy('user_id')
                    ->pluck('moved_at', 'user_id')
            );
        }

        $staleIds = [];
        foreach ($moved as $userId => $movedAt) {
            $lastBuild = $built[$userId] ?? null;
            if (! $lastBuild || $movedAt > $lastBuild) {
                $staleIds[] = $userId;
            }
        }

        // Anyone who has never been built at all.
        $neverBuilt = User::whereNotIn('id', $built->keys())->pluck('id')->all();

        return User::whereIn('id', array_unique(array_merge($staleIds, $neverBuilt)));
    }
}
