<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 * What a game is part of.
 *
 * 54,783 of IGDB's games name a parent, and today a DLC page on this site does
 * not know the game it belongs to, a remaster does not know its original, and
 * a bundle does not know what is in it. The reader has to search for the other
 * one by name.
 *
 * Every row is written in one direction and read in both. IGDB states these
 * from both ends — a game lists its `dlcs` and each of those names it as
 * `parent_game` — so writing both would be two rows that can disagree with
 * each other after the next pull. The child points at the parent; asking what
 * a parent has is a query on the other column, which the index is for.
 *
 * A relation to a game we do not carry is dropped rather than kept: the whole
 * point is a link the reader can follow.
 */
class IgdbRelations extends Command
{
    protected $signature = 'igdb:relations
                            {--chunk=5000 : Rows inserted at a time}
                            {--apply : Actually write. Without it nothing is saved}';

    protected $description = 'Uvozi veze medju igrama (DLC, remaster, port, bundle, izdanje)';

    /**
     * The field on their game payload, and what the game holding it is.
     *
     * Read as "<this game> is the <relation> of <the game named>". `dlcs` and
     * friends point the other way — a game lists what belongs to *it* — so
     * those are written from the named game's side, which is what `inverse`
     * marks.
     */
    private const FIELDS = [
        'parent_game' => ['relation' => 'dlc_of', 'inverse' => false],
        'version_parent' => ['relation' => 'edition_of', 'inverse' => false],
        'dlcs' => ['relation' => 'dlc_of', 'inverse' => true],
        'expansions' => ['relation' => 'expansion_of', 'inverse' => true],
        'standalone_expansions' => ['relation' => 'expansion_of', 'inverse' => true],
        'remakes' => ['relation' => 'remake_of', 'inverse' => true],
        'remasters' => ['relation' => 'remaster_of', 'inverse' => true],
        'ports' => ['relation' => 'port_of', 'inverse' => true],
        'expanded_games' => ['relation' => 'expanded_from', 'inverse' => true],
        'bundles' => ['relation' => 'in_bundle', 'inverse' => false],
    ];

    public function handle(): int
    {
        $ours = $this->ourGames();

        if ($ours === []) {
            $this->error('Nijedna nasa igra nije spojena s IGDB-om.');

            return self::FAILURE;
        }

        $apply = (bool) $this->option('apply');

        $this->line('  Citam veze…');
        $relations = $this->read($ours);

        if ($relations === []) {
            $this->warn('  Nema nijedne veze gdje su obje igre nase.');

            return self::SUCCESS;
        }

        $written = $apply ? $this->write($relations) : count($relations);

        $this->newLine();
        $this->line(sprintf('  %s %s veza.', $apply ? 'Upisano:' : 'Bilo bi upisano:', number_format($written)));

        $counts = [];
        foreach ($relations as [$_, $__, $relation]) {
            $counts[$relation] = ($counts[$relation] ?? 0) + 1;
        }
        arsort($counts);

        $this->table(
            ['veza', 'broj'],
            array_map(fn ($r, $n) => [$r, number_format($n)], array_keys($counts), $counts),
        );

        if (! $apply) {
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

    /** @return array<string, array{0: int, 1: int, 2: string}> keyed to dedupe */
    private function read(array $ours): array
    {
        $out = [];

        DB::table('igdb_raw')
            ->where('endpoint', 'games')
            ->orderBy('igdb_id')
            ->chunk(20000, function ($rows) use (&$out, $ours) {
                foreach ($rows as $row) {
                    $p = json_decode($row->payload, true) ?: [];
                    $self = $ours[(int) ($p['id'] ?? 0)] ?? null;

                    if ($self === null) {
                        continue;
                    }

                    foreach (self::FIELDS as $field => $rule) {
                        foreach ((array) ($p[$field] ?? []) as $other) {
                            $otherId = $ours[(int) $other] ?? null;

                            if ($otherId === null || $otherId === $self) {
                                continue;
                            }

                            /* `dlcs` names the children, so the row belongs to
                               the child pointing back — which is the same row
                               that game's own `parent_game` would produce. The
                               key below is what stops it being written twice. */
                            [$game, $related] = $rule['inverse'] ? [$otherId, $self] : [$self, $otherId];

                            $out[$game.'|'.$related.'|'.$rule['relation']] = [$game, $related, $rule['relation']];
                        }
                    }
                }
            });

        return $out;
    }

    private function write(array $relations): int
    {
        $batch = [];
        $written = 0;
        $size = max(1, (int) $this->option('chunk'));
        $bar = $this->output->createProgressBar(count($relations));

        foreach ($relations as [$game, $related, $relation]) {
            $bar->advance();

            $batch[] = [
                'game_id' => $game,
                'related_game_id' => $related,
                'relation' => $relation,
                'created_at' => now(),
                'updated_at' => now(),
            ];
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
