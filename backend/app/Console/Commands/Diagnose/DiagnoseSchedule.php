<?php

namespace App\Console\Commands\Diagnose;

use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Support\Facades\Cache;

/**
 * Whether the scheduler is running, and what it thinks it should be doing.
 *
 * The heartbeat is the important line. A cron that stopped is silent by nature:
 * nothing fails, nothing logs, the site keeps serving, and enrichment, reminders
 * and cleanup simply never happen again. That is why the heartbeat exists — and
 * this reads it.
 *
 * Read-only.
 */
class DiagnoseSchedule extends Command
{
    protected $signature = 'diagnose:schedule';

    protected $description = 'Scheduler heartbeat and the registered task list';

    public function handle(Schedule $schedule): int
    {
        $this->newLine();
        $this->info('Otkucaj rasporeda');

        $beat = Cache::get('scheduler:heartbeat');

        if (! $beat) {
            $this->error('  NEMA OTKUCAJA.');
            $this->line('  Ili cron ne radi, ili je keš očišćen u zadnjoj minuti.');
            $this->line('  Provjeri: crontab -l | grep schedule:run');
        } else {
            // diffInSeconds is signed and fractional in Carbon 3; a heartbeat
            // written a moment ago printed as "-14.983623 s ranije".
            $age = (int) round(abs(now()->diffInSeconds(Carbon::parse($beat))));
            $this->line('  zadnji: '.$beat.'  (prije '.$age.' s)');

            if ($age > 180) {
                $this->error('  Stariji od tri minute — raspored stoji.');
            }
        }

        $events = $schedule->events();

        $this->newLine();
        $this->info('Zakazani zadaci ('.count($events).')');

        $rows = [];
        foreach ($events as $e) {
            $desc = $e->description ?: (string) $e->command;
            // The command carries the full path to the PHP binary, quoted with
            // whatever the platform quotes with. Everything up to `artisan` is
            // the same on every line and tells you nothing — cut it.
            $desc = trim(preg_replace('/^.*?artisan["\']?\s*/s', '', $desc) ?: $desc);
            $rows[] = [
                mb_substr($desc, 0, 46),
                $e->expression,
                method_exists($e, 'nextRunDate') ? substr((string) $e->nextRunDate(), 0, 19) : '-',
            ];
        }

        usort($rows, fn ($a, $b) => strcmp($a[0], $b[0]));
        $this->table(['Zadatak', 'Cron', 'Sljedeće'], $rows);

        $this->newLine();
        $this->line('  Napomena: Laravel ne pamti kad je koji zadatak zadnji put prošao.');
        $this->line('  Otkucaj gore kaže radi li raspored uopšte; za pojedinačne zadatke');
        $this->line('  postoje njihove vlastite provjere (games:enrichment-status, diagnose:queue).');

        return self::SUCCESS;
    }
}
