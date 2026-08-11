<?php

namespace App\Console\Commands\Diagnose;

use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * What the background work has been doing while nobody watched.
 *
 * Every job in this app catches its own errors and logs a warning, which is
 * right — one bad game should not stop an enrichment run. The cost is that a
 * systematic failure looks exactly like a quiet night. failed_jobs is the one
 * place it cannot hide.
 *
 * Read-only.
 */
class DiagnoseQueue extends Command
{
    protected $signature = 'diagnose:queue';

    protected $description = 'Failed jobs by class, oldest waiting job, retry patterns';

    public function handle(): int
    {
        if (! Schema::hasTable('failed_jobs')) {
            $this->error('Nema tabele failed_jobs.');

            return self::FAILURE;
        }

        $this->failedByClass();
        $this->failureTimeline();
        $this->pending();

        return self::SUCCESS;
    }

    private function failedByClass(): void
    {
        $rows = DB::table('failed_jobs')->get(['payload', 'exception', 'failed_at']);

        $this->newLine();
        $this->info('Pali poslovi');

        if ($rows->isEmpty()) {
            $this->line('  Nijedan. To je dobra vijest samo ako je red uopšte radio — vidi diagnose:schedule.');

            return;
        }

        $byClass = [];
        foreach ($rows as $r) {
            $payload = json_decode((string) $r->payload, true);
            $class = $payload['displayName'] ?? 'nepoznato';
            $reason = trim(explode("\n", (string) $r->exception)[0] ?? '');
            $byClass[$class]['count'] = ($byClass[$class]['count'] ?? 0) + 1;
            $byClass[$class]['last'] = $r->failed_at;
            $byClass[$class]['reason'] = mb_substr($reason, 0, 70);
        }

        uasort($byClass, fn ($a, $b) => $b['count'] <=> $a['count']);

        $this->table(['Posao', 'Puta', 'Zadnji put', 'Razlog'],
            array_map(fn ($k, $v) => [
                class_basename($k), $v['count'],
                substr((string) $v['last'], 0, 19), $v['reason'],
            ], array_keys($byClass), $byClass));
    }

    private function failureTimeline(): void
    {
        $rows = DB::table('failed_jobs')
            ->selectRaw('date(failed_at) as d, count(*) as c')
            ->groupBy('d')->orderByDesc('d')->limit(10)->get();

        if ($rows->isEmpty()) {
            return;
        }

        $this->newLine();
        $this->line('  Po danima — jedan skok znači incident, ravna linija znači nešto trajno pokvareno:');
        foreach ($rows as $r) {
            $this->line(sprintf('    %s  %s', $r->d, str_repeat('▪', min(40, (int) $r->c)).' '.$r->c));
        }
    }

    private function pending(): void
    {
        $this->newLine();
        $this->info('Poslovi koji čekaju');

        if (! Schema::hasTable('jobs')) {
            $this->line('  Red je na Redisu, ne u bazi — dubina je u diagnose:redis.');

            return;
        }

        $count = DB::table('jobs')->count();
        $this->line('  u redu: '.number_format($count));

        if ($count === 0) {
            return;
        }

        $oldest = DB::table('jobs')->orderBy('created_at')->first();
        if ($oldest && isset($oldest->created_at)) {
            $age = now()->diffInMinutes(Carbon::createFromTimestamp($oldest->created_at));
            $this->line('  najstariji čeka: '.$age.' min');

            if ($age > 30) {
                $this->warn('  Toliko dugo znači da radnik vjerovatno ne radi.');
            }
        }
    }
}
