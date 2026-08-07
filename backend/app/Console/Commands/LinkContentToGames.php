<?php

namespace App\Console\Commands;

use App\Models\Article;
use App\Models\Guide;
use App\Services\ContentGameLinker;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 * The backfill half of the content↔game spine: walks every published
 * article and guide that has no game yet, asks the linker, and reports
 * every decision it makes — because a wrong link ("Control update" → the
 * verb, not the Remedy game) is worse than no link, and the editor should
 * be able to skim what the machine decided.
 *
 * New content links itself at publish time through the observers; this
 * exists for the 485 articles written before the spine did.
 */
class LinkContentToGames extends Command
{
    protected $signature = 'content:link-games
        {--dry-run : Show every proposed link, write nothing}';

    protected $description = 'Link existing articles and guides to catalogue games by review data and headline';

    public function handle(ContentGameLinker $linker): int
    {
        $dry = (bool) $this->option('dry-run');
        $linked = 0;
        $skipped = 0;

        // ── articles (news, reviews, tech — one table) ───────────────────
        Article::query()
            ->whereNull('game_id')
            ->orderBy('id')
            ->chunkById(200, function ($articles) use ($linker, $dry, &$linked, &$skipped) {
                foreach ($articles as $article) {
                    $declared = data_get($article->review_data, 'game_title');
                    $gameId = $linker->match($declared, $article->title, $article->published_at?->year);

                    if (! $gameId) {
                        $skipped++;

                        continue;
                    }

                    $name = DB::table('games')->where('id', $gameId)->value('name');
                    $this->line(sprintf('  %s%s  →  %s',
                        $dry ? '[dry] ' : '', mb_substr($article->title, 0, 70), $name));

                    if (! $dry) {
                        // Quietly — the observers would revalidate 485 pages in
                        // one breath, and the game page cache busts on read.
                        Article::withoutEvents(fn () => $article->forceFill(['game_id' => $gameId])->save());
                    }
                    $linked++;
                }
            });

        // ── guides ───────────────────────────────────────────────────────
        Guide::query()
            ->whereNull('game_id')
            ->orderBy('id')
            ->chunkById(200, function ($guides) use ($linker, $dry, &$linked, &$skipped) {
                foreach ($guides as $guide) {
                    $gameId = $linker->match(null, $guide->title, $guide->published_at?->year);

                    if (! $gameId) {
                        $skipped++;

                        continue;
                    }

                    $name = DB::table('games')->where('id', $gameId)->value('name');
                    $this->line(sprintf('  %s[guide] %s  →  %s',
                        $dry ? '[dry] ' : '', mb_substr($guide->title, 0, 62), $name));

                    if (! $dry) {
                        Guide::withoutEvents(fn () => $guide->forceFill(['game_id' => $gameId])->save());
                    }
                    $linked++;
                }
            });

        $this->info(sprintf('%sPovezano: %d | bez pouzdane veze: %d',
            $dry ? '[dry-run] ' : '', $linked, $skipped));

        return self::SUCCESS;
    }
}
