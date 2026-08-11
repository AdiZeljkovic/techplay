<?php

namespace App\Console\Commands\Diagnose;

use Illuminate\Console\Command;

/**
 * What this machine is actually configured to be.
 *
 * Never prints a value that could be a secret — only whether it is set, plus
 * the handful of settings where the value is itself the finding: APP_DEBUG on a
 * live site, or a driver that quietly fell back to `file` because the intended
 * one was never configured.
 *
 * Read-only.
 */
class DiagnoseConfig extends Command
{
    protected $signature = 'diagnose:config';

    protected $description = 'Environment, drivers, and which .env keys are missing';

    /** Settings where seeing the value is the point. */
    private const SHOW = [
        'APP_ENV', 'APP_DEBUG', 'APP_URL',
        'CACHE_STORE', 'QUEUE_CONNECTION', 'SESSION_DRIVER',
        'BROADCAST_CONNECTION', 'DB_CONNECTION', 'MAIL_MAILER',
        'TRUSTED_PROXIES', 'TURNSTILE_ENABLED',
    ];

    public function handle(): int
    {
        $this->newLine();
        $this->info('Okruženje');

        foreach (self::SHOW as $key) {
            $value = env($key);
            $shown = $value === null
                ? '(nije postavljeno)'
                : (is_bool($value) ? var_export($value, true) : (string) $value);

            $this->line(sprintf('  %-24s %s', $key, $shown));
        }

        if (filter_var(env('APP_DEBUG'), FILTER_VALIDATE_BOOL) && env('APP_ENV') === 'production') {
            $this->newLine();
            $this->error('  APP_DEBUG je uključen na produkciji.');
            $this->line('  Svaka greška vraća posjetiocu putanje, dio koda i vrijednosti varijabli.');
        }

        $this->missingKeys();
        $this->cachedConfig();

        return self::SUCCESS;
    }

    /**
     * .env.example is the checklist this project wrote for itself. Anything in
     * it that is absent here is a feature configured to fail quietly.
     */
    private function missingKeys(): void
    {
        $examplePath = base_path('.env.example');

        $this->newLine();
        $this->info('Ključevi iz .env.example kojih ovdje nema');

        if (! is_readable($examplePath)) {
            $this->line('  Nema .env.example za poređenje.');

            return;
        }

        $missing = [];

        foreach (file($examplePath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
            $line = trim($line);

            if ($line === '' || str_starts_with($line, '#') || ! str_contains($line, '=')) {
                continue;
            }

            $key = trim(explode('=', $line, 2)[0]);

            if ($key !== '' && env($key) === null) {
                $missing[] = $key;
            }
        }

        if ($missing === []) {
            $this->line('  Nijedan — sve što primjer traži je postavljeno.');

            return;
        }

        foreach ($missing as $key) {
            $this->line('   - '.$key);
        }

        $this->line('  (Neki su možda namjerno prazni. Vrijedi proći redom.)');
    }

    private function cachedConfig(): void
    {
        $this->newLine();
        $this->info('Keširano');
        $this->line('  config: '.(file_exists(base_path('bootstrap/cache/config.php'))
            ? 'da'
            : 'NE — svaki zahtjev čita .env s diska'));
        $this->line('  rute:   '.(file_exists(base_path('bootstrap/cache/routes-v7.php')) ? 'da' : 'NE'));
    }
}
