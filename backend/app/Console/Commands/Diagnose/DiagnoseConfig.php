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
 * Deliberately does not use env(). Once `config:cache` has run — and it has, on
 * any correctly deployed server — Laravel never reads the .env file again and
 * env() returns null for everything. The first version of this command did use
 * it, and on production it reported every setting as unset and all sixty keys
 * as missing, while the site ran fine on all of them.
 *
 * So: live values come from config(), and the .env comparison reads the file
 * off disk, which is the only place that answer exists.
 *
 * Read-only.
 */
class DiagnoseConfig extends Command
{
    protected $signature = 'diagnose:config';

    protected $description = 'Environment, drivers, and which .env keys are missing';

    /**
     * Settings where seeing the resolved value is the point, as
     * label => config key.
     */
    private const SHOW = [
        'APP_ENV' => 'app.env',
        'APP_DEBUG' => 'app.debug',
        'APP_URL' => 'app.url',
        'FRONTEND_URL' => 'app.frontend_url',
        'CACHE_STORE' => 'cache.default',
        'QUEUE_CONNECTION' => 'queue.default',
        'SESSION_DRIVER' => 'session.driver',
        'BROADCAST_CONNECTION' => 'broadcasting.default',
        'DB_CONNECTION' => 'database.default',
        'MAIL_MAILER' => 'mail.default',
        'FILESYSTEM_DISK' => 'filesystems.default',
        'TURNSTILE_ENABLED' => 'services.turnstile.enabled',
    ];

    public function handle(): int
    {
        $cached = file_exists(base_path('bootstrap/cache/config.php'));

        $this->newLine();
        $this->info('Okruženje');

        foreach (self::SHOW as $label => $key) {
            $value = config($key);

            $shown = match (true) {
                $value === null => '(nije postavljeno)',
                is_bool($value) => var_export($value, true),
                is_array($value) => implode(', ', $value),
                default => (string) $value,
            };

            $this->line(sprintf('  %-22s %s', $label, $shown));
        }

        if (config('app.debug') && config('app.env') === 'production') {
            $this->newLine();
            $this->error('  APP_DEBUG je uključen na produkciji.');
            $this->line('  Svaka greška vraća posjetiocu putanje, dio koda i vrijednosti varijabli.');
        }

        $this->missingKeys();
        $this->secretsPresent();

        $this->newLine();
        $this->info('Keširano');
        $this->line('  config: '.($cached ? 'da' : 'NE — svaki zahtjev čita .env s diska'));
        $this->line('  rute:   '.(file_exists(base_path('bootstrap/cache/routes-v7.php')) ? 'da' : 'NE'));

        return self::SUCCESS;
    }

    /**
     * .env.example is the checklist this project wrote for itself. Anything in
     * it that is absent from .env is a feature configured to fail quietly.
     */
    private function missingKeys(): void
    {
        $this->newLine();
        $this->info('Ključevi iz .env.example kojih nema u .env');

        $example = $this->keysIn(base_path('.env.example'));
        $actual = $this->keysIn(base_path('.env'));

        if ($example === null) {
            $this->line('  Nema .env.example za poređenje.');

            return;
        }

        if ($actual === null) {
            $this->line('  Nema .env fajla — konfiguracija dolazi iz okruženja procesa.');
            $this->line('  Tada se ovo ne može provjeriti odavde.');

            return;
        }

        $missing = array_values(array_diff(array_keys($example), array_keys($actual)));

        if ($missing === []) {
            $this->line('  Nijedan — sve što primjer traži postoji.');

            return;
        }

        foreach ($missing as $key) {
            $this->line('   - '.$key);
        }

        $this->line('  (Neki su možda namjerno izostavljeni. Vrijedi proći redom.)');
    }

    /**
     * Keys whose absence breaks a feature silently — the integration simply
     * never runs. Never prints the value, only whether there is one.
     */
    private function secretsPresent(): void
    {
        $actual = $this->keysIn(base_path('.env'));

        if ($actual === null) {
            return;
        }

        $watch = [
            'APP_KEY' => 'šifrovanje sesija i tokena',
            'REVALIDATE_SECRET_TOKEN' => 'ISR revalidacija fronta',
            'DISCORD_CLIENT_SECRET' => 'Discord prijava',
            'DISCORD_BOT_SECRET' => 'bot prema backendu',
            'BLIZZARD_CLIENT_SECRET' => 'WoW analizator',
            'GEMINI_API_KEY' => 'AI analiza',
            'PAYPAL_CLIENT_SECRET' => 'naplata',
            'TURNSTILE_SECRET_KEY' => 'zaštita formi',
            'REDIS_PASSWORD' => 'Redis autentikacija',
        ];

        $empty = [];

        foreach ($watch as $key => $what) {
            if (! isset($actual[$key]) || trim($actual[$key], "\"' ") === '') {
                $empty[] = [$key, $what];
            }
        }

        $this->newLine();
        $this->info('Tajne bez kojih dio sistema tiho ne radi');

        if ($empty === []) {
            $this->line('  Sve postavljene.');

            return;
        }

        foreach ($empty as [$key, $what]) {
            $this->line(sprintf('   - %-26s %s', $key, $what));
        }
    }

    /**
     * @return array<string, string>|null key => raw value, or null if unreadable
     */
    private function keysIn(string $path): ?array
    {
        if (! is_readable($path)) {
            return null;
        }

        $keys = [];

        foreach (file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
            $line = trim($line);

            if ($line === '' || str_starts_with($line, '#') || ! str_contains($line, '=')) {
                continue;
            }

            [$key, $value] = explode('=', $line, 2);
            $key = trim($key);

            if ($key !== '') {
                $keys[$key] = trim($value);
            }
        }

        return $keys;
    }
}
