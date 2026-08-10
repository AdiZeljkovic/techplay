<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 * Where the database actually spends its disk.
 *
 * Three numbers per table, because they fail in different ways: the heap is
 * the rows themselves, indexes are the price of reading them quickly, and
 * TOAST is the out-of-line storage for large values — long descriptions, JSON
 * blobs, arrays. A table whose TOAST dwarfs its heap is usually one holding a
 * payload it does not need to keep.
 *
 * Tables with no retention policy are flagged. They grow forever by design:
 * one row per view, per notification, per signal. On a single VPS where
 * Postgres shares a disk with everything else, that is how the site eventually
 * stops accepting writes.
 */
class DatabaseSizes extends Command
{
    protected $signature = 'db:sizes {--limit=25 : How many tables to show} {--all : Show every table}';

    protected $description = 'Disk usage per table — heap, indexes, TOAST and row counts';

    /**
     * Tables that grow with traffic and have nothing pruning them.
     *
     * The three view tables used to be listed here and should not have been:
     * `views:clean` runs daily and keeps seven days. Claiming otherwise sent
     * anyone reading this output looking for a retention policy that was
     * already there.
     */
    private const UNBOUNDED = [
        'notifications', 'player_signals', 'article_reads',
        'sessions', 'jobs', 'failed_jobs', 'cache', 'cache_locks',
        'content_versions', 'broken_links', 'ad_impressions',
    ];

    public function handle(): int
    {
        if (DB::getDriverName() !== 'pgsql') {
            $this->error('This reads PostgreSQL catalogues; the current connection is '.DB::getDriverName().'.');

            return self::FAILURE;
        }

        $limit = $this->option('all') ? 1000 : max(1, (int) $this->option('limit'));

        $rows = DB::select("
            select
                c.relname                                              as table_name,
                pg_total_relation_size(c.oid)                          as total_bytes,
                pg_table_size(c.oid) - coalesce(pg_total_relation_size(c.reltoastrelid), 0) as heap_bytes,
                pg_indexes_size(c.oid)                                 as index_bytes,
                coalesce(pg_total_relation_size(c.reltoastrelid), 0)   as toast_bytes,
                c.reltuples::bigint                                    as approx_rows
            from pg_class c
            join pg_namespace n on n.oid = c.relnamespace
            where c.relkind = 'r'
              and n.nspname = 'public'
            order by pg_total_relation_size(c.oid) desc
        ");

        if ($rows === []) {
            $this->warn('No tables found.');

            return self::SUCCESS;
        }

        $grandTotal = array_sum(array_map(fn ($r) => (int) $r->total_bytes, $rows));

        $this->newLine();
        $this->info('Database total: '.$this->human($grandTotal).'  across '.count($rows).' tables');
        $this->line('  heap = the rows · idx = indexes · toast = out-of-line values (text, json, arrays)');
        $this->newLine();

        $body = [];
        foreach (array_slice($rows, 0, $limit) as $r) {
            $total = (int) $r->total_bytes;
            $share = $grandTotal > 0 ? round($total / $grandTotal * 100, 1) : 0;

            $name = $r->table_name;
            if (in_array($name, self::UNBOUNDED, true)) {
                $name .= ' *';
            }

            $body[] = [
                $name,
                $this->human($total),
                $share.'%',
                $this->human((int) $r->heap_bytes),
                $this->human((int) $r->index_bytes),
                $this->human((int) $r->toast_bytes),
                number_format(max(0, (int) $r->approx_rows)),
            ];
        }

        $this->table(['Table', 'Total', 'Share', 'Heap', 'Idx', 'Toast', '~Rows'], $body);

        if (! $this->option('all') && count($rows) > $limit) {
            $shown = array_sum(array_map(fn ($r) => (int) $r->total_bytes, array_slice($rows, 0, $limit)));
            $this->line(sprintf('  … and %d smaller tables totalling %s. Use --all to see them.',
                count($rows) - $limit, $this->human($grandTotal - $shown)));
        }

        // ── the ones that only ever grow ──
        $unbounded = array_filter($rows, fn ($r) => in_array($r->table_name, self::UNBOUNDED, true));
        $unboundedBytes = array_sum(array_map(fn ($r) => (int) $r->total_bytes, $unbounded));

        $this->newLine();
        $this->line('  * no retention policy — these grow with traffic and nothing prunes them.');
        $this->line('    Currently '.$this->human($unboundedBytes).' ('
            .($grandTotal > 0 ? round($unboundedBytes / $grandTotal * 100, 1) : 0).'% of the database).');

        // ── dead rows, which is disk you have already paid for ──
        $bloat = DB::select("
            select relname, n_dead_tup, n_live_tup, last_autovacuum
            from pg_stat_user_tables
            where n_dead_tup > 10000
            order by n_dead_tup desc
            limit 10
        ");

        if ($bloat !== []) {
            $this->newLine();
            $this->info('Dead rows waiting on vacuum');
            $this->line('  Space already allocated but not reusable until autovacuum catches up.');
            $this->table(
                ['Table', 'Dead', 'Live', 'Last autovacuum'],
                array_map(fn ($b) => [
                    $b->relname,
                    number_format((int) $b->n_dead_tup),
                    number_format((int) $b->n_live_tup),
                    $b->last_autovacuum ? substr((string) $b->last_autovacuum, 0, 19) : 'never',
                ], $bloat)
            );
        }

        return self::SUCCESS;
    }

    private function human(int $bytes): string
    {
        if ($bytes < 1024) {
            return $bytes.' B';
        }

        foreach (['KB', 'MB', 'GB', 'TB'] as $i => $unit) {
            $value = $bytes / (1024 ** ($i + 1));
            if ($value < 1024 || $unit === 'TB') {
                return round($value, $value < 10 ? 1 : 0).' '.$unit;
            }
        }

        return $bytes.' B';
    }
}
