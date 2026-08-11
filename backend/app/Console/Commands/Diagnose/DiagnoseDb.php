<?php

namespace App\Console\Commands\Diagnose;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 * What the database knows about itself and the code cannot.
 *
 * An index that is never scanned still costs every write. A foreign key with no
 * index turns every parent delete into a sequential scan. Neither is visible
 * from the source — Postgres has been counting all along, and this asks it.
 *
 * Read-only.
 */
class DiagnoseDb extends Command
{
    protected $signature = 'diagnose:db {--limit=15 : How many rows per section}';

    protected $description = 'Indexes nobody uses, foreign keys without one, bloat, and the slowest queries';

    public function handle(): int
    {
        if (DB::getDriverName() !== 'pgsql') {
            $this->error('These read PostgreSQL catalogues; this connection is '.DB::getDriverName().'.');

            return self::FAILURE;
        }

        $limit = max(1, (int) $this->option('limit'));

        $this->unusedIndexes($limit);
        $this->foreignKeysWithoutIndex();
        $this->bloat($limit);
        $this->slowQueries($limit);
        $this->longLocks();
        $this->tablesWithoutPrimaryKey();

        return self::SUCCESS;
    }

    private function unusedIndexes(int $limit): void
    {
        $rows = DB::select("
            select s.relname as table_name, s.indexrelname as index_name,
                   s.idx_scan, pg_size_pretty(pg_relation_size(s.indexrelid)) as size
            from pg_stat_user_indexes s
            join pg_index i on i.indexrelid = s.indexrelid
            where s.idx_scan = 0
              and not i.indisunique
              and not i.indisprimary
            order by pg_relation_size(s.indexrelid) desc
            limit {$limit}
        ");

        $this->section('Indeksi koji nisu nijednom korišteni');

        if ($rows === []) {
            $this->line('  Nema ih — svaki indeks se bar jednom koristio.');

            return;
        }

        $this->line('  Svaki od njih usporava svaki upis u tu tabelu, a nijedno čitanje ne ubrzava.');
        $this->countingSince();
        $this->table(['Tabela', 'Indeks', 'Skenova', 'Veličina'],
            array_map(fn ($r) => [$r->table_name, $r->index_name, $r->idx_scan, $r->size], $rows));
    }

    /**
     * How long these counters have been accumulating.
     *
     * "Zero scans" is a claim about a period, and without the period it is not
     * a finding at all — a database restarted an hour ago reports zero for
     * every index it has, including the ones carrying all the traffic.
     */
    private function countingSince(): void
    {
        $row = DB::selectOne('
            select d.stats_reset,
                   pg_postmaster_start_time() as started,
                   extract(epoch from (now() - coalesce(d.stats_reset, pg_postmaster_start_time()))) as seconds
            from pg_stat_database d
            where d.datname = current_database()
        ');

        if (! $row) {
            $this->line('  Ne mogu utvrditi otkad se broji — tretiraj nule kao neizmjerene.');

            return;
        }

        // A null stats_reset means nobody ever called pg_stat_reset(), not that
        // the period is unknown. The server start time is then the safe lower
        // bound: on PostgreSQL 15+ statistics survive a clean shutdown, so the
        // real period is at least this long, possibly much longer.
        $days = (int) floor(((float) $row->seconds) / 86400);
        $since = substr((string) ($row->stats_reset ?: $row->started), 0, 16);

        $origin = $row->stats_reset
            ? sprintf('Broji od %s', $since)
            : sprintf('Brojači nikad nisu resetovani; baza radi od %s, dakle najmanje toliko', $since);

        if ($days < 3) {
            $this->warn(sprintf('  %s — samo %d dana, prekratko da nula nešto znači.', $origin, $days));

            return;
        }

        $this->line(sprintf('  %s — %d dana. Nula kroz toliko vremena je nula.', $origin, $days));
    }

    private function foreignKeysWithoutIndex(): void
    {
        // Only tables big enough for it to cost anything. A foreign key with no
        // index on an empty table is a scan of nothing — listing all of them
        // buries the handful that matter under fifty that never will.
        $threshold = 262144; // 256 KB

        $rows = DB::select("
            select c.conrelid::regclass::text as table_name, a.attname as column_name,
                   pg_relation_size(c.conrelid) as bytes,
                   pg_size_pretty(pg_relation_size(c.conrelid)) as table_size
            from pg_constraint c
            join pg_attribute a on a.attrelid = c.conrelid and a.attnum = c.conkey[1]
            where c.contype = 'f'
              and array_length(c.conkey, 1) = 1
              and not exists (
                select 1 from pg_index i
                where i.indrelid = c.conrelid and i.indkey[0] = c.conkey[1]
              )
            order by pg_relation_size(c.conrelid) desc
        ");

        $this->section('Strani ključevi bez indeksa');

        $big = array_values(array_filter($rows, fn ($r) => (int) $r->bytes >= $threshold));
        $small = count($rows) - count($big);

        if ($big === []) {
            $this->line('  Nijedan na tabeli koja je dovoljno velika da to košta.');
            if ($small > 0) {
                $this->line("  ({$small} ih ima na malim tabelama — tamo je skeniranje ionako trenutno.)");
            }

            return;
        }

        $this->line('  Brisanje roditelja mora pregledati cijelu tabelu djece da provjeri veze.');
        $this->table(['Tabela', 'Kolona', 'Veličina tabele'],
            array_map(fn ($r) => [$r->table_name, $r->column_name, $r->table_size], $big));

        if ($small > 0) {
            $this->line("  (Još {$small} na tabelama manjim od 256 KB — tamo ne vrijedi indeks.)");
        }
    }

    private function bloat(int $limit): void
    {
        $rows = DB::select("
            select relname, n_dead_tup, n_live_tup,
                   case when n_live_tup > 0
                        then round(100.0 * n_dead_tup / n_live_tup, 1) else 0 end as dead_pct,
                   last_autovacuum
            from pg_stat_user_tables
            where n_dead_tup > 1000
            order by n_dead_tup desc
            limit {$limit}
        ");

        $this->section('Mrtvi redovi (prostor koji je plaćen a ne koristi se)');

        if ($rows === []) {
            $this->line('  Ništa značajno — autovacuum stiže.');

            return;
        }

        $this->table(['Tabela', 'Mrtvih', 'Živih', '%', 'Zadnji autovacuum'],
            array_map(fn ($r) => [
                $r->relname, number_format((int) $r->n_dead_tup), number_format((int) $r->n_live_tup),
                $r->dead_pct.'%', $r->last_autovacuum ? substr((string) $r->last_autovacuum, 0, 19) : 'nikad',
            ], $rows));
    }

    private function slowQueries(int $limit): void
    {
        $this->section('Najskuplji upiti');

        $has = DB::select("select 1 from pg_extension where extname = 'pg_stat_statements'");

        if ($has === []) {
            $this->warn('  pg_stat_statements nije uključen — bez njega baza ne pamti koji upiti traju.');
            $this->line('  Uključuje se u postgresql.conf (shared_preload_libraries) i traži restart.');
            $this->line('  Dok toga nema, jedini trag su spori upiti u logu aplikacije.');

            return;
        }

        try {
            $rows = DB::select("
                select round(total_exec_time::numeric, 0) as total_ms,
                       calls,
                       round(mean_exec_time::numeric, 1) as mean_ms,
                       left(regexp_replace(query, '\\s+', ' ', 'g'), 90) as q
                from pg_stat_statements
                order by total_exec_time desc
                limit {$limit}
            ");
        } catch (\Throwable $e) {
            $this->warn('  Ne mogu pročitati: '.$e->getMessage());

            return;
        }

        $this->table(['Ukupno ms', 'Poziva', 'Prosjek ms', 'Upit'],
            array_map(fn ($r) => [number_format((float) $r->total_ms), number_format((int) $r->calls), $r->mean_ms, $r->q], $rows));
    }

    private function longLocks(): void
    {
        $rows = DB::select("
            select pid, state, wait_event_type,
                   round(extract(epoch from (now() - query_start))) as seconds,
                   left(regexp_replace(query, '\\s+', ' ', 'g'), 70) as q
            from pg_stat_activity
            where state <> 'idle'
              and query_start < now() - interval '5 seconds'
              and pid <> pg_backend_pid()
            order by query_start
        ");

        $this->section('Upiti koji traju duže od 5 sekundi, upravo sada');

        if ($rows === []) {
            $this->line('  Nema ih.');

            return;
        }

        $this->table(['PID', 'Stanje', 'Čeka na', 'Sekundi', 'Upit'],
            array_map(fn ($r) => [$r->pid, $r->state, $r->wait_event_type ?? '-', $r->seconds, $r->q], $rows));
    }

    private function tablesWithoutPrimaryKey(): void
    {
        $rows = DB::select("
            select c.relname
            from pg_class c
            join pg_namespace n on n.oid = c.relnamespace
            where c.relkind = 'r' and n.nspname = 'public'
              and not exists (
                select 1 from pg_constraint k
                where k.conrelid = c.oid and k.contype = 'p'
              )
            order by c.relname
        ");

        $this->section('Tabele bez primarnog ključa');

        if ($rows === []) {
            $this->line('  Nema ih.');

            return;
        }

        $this->line('  Bez njega se pojedinačan red ne može pouzdano adresirati ni replicirati.');
        foreach ($rows as $r) {
            $this->line('   - '.$r->relname);
        }
    }

    private function section(string $title): void
    {
        $this->newLine();
        $this->info($title);
    }
}
