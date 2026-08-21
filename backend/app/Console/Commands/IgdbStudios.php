<?php

namespace App\Console\Commands;

use App\Models\Studio;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Builds the studios out of IGDB's companies, and links them to our games.
 *
 * Only companies with at least one game in this catalogue get a row. IGDB holds
 * 72,421 of them; 56,911 made or published something we have. The rest would be
 * a name in a table nobody can reach.
 *
 * Roles come from `involved_companies` rather than from the company's own
 * `developed`/`published` lists, because that is where the role lives — the
 * same company is often both, and the studio page shows the two lists apart.
 * Porting and support credits are real but they are not whose game it is, so
 * they are not written.
 *
 * Runs after the game import, necessarily: a studio's games are the ones we
 * hold, and which those are is only settled once the catalogue is full.
 */
class IgdbStudios extends Command
{
    protected $signature = 'igdb:studios
                            {--chunk=2000 : Rows written at a time}
                            {--apply : Actually write. Without it nothing is saved}';

    protected $description = 'Pravi studije od IGDB kompanija i vezuje ih za nase igre';

    /** Their image CDN, at a size a logo is actually shown at. */
    private const LOGO = 'https://images.igdb.com/igdb/image/upload/t_logo_med/%s.png';

    /** id => name, from `company_statuses`. Absent means still working. */
    private array $statuses = [];

