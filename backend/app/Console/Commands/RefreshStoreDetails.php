<?php

namespace App\Console\Commands;

use App\Models\GameStoreLink;
use App\Services\Releases\NintendoSync;
use App\Services\Releases\PlaystationSync;
use App\Services\Releases\SteamSync;
use App\Services\Releases\TransientFailure;
use App\Services\Releases\XboxSync;
use Illuminate\Console\Command;

/**
 * Asks a store again about games we already hold.
 *
 * The syncs are built never to re-ask, which is what makes them cheap and
 * exactly what stands in the way when we discover we read something wrong the
 * first time — a field we mapped to a key the store had renamed, say.
 *
 * This re-reads presentation only: art, screenshots, trailers, description,
 * genres. It never touches a game's date, its identity, its store links or a
 * merge, so it cannot undo an editor's work or split an entry back apart.
 */
class RefreshStoreDetails extends Command
{
    protected $signature = 'releases:refresh
        {store : steam, nintendo, xbox or playstation}
        {--missing-trailers : Only games whose trailer list is empty}';

    protected $description = 'Re-read presentation fields for games a store already gave us';

    public function handle(
        SteamSync $steam,
        NintendoSync $nintendo,
        XboxSync $xbox,
        PlaystationSync $playstation,
    ): int {
        $syncs = ['steam' => $steam, 'nintendo' => $nintendo, 'xbox' => $xbox, 'playstation' => $playstation];
        $store = $this->argument('store');

        if (! isset($syncs[$store])) {
            $this->error("Unknown store '{$store}'.");

            return self::FAILURE;
        }

        $links = GameStoreLink::where('store', $store)
            ->whereNotNull('game_id')
            ->with('game')
            ->when($this->option('missing-trailers'), fn ($q) => $q->whereHas('game', fn ($g) => $g->whereRaw('coalesce(jsonb_array_length(movies_data), 0) = 0')))
            ->get();

        if ($links->isEmpty()) {
            $this->info('Nothing to refresh.');

            return self::SUCCESS;
        }

        $this->info("Re-reading {$links->count()} {$store} listings.");

        $bar = $this->output->createProgressBar($links->count());
        $bar->start();

        $updated = 0;
        $failed = 0;

        foreach ($links as $link) {
            try {
                $updated += $syncs[$store]->refreshPresentation($link) ? 1 : 0;
            } catch (TransientFailure) {
                $failed++;
            }

            $bar->advance();
        }

        $bar->finish();
        $this->newLine(2);
        $this->table(['re-read', 'updated', 'store unreachable'], [[$links->count(), $updated, $failed]]);

        return self::SUCCESS;
    }
}
