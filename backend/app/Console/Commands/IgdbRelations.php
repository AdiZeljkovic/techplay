<?php

namespace App\Console\Commands;

use App\Models\GameRelation;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * What a game is part of, and what is part of it.
 *
 * Every row hangs on one of our games and names whatever is on the other side.
 * The other side is a link only when this catalogue happens to have it — which
 * for DLC it almost never does, because DLC is not imported as pages and 17,580
 * pieces of it belong to games we do hold. A name in a list is the answer there:
 * Hades' page says what its add-ons are called, and links the ones that have
 * somewhere to link to.
 *
 * Each fact is written twice, once from each side that we hold. "This is DLC
 * for Hades" and "Hades has this DLC" are two different statements, only one of
 * them exists when one game is missing, and writing both makes a page's query
 * the whole story: `where game_id = ?`.
 *
 * `parent_game` is IGDB's general "derived from", set on DLC, remasters, ports
 * and episodes alike — what it means is on the child's `game_type`, never
 * assumed.
 */
class IgdbRelations extends Command
{
    protected $signature = 'igdb:relations
                            {--chunk=5000 : Rows inserted at a time}
                            {--apply : Actually write. Without it nothing is saved}';

    protected $description = 'Uvozi veze medju igrama (DLC, remaster, port, bundle, izdanje)';

    /** What a `parent_game` pointer means, read off the child's type. */
    private const PARENT_BY_TYPE = [
        1 => 'dlc_of',
        2 => 'expansion_of',
        4 => 'expansion_of',
        5 => 'mod_of',
        6 => 'episode_of',
        7 => 'season_of',
        8 => 'remake_of',
        9 => 'remaster_of',
        10 => 'expanded_from',
        11 => 'port_of',
        13 => 'in_pack',
        14 => 'update_of',
    ];

    /** Lists on a game naming what belongs to it, and what that makes them. */
    private const CHILD_LISTS = [
        'dlcs' => 'has_dlc',
        'expansions' => 'has_expansion',
        'standalone_expansions' => 'has_expansion',
        'remakes' => 'remade_as',
        'remasters' => 'remastered_as',
        'ports' => 'ported_as',
        'expanded_games' => 'expanded_into',
        'bundles' => 'in_bundle',
    ];

    public function handle(): int
    {
        $ours = $this->ourGames();

        if ($ours === []) {
            $this->error('Nijedna nasa igra nije spojena s IGDB-om.');

            return self::FAILURE;
        }

        $apply = (bool) $this->option('apply');

        $this->line('  Citam nazive igara…');
        $names = $this->names();

        $this->line('  Citam veze…');
        $rows = $this->read($ours, $names);

        if ($rows === []) {
            $this->warn('  Nema nijedne veze.');

            return self::SUCCESS;
        }

        $written = $apply ? $this->write($rows) : count($rows);

        $this->newLine();
        $this->line(sprintf('  %s %s veza.', $apply ? 'Upisano:' : 'Bilo bi upisano:', number_format($written)));

        $linked = 0;
        $counts = [];
        foreach ($rows as $row) {
            $counts[$row['relation']] = ($counts[$row['relation']] ?? 0) + 1;
            $linked += $row['other_game_id'] === null ? 0 : 1;
        }
        arsort($counts);

        $this->table(
            ['veza', 'broj'],
            array_map(fn ($r, $n) => [GameRelation::label($r), number_format($n)], array_keys($counts), $counts),
        );

        $this->line(sprintf(
            '  %s vodi na nasu stranicu, %s je samo naziv (igra nije u katalogu).',
            number_format($linked), number_format(count($rows) - $linked),
        ));

        if (! $apply) {
            $this->newLine();
            $this->warn('  Nista nije upisano. Dodaj --apply da se sacuva.');
        }

        return self::SUCCESS;
    }