    public function handle(): int
    {
        if (! DB::table('igdb_raw')->where('endpoint', 'companies')->exists()) {
            $this->error('Nema povucenih kompanija — pokreni igdb:pull --endpoint=companies.');

            return self::FAILURE;
        }

        $apply = (bool) $this->option('apply');

        $this->line('  Trazim nase igre u IGDB-u…');
        $ourGames = $this->ourGames();

        if ($ourGames === []) {
            $this->error('Nijedna nasa igra nije spojena s IGDB-om — pokreni prvo igdb:merge.');

            return self::FAILURE;
        }

        $this->line('  Citam uloge…');
        [$roles, $wanted] = $this->roles($ourGames);

        $this->line(sprintf('  %s kompanija ima nasu igru.', number_format(count($wanted))));

        foreach (DB::table('igdb_raw')->where('endpoint', 'company_statuses')->get() as $row) {
            $p = json_decode($row->payload, true) ?: [];
            $name = $p['name'] ?? $p['status'] ?? null;

            if ($name) {
                $this->statuses[(int) $p['id']] = (string) $name;
            }
        }

        $this->line('  Citam logotipe i sajtove…');
        $logos = $this->assets('company_logos', fn ($p) => isset($p['image_id']) ? sprintf(self::LOGO, $p['image_id']) : null);
        $sites = $this->assets('company_websites', fn ($p) => $p['url'] ?? null);

        $written = $this->write($wanted, $logos, $sites, $apply);
        $links = $this->link($roles, $ourGames, $apply);

        $this->newLine();
        $this->line(sprintf('  %s %s studija, %s veza s igrama.',
            $apply ? 'Upisano:' : 'Bilo bi upisano:', number_format($written), number_format($links)));

        if ($apply) {
            $this->line('  Osvjezavam status, godinu i broj zaposlenih…');
            $this->refresh();

            $this->line('  Spajam maticne firme i nasljednike…');
            $this->lineage();

            $this->line('  Racunam brojeve igara…');
            $this->counts();
        } else {
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
     * Who did what, for games we hold.
     *
     * @return array{0: array<int, array<int, array<string>>>, 1: array<int, true>}
     */
    private function roles(array $ourGames): array
    {
        $roles = [];
        $wanted = [];

        DB::table('igdb_raw')
            ->where('endpoint', 'involved_companies')
            ->orderBy('igdb_id')
            ->chunk(5000, function ($rows) use (&$roles, &$wanted, $ourGames) {
                foreach ($rows as $row) {
                    $p = json_decode($row->payload, true) ?: [];
                    $game = (int) ($p['game'] ?? 0);
                    $company = (int) ($p['company'] ?? 0);

                    if ($company === 0 || ! isset($ourGames[$game])) {
                        continue;
                    }

                    /* Porting and supporting are here now, and kept apart from
                       the other two: Virtuos did not make the game, it brought
                       it to the Switch. Folding that into "developed" would put
                       four hundred games it did not write on its page. */
                    foreach ([
                        'developer' => 'developer',
                        'publisher' => 'publisher',
                        'porting' => 'porting',
                        'supporting' => 'supporting',
                    ] as $flag => $role) {
                        if (! empty($p[$flag])) {
                            $roles[$company][$game][] = $role;
                            $wanted[$company] = true;
                        }
                    }
                }
            });

        return [$roles, $wanted];
    }

    /** @return array<int, string> company id => url */
    private function assets(string $endpoint, callable $value): array
    {
        $byId = [];

        foreach (DB::table('igdb_raw')->where('endpoint', $endpoint)->get() as $row) {
            $p = json_decode($row->payload, true) ?: [];

            if ($v = $value($p)) {
                $byId[(int) $p['id']] = $v;
            }
        }

        return $byId;
    }

    /** Creates or refreshes the studio rows themselves. */
    private function write(array $wanted, array $logos, array $sites, bool $apply): int
    {
        $slugs = [];
        foreach (DB::table('studios')->pluck('slug') as $slug) {
            $slugs[$slug] = true;
        }

        $existing = [];
        foreach (DB::table('studios')->whereNotNull('igdb_id')->pluck('id', 'igdb_id') as $igdbId => $id) {
            $existing[(int) $igdbId] = (int) $id;
        }

        $written = 0;
        $batch = [];
        $bar = $this->output->createProgressBar(count($wanted));

        DB::table('igdb_raw')
            ->where('endpoint', 'companies')
            ->orderBy('igdb_id')
            ->chunk(5000, function ($rows) use (&$written, &$batch, &$slugs, $wanted, $existing, $logos, $sites, $apply, $bar) {
                foreach ($rows as $row) {
                    $p = json_decode($row->payload, true) ?: [];
                    $id = (int) ($p['id'] ?? 0);

                    if (! isset($wanted[$id]) || isset($existing[$id])) {
                        continue;
                    }

                    $name = trim((string) ($p['name'] ?? ''));

                    if ($name === '') {
                        continue;
                    }

                    $batch[] = [
                        'igdb_id' => $id,
                        'name' => $name,
                        'slug' => $this->freeSlug($p['slug'] ?? $name, $slugs),
                        'description' => trim((string) ($p['description'] ?? '')) ?: null,
                        'logo_url' => isset($p['logo']) ? ($logos[(int) $p['logo']] ?? null) : null,
                        'country' => isset($p['country']) ? (int) $p['country'] : null,
                        'founded' => $this->founded($p),
                        'website' => $this->firstSite($p['websites'] ?? [], $sites),
                        'status' => $this->statuses[(int) ($p['status'] ?? 0)] ?? 'active',
                        'changed_at' => $this->stamp($p['change_date'] ?? null),
                        /* `company_size` is not written: its values run 1 to 8
                           and IGDB names none of them, so it is a size band
                           nobody can read, not a headcount. It said Sega had
                           seven staff. */
                        /* Parents and successors are other studios, which do not
                           all exist yet while this batch is being written. Both
                           are joined up in a second pass. */
                        'became_studio_id' => null,
                        'parent_id' => null,
                        'games_count' => 0,
                        'developed_count' => 0,
                        'published_count' => 0,
                        'indexable' => false,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ];

                    $written++;
                    $bar->advance();

                    if ($apply && count($batch) >= max(1, (int) $this->option('chunk'))) {
                        DB::table('studios')->insert($batch);
                        $batch = [];
                    }
                }
            });

        if ($apply && $batch !== []) {
            DB::table('studios')->insert($batch);
        }

        $bar->finish();
        $this->newLine();

        return $written;
    }

    /**
     * IGDB's founding dates go back before the Unix epoch and a few sit at the
     * proleptic zero — 62135683200 seconds before it, which is their way of
     * saying nothing. A studio founded in year 1 is not a date, it is a null.
     */
    private function founded(array $p): ?string
    {
        return $this->stamp($p['start_date'] ?? null);
    }

    private function stamp(mixed $seconds): ?string
    {
        if ($seconds === null || (int) $seconds < -2208988800) {   // before 1900
            return null;
        }

        return gmdate('Y-m-d', (int) $seconds);
    }

    /**
     * The facts that change on a studio we already hold.
     *
     * `write()` only inserts, so a column added after the first run stayed null
     * on all 56,911 rows — which is exactly what happened to `status`,
     * `changed_at` and `employees`: the run reported "0 studios written" and
     * quietly wrote none of them.
     *
     * These three are facts about the company rather than anything anyone here
     * edits, so they are refreshed rather than filled-only. A studio that closes
     * next year should stop saying it is active.
     */
    private function refresh(): void
    {
        $byIgdb = [];

        foreach (DB::table('studios')->whereNotNull('igdb_id')->pluck('id', 'igdb_id') as $igdbId => $id) {
            $byIgdb[(int) $igdbId] = (int) $id;
        }

        $kinds = $this->kinds();
        $changed = 0;

        DB::table('igdb_raw')
            ->where('endpoint', 'companies')
            ->orderBy('igdb_id')
            ->chunk(5000, function ($rows) use ($byIgdb, $kinds, &$changed) {
                foreach ($rows as $row) {
                    $p = json_decode($row->payload, true) ?: [];
                    $igdbId = (int) ($p['id'] ?? 0);
                    $id = $byIgdb[$igdbId] ?? null;

                    if ($id === null) {
                        continue;
                    }

                    $changed += DB::table('studios')->where('id', $id)->update([
                        'status' => $this->statuses[(int) ($p['status'] ?? 0)] ?? 'active',
                        'changed_at' => $this->stamp($p['change_date'] ?? null),
                        'kind' => $kinds[$igdbId] ?? null,
                        'updated_at' => now(),
                    ]);
                }
            });

        $this->line('  '.number_format($changed).' studija osvjezeno.');
    }

    /**
     * What kind of company each one is.
     *
     * From `company_type_histories`, which carries no dates despite the name —
     * a company and a type, nothing more. Five types, and the one that matters
     * to a reader is Solo Dev: a game made by one person is a different thing
     * from one made by four hundred.
     *
     * @return array<int, string> their company id => type name
     */
    private function kinds(): array
    {
        $names = [];

        foreach (DB::table('igdb_raw')->where('endpoint', 'company_types')->get() as $row) {
            $p = json_decode($row->payload, true) ?: [];

            if (! empty($p['name'])) {
                $names[(int) $p['id']] = (string) $p['name'];
            }
        }

        if ($names === []) {
            return [];
        }

        $out = [];

        foreach (DB::table('igdb_raw')->where('endpoint', 'company_type_histories')->get() as $row) {
            $p = json_decode($row->payload, true) ?: [];
            $company = (int) ($p['company'] ?? 0);
            $kind = $names[(int) ($p['company_type'] ?? 0)] ?? null;

            if ($company > 0 && $kind !== null) {
                $out[$company] = $kind;
            }
        }

        return $out;
    }

    /**
     * Who owns whom, and who became whom.
     *
     * A second pass because both point at other studios, and in the first pass
     * half of them do not exist yet — a company written before its parent would
     * have nothing to point at. Once every row is in, this is two joins.
     *
     * `parent_id` has been null on all 56,911 rows since the table was created,
     * while the studio page has been rendering "Part of" and "Studios under" for
     * it the whole time. 1,946 companies name a parent.
     */
    private function lineage(): void
    {
        $byIgdb = [];

        foreach (DB::table('studios')->whereNotNull('igdb_id')->pluck('id', 'igdb_id') as $igdbId => $id) {
            $byIgdb[(int) $igdbId] = (int) $id;
        }

        $parents = 0;
        $successors = 0;

        DB::table('igdb_raw')
            ->where('endpoint', 'companies')
            ->orderBy('igdb_id')
            ->chunk(5000, function ($rows) use ($byIgdb, &$parents, &$successors) {
                foreach ($rows as $row) {
                    $p = json_decode($row->payload, true) ?: [];
                    $self = $byIgdb[(int) ($p['id'] ?? 0)] ?? null;

                    if ($self === null) {
                        continue;
                    }

                    $updates = [];

                    if ($parent = $byIgdb[(int) ($p['parent'] ?? 0)] ?? null) {
                        if ($parent !== $self) {
                            $updates['parent_id'] = $parent;
                            $parents++;
                        }
                    }

                    if ($became = $byIgdb[(int) ($p['changed_company_id'] ?? 0)] ?? null) {
                        if ($became !== $self) {
                            $updates['became_studio_id'] = $became;
                            $successors++;
                        }
                    }

                    if ($updates !== []) {
                        DB::table('studios')->where('id', $self)->update($updates);
                    }
                }
            });

        $this->line(sprintf(
            '  %s studija ima maticnu firmu, %s je postalo neko drugi.',
            number_format($parents), number_format($successors),
        ));
    }

    private function firstSite(array $ids, array $sites): ?string
    {
        foreach ($ids as $id) {
            if ($url = $sites[(int) $id] ?? null) {
                return Str::limit($url, 500, '');
            }
        }

        return null;
    }

    private function freeSlug(string $base, array &$slugs): string
    {
        $slug = Str::slug($base) ?: 'studio';
        $candidate = $slug;
        $n = 2;

        while (isset($slugs[$candidate])) {
            $candidate = $slug.'-'.$n++;
        }

        $slugs[$candidate] = true;

        return $candidate;
    }

    /** Writes the game↔studio rows. */
    private function link(array $roles, array $ourGames, bool $apply): int
    {
        if (! $apply) {
            return array_sum(array_map(
                fn ($games) => array_sum(array_map('count', $games)),
                $roles,
            ));
        }

        $studioIds = [];
        foreach (DB::table('studios')->whereNotNull('igdb_id')->pluck('id', 'igdb_id') as $igdbId => $id) {
            $studioIds[(int) $igdbId] = (int) $id;
        }

        $written = 0;
        $batch = [];
        $size = max(1, (int) $this->option('chunk'));
        $bar = $this->output->createProgressBar(count($roles));

        foreach ($roles as $company => $games) {
            $bar->advance();
            $studioId = $studioIds[$company] ?? null;

            if ($studioId === null) {
                continue;
            }

            foreach ($games as $game => $theseRoles) {
                foreach (array_unique($theseRoles) as $role) {
                    $batch[] = ['game_id' => $ourGames[$game], 'studio_id' => $studioId, 'role' => $role];
                    $written++;

                    if (count($batch) >= $size) {
                        DB::table('game_studio')->insertOrIgnore($batch);
                        $batch = [];
                    }
                }
            }
        }

        if ($batch !== []) {
            DB::table('game_studio')->insertOrIgnore($batch);
        }

        $bar->finish();
        $this->newLine();

        return $written;
    }

    /**
     * Fills the counts and decides who is worth indexing.
     *
     * A studio with one game and nothing written about it is a page with a name
     * and one card on it. It still exists, and the game page still links to it —
     * it just does not go in the sitemap.
     */
    private function counts(): void
    {
        /* Correlated subqueries rather than an UPDATE ... FROM, which SQLite
           will not take with a table alias — and the tests run on SQLite. The
           (studio_id, role) index answers all four without touching a row. */
        DB::update('
            update studios set
                developed_count = (select count(*) from game_studio where studio_id = studios.id and role = ?),
                published_count = (select count(*) from game_studio where studio_id = studios.id and role = ?),
                ported_count = (select count(*) from game_studio where studio_id = studios.id and role = ?),
                supported_count = (select count(*) from game_studio where studio_id = studios.id and role = ?),
                games_count = (select count(distinct game_id) from game_studio where studio_id = studios.id),
                indexable = (
                    (select count(distinct game_id) from game_studio where studio_id = studios.id) >= 2
                    or description is not null
                    or logo_url is not null
                ),
                updated_at = ?
        ', ['developer', 'publisher', 'porting', 'supporting', now()]);

        $total = DB::table('studios')->count();
        $indexable = DB::table('studios')->where('indexable', true)->count();

        $this->line(sprintf('  %s studija, od toga %s ide u sitemap.', number_format($total), number_format($indexable)));
    }
}
