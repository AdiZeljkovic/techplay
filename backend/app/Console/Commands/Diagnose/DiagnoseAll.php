<?php

namespace App\Console\Commands\Diagnose;

use Illuminate\Console\Command;

/**
 * Runs every diagnostic in one go.
 *
 * The point of the suite is one command and one output to send back, so the
 * questions the code cannot answer — how long queries really take, whether
 * Redis has a ceiling, how many jobs quietly failed — get answered with numbers
 * instead of guesses.
 *
 * Everything here only reads. A check that cannot run says so and the rest
 * carries on: a missing extension or an unreachable Redis should not cost you
 * the other nine answers.
 */
class DiagnoseAll extends Command
{
    protected $signature = 'diagnose';

    protected $description = 'Run every read-only diagnostic and print one report';

    private const CHECKS = [
        'diagnose:config' => 'Okruženje i konfiguracija',
        'diagnose:db' => 'Baza — indeksi, bloat, spori upiti',
        'diagnose:orphans' => 'Integritet podataka',
        'diagnose:redis' => 'Redis — memorija, ključevi, redovi',
        'diagnose:queue' => 'Pozadinski poslovi',
        'diagnose:schedule' => 'Raspored',
        'diagnose:storage' => 'Disk i fajlovi',
        'diagnose:http' => 'Headeri i TLS, kako se stvarno serviraju',
    ];

    public function handle(): int
    {
        $this->newLine();
        $this->line(str_repeat('═', 68));
        $this->info('  TechPlay — dijagnostika  ·  '.now()->toDateTimeString());
        $this->line('  Sve provjere samo čitaju. Ništa se ne mijenja.');
        $this->line(str_repeat('═', 68));

        $failed = [];

        foreach (self::CHECKS as $command => $title) {
            $this->newLine();
            $this->line(str_repeat('─', 68));
            // mb_ — strtoupper mangles ž, č, ć and leaves them lowercase.
            $this->line('  '.mb_strtoupper($title));
            $this->line(str_repeat('─', 68));

            try {
                $this->call($command);
            } catch (\Throwable $e) {
                $failed[] = $command;
                $this->error('  Provjera nije prošla: '.$e->getMessage());
            }
        }

        $this->newLine();
        $this->line(str_repeat('═', 68));

        if ($failed === []) {
            $this->info('  Sve provjere su se izvršile.');
        } else {
            $this->warn('  Nisu se izvršile: '.implode(', ', $failed));
        }

        $this->line('  Pošalji cijeli ovaj izlaz — brojke su ono što se iz koda ne vidi.');
        $this->line(str_repeat('═', 68));
        $this->newLine();

        return self::SUCCESS;
    }
}
