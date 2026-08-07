<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Services\Chronicle\ChronicleBuilder;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

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
                ->orWhere('username', $this->option('user'))->get(),
            (bool) $this->option('stale') => $this->stale(),
            default => User::query()->get(),
        };

        $bar = $this->output->createProgressBar($users->count());
        foreach ($users as $user) {
            $builder->build($user);
            $bar->advance();
        }
        $bar->finish();
        $this->newLine();

        $this->info('Chronicle izgrađen za '.number_format($users->count()).' korisnika.');

        return self::SUCCESS;
    }

    /** Users whose collection, ratings or sessions moved after their last build. */
    private function stale()
    {
        $built = DB::table('user_chronicles')->pluck('built_at', 'user_id');

        return User::query()->get()->filter(function (User $user) use ($built) {
            $lastBuild = $built[$user->id] ?? null;
            if (! $lastBuild) {
                return true;
            }

            foreach (['user_games', 'game_ratings', 'play_sessions', 'article_reads', 'player_signals'] as $table) {
                $column = $table === 'player_signals' ? 'day' : 'updated_at';
                if (DB::table($table)->where('user_id', $user->id)->where($column, '>', $lastBuild)->exists()) {
                    return true;
                }
            }

            return false;
        });
    }
}
