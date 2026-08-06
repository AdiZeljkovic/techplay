<?php

namespace App\Console\Commands;

use App\Models\Game;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 * Removes the catalogue's dead weight, with the same receipts as the adult
 * purge: a gzip archive first, a tombstone after, so every deleted URL
 * answers 410 and every deleted row can come back.
 *
 * Three kinds of clutter, measured before this was written:
 *
 *  - Empty shells (~2k): no cover and no description. A page with nothing
 *    to say for itself, whatever else it may carry.
 *  - DLC stubs (~31k): "Add-on" genre with neither a rating nor a
 *    description — SingStar tracks, language packs, microtransaction
 *    currency. Add-ons anyone bothered to rate or describe (Lost Coast)
 *    stay.
 *  - Unrated editions (~12k): Compilations and Special editions nobody
 *    scored — boxings of games the catalogue already has. Rated editions
 *    (Game of the Year) keep their pages.
 *
 * The aggregator's rows are untouchable: an upcoming release legitimately
 * has no rating yet, so anything with a match_key — and anything not yet
 * released — is out of scope entirely.
 */
class PurgeClutterGames extends Command
{
    protected $signature = 'games:purge-clutter
        {--dry-run : Count per category, delete nothing}';

    protected $description = 'Delete empty shells, DLC stubs and empty editions; archive them, leave tombstones';

    public function handle(): int
    {
        if (DB::getDriverName() !== 'pgsql') {
            $this->error('This command speaks Postgres (text[] containment).');

            return self::FAILURE;
        }

        $dry = (bool) $this->option('dry-run');

        // ── the sets, each guarded against the aggregator and the future ──
        $guarded = fn () => DB::table('games')
            ->whereNull('match_key')
            ->where(fn ($q) => $q->whereNull('released')->orWhere('released', '<', now()->toDateString()));

        $shells = $guarded()
            ->whereNull('cover_url')
            ->whereNull('description')
            ->pluck('id');

        $stubs = $guarded()
            ->whereRaw("genres @> ARRAY['Add-on']::text[]")
            ->where(fn ($q) => $q->whereNull('rating')->orWhere('rating', 0))
            ->whereNull('description')
            ->pluck('id');

        $editions = $guarded()
            ->where(fn ($q) => $q->whereRaw("genres @> ARRAY['Compilation']::text[]")
                ->orWhereRaw("genres @> ARRAY['Special edition']::text[]"))
            ->where(fn ($q) => $q->whereNull('rating')->orWhere('rating', 0))
            ->pluck('id');

        // A row can be in more than one set; the reason records the first
        // bucket that claimed it, in this order.
        $reasons = [];
        foreach (['empty-shell' => $shells, 'dlc-stub' => $stubs, 'empty-edition' => $editions] as $reason => $ids) {
            foreach ($ids as $id) {
                $reasons[$id] ??= $reason;
            }
        }

        $this->info(sprintf(
            'Prazne ljuske: %s | DLC stubovi: %s | prazne edicije: %s | unija za brisanje: %s',
            number_format($shells->count()), number_format($stubs->count()),
            number_format($editions->count()), number_format(count($reasons))
        ));

        if ($dry) {
            $this->info('Dry run — ništa nije obrisano.');

            return self::SUCCESS;
        }

        $doomedIds = collect(array_keys($reasons));

        // ── archive before anything dies ─────────────────────────────────
        $archivePath = storage_path('app/backups/clutter-purge-'.now()->format('Y-m-d-His').'.json.gz');
        @mkdir(dirname($archivePath), 0775, true);
        $gz = gzopen($archivePath, 'wb6');
        foreach ($doomedIds->chunk(1000) as $chunk) {
            foreach (DB::table('games')->whereIn('id', $chunk)->get() as $row) {
                gzwrite($gz, json_encode($row, JSON_UNESCAPED_UNICODE)."\n");
            }
        }
        gzclose($gz);
        $this->line('Arhiva: '.$archivePath.' ('.round(filesize($archivePath) / 1048576, 1).' MB)');

        // ── tombstones, then the delete, in digestible bites ─────────────
        $deleted = 0;
        foreach ($doomedIds->chunk(1000) as $chunk) {
            $stones = DB::table('games')->whereIn('id', $chunk)->get(['id', 'slug', 'name'])
                ->map(fn ($r) => [
                    'slug' => $r->slug, 'name' => $r->name,
                    'reason' => $reasons[$r->id], 'deleted_at' => now(),
                ])->all();
            DB::table('game_tombstones')->upsert($stones, ['slug'], ['name', 'reason', 'deleted_at']);

            foreach (['game_store_links' => 'game_id', 'game_external_ids' => 'game_id',
                'user_games' => 'game_id', 'game_ratings' => 'game_id',
                'game_list_items' => 'game_id'] as $tbl => $col) {
                DB::table($tbl)->whereIn($col, $chunk)->delete();
            }

            $deleted += DB::table('games')->whereIn('id', $chunk)->delete();
            $this->output->write('.');
        }
        $this->newLine();

        $this->info(sprintf('Obrisano %s redova.', number_format($deleted)));
        $this->line('Preostalo igara: '.number_format(Game::count()));

        return self::SUCCESS;
    }
}
