<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * The seven questions P6 could not answer from the code.
 *
 * Every one of these is about rows that exist on the real database and point at
 * something that does not, or at something they should not point at twice.
 * Read-only: it counts, it never deletes.
 *
 * Run it before `migrate` — check 1 tells you how many orphaned replies the
 * comments foreign-key migration is about to remove.
 */
class DiagnoseOrphans extends Command
{
    protected $signature = 'diagnose:orphans {--details : Show example rows where a check finds something}';

    protected $description = 'Count orphaned and inconsistent rows — the checks from docs/47';

    public function handle(): int
    {
        $this->newLine();
        $this->info('Integrity checks — nothing here writes to the database.');
        $this->newLine();

        $rows = [];
        $findings = 0;

        foreach ($this->checks() as $check) {
            [$label, $sql, $expected] = $check;

            try {
                $count = (int) (DB::select($sql)[0]->c ?? 0);
            } catch (\Throwable $e) {
                $rows[] = [$label, '—', 'ne mogu provjeriti: '.substr($e->getMessage(), 0, 60)];

                continue;
            }

            $ok = $expected($count);
            if (! $ok) {
                $findings++;
            }

            $rows[] = [
                $label,
                number_format($count),
                $ok ? 'u redu' : '← pogledati',
            ];
        }

        $this->table(['Provjera', 'Broj', 'Stanje'], $rows);

        // Two checks answer with a breakdown rather than a single number.
        $this->breakdown('Statusi narudžbi (moraju biti mala slova)', 'orders', 'status');
        $this->activeSeasons();

        $this->newLine();

        if ($findings === 0) {
            $this->info('Ništa od ovoga ne traži pažnju.');
        } else {
            $this->warn($findings.' provjera(e) traži pogled — vidi docs/47-p6-integritet-podataka.md.');
        }

        $this->line('Ponovljene isplate (P4), ako ih ima:');
        $this->repeatedPayouts();

        return self::SUCCESS;
    }

    /** @return array<int, array{0:string,1:string,2:callable}> */
    private function checks(): array
    {
        $zero = fn (int $n) => $n === 0;

        return [
            [
                'Odgovori bez roditelja',
                'select count(*) c from comments where parent_id is not null and parent_id not in (select id from comments)',
                $zero,
            ],
            [
                'Korisnici na obrisanom rangu',
                'select count(*) c from users where rank_id is not null and rank_id not in (select id from ranks)',
                $zero,
            ],
            [
                'Pogledi na obrisan članak',
                'select count(*) c from article_views where article_id not in (select id from articles)',
                $zero,
            ],
            [
                'Pogledi na obrisan vodič',
                'select count(*) c from guide_views where guide_id not in (select id from guides)',
                $zero,
            ],
            [
                'Pogledi na obrisanu recenziju',
                'select count(*) c from review_views where review_id not in (select id from reviews)',
                $zero,
            ],
            [
                'Ocjene bez povezane igre',
                'select count(*) c from game_ratings where game_id is null',
                $zero,
            ],
            [
                'Aktivnih sezona (0 ili 1)',
                'select count(*) c from seasons where is_active = true',
                fn (int $n) => $n <= 1,
            ],
        ];
    }

    /**
     * More than one season flagged active is not a number you can act on — you
     * need to see which ones, and which of them Season::active() actually
     * picks (lowest id whose dates still contain today).
     */
    private function activeSeasons(): void
    {
        if (! Schema::hasTable('seasons')) {
            return;
        }

        $seasons = DB::table('seasons')
            ->where('is_active', true)
            ->orderBy('id')
            ->get(['id', 'name', 'slug', 'start_date', 'end_date', 'xp_multiplier', 'bounty_multiplier']);

        if ($seasons->count() <= 1) {
            return;
        }

        $this->newLine();
        $this->warn('Više od jedne sezone je označeno kao aktivna:');

        $now = now();
        $chosen = null;

        foreach ($seasons as $s) {
            $running = (! $s->start_date || $s->start_date <= $now)
                && (! $s->end_date || $s->end_date >= $now);

            if ($running && $chosen === null) {
                $chosen = $s->id;
            }
        }

        $this->table(
            ['id', 'naziv', 'počinje', 'završava', 'XP ×', 'bounty ×', 'stanje'],
            $seasons->map(function ($s) use ($now, $chosen) {
                $running = (! $s->start_date || $s->start_date <= $now)
                    && (! $s->end_date || $s->end_date >= $now);

                return [
                    $s->id,
                    $s->name,
                    $s->start_date ? substr((string) $s->start_date, 0, 10) : '—',
                    $s->end_date ? substr((string) $s->end_date, 0, 10) : '—',
                    $s->xp_multiplier,
                    $s->bounty_multiplier,
                    $s->id === $chosen ? 'OVA se primjenjuje' : ($running ? 'traje, ignorisana' : 'istekla'),
                ];
            })->all()
        );

        $this->line('  Questovi vezani za ignorisanu sezonu ne napreduju.');
        $this->line('  Ugasi `is_active` na onoj koja ne treba biti aktivna.');
    }

    private function breakdown(string $title, string $table, string $column): void
    {
        if (! Schema::hasTable($table)) {
            return;
        }

        try {
            $rows = DB::table($table)
                ->select($column, DB::raw('count(*) as c'))
                ->groupBy($column)
                ->orderByDesc('c')
                ->get();
        } catch (\Throwable) {
            return;
        }

        if ($rows->isEmpty()) {
            return;
        }

        $this->newLine();
        $this->line($title.':');

        foreach ($rows as $row) {
            $value = $row->{$column};
            $shown = is_bool($value) ? var_export($value, true) : (string) ($value ?? 'null');
            $this->line(sprintf('  %-24s %s', $shown, number_format((int) $row->c)));
        }
    }

    /**
     * Whether anyone was paid twice for the same thing before P4 introduced the
     * idempotency key. Historic only — the ledger refuses a repeat now.
     */
    private function repeatedPayouts(): void
    {
        try {
            $rows = DB::table('bounty_transactions')
                ->select('user_id', 'reason', DB::raw('count(*) as c'))
                ->where(function ($q) {
                    $q->where('reason', 'like', 'Game completed:%')
                        ->orWhere('reason', 'like', 'Game review written:%');
                })
                ->groupBy('user_id', 'reason')
                ->havingRaw('count(*) > 1')
                ->orderByDesc('c')
                ->limit(20)
                ->get();
        } catch (\Throwable $e) {
            $this->line('  ne mogu provjeriti: '.$e->getMessage());

            return;
        }

        if ($rows->isEmpty()) {
            $this->line('  nema — nijedna isplata se nije ponovila.');

            return;
        }

        $this->table(
            ['user_id', 'razlog', 'puta'],
            $rows->map(fn ($r) => [$r->user_id, $r->reason, $r->c])->all()
        );
    }
}