    /** @return array<int, int> their game id => our game id */
    private function ourGames(): array
    {
        $out = [];

        foreach (DB::table('game_external_ids')->where('provider', 'igdb')->pluck('game_id', 'external_id') as $external => $gameId) {
            $out[(int) $external] = (int) $gameId;
        }

        return $out;
    }

    /**
     * Every IGDB game's name, so the other side of a relation can be printed
     * even when we do not carry it.
     *
     * 372,828 short strings — about 25 MB, against a query per relation.
     *
     * @return array<int, string>
     */
    private function names(): array
    {
        $out = [];

        DB::table('igdb_raw')
            ->where('endpoint', 'games')
            ->orderBy('igdb_id')
            ->chunk(20000, function ($rows) use (&$out) {
                foreach ($rows as $row) {
                    $p = json_decode($row->payload, true) ?: [];

                    if (! empty($p['name'])) {
                        $out[(int) $p['id']] = (string) $p['name'];
                    }
                }
            });

        return $out;
    }

    /** @return array<string, array<string, mixed>> keyed to dedupe */
    private function read(array $ours, array $names): array
    {
        $out = [];

        $add = function (?int $ourGameId, string $relation, int $otherIgdb) use (&$out, $ours, $names) {
            if ($ourGameId === null || ! isset($names[$otherIgdb])) {
                return;
            }

            $otherOurs = $ours[$otherIgdb] ?? null;

            if ($otherOurs === $ourGameId) {
                return;   // a game is not related to itself
            }

            $out[$ourGameId.'|'.$relation.'|'.$otherIgdb] = [
                'game_id' => $ourGameId,
                'relation' => $relation,
                'other_igdb_id' => $otherIgdb,
                'other_name' => Str::limit($names[$otherIgdb], 500, ''),
                'other_game_id' => $otherOurs,
            ];
        };

        DB::table('igdb_raw')
            ->where('endpoint', 'games')
            ->orderBy('igdb_id')
            ->chunk(20000, function ($rows) use ($add, $ours) {
                foreach ($rows as $row) {
                    $p = json_decode($row->payload, true) ?: [];
                    $igdbId = (int) ($p['id'] ?? 0);
                    $self = $ours[$igdbId] ?? null;

                    /* The parent pointer, named by what this game is. Written
                       from our side if we hold this game, and from the parent's
                       side if we hold that — which is the case that lets Hades
                       list DLC we do not carry. */
                    $parent = (int) ($p['parent_game'] ?? 0);
                    $relation = self::PARENT_BY_TYPE[(int) ($p['game_type'] ?? -1)] ?? null;

                    if ($parent > 0 && $relation !== null) {
                        $add($self, $relation, $parent);
                        $add($ours[$parent] ?? null, GameRelation::reverse($relation), $igdbId);
                    }

                    if (! empty($p['version_parent'])) {
                        $versionParent = (int) $p['version_parent'];
                        $add($self, 'edition_of', $versionParent);
                        $add($ours[$versionParent] ?? null, 'has_edition', $igdbId);
                    }

                    foreach (self::CHILD_LISTS as $field => $forward) {
                        foreach ((array) ($p[$field] ?? []) as $other) {
                            $otherId = (int) $other;

                            if ($otherId <= 0) {
                                continue;
                            }

                            $add($self, $forward, $otherId);
                            $add($ours[$otherId] ?? null, GameRelation::reverse($forward), $igdbId);
                        }
                    }
                }
            });

        return $out;
    }

    private function write(array $rows): int
    {
        $batch = [];
        $written = 0;
        $size = max(1, (int) $this->option('chunk'));
        $bar = $this->output->createProgressBar(count($rows));

        foreach ($rows as $row) {
            $bar->advance();

            $batch[] = $row + ['created_at' => now(), 'updated_at' => now()];
            $written++;

            if (count($batch) >= $size) {
                DB::table('game_relations')->insertOrIgnore($batch);
                $batch = [];
            }
        }

        if ($batch !== []) {
            DB::table('game_relations')->insertOrIgnore($batch);
        }

        $bar->finish();
        $this->newLine();

        return $written;
    }
}
