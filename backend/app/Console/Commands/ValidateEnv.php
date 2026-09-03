<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

/**
 * What the application will actually see when it runs.
 *
 * This used to read env() and refuse to run whenever the configuration was
 * cached — which is every moment of production's life, since `config:cache` is
 * a deploy step. So the one tool built to catch a missing credential could
 * never be pointed at the machine that had one.
 *
 * It now reads config(), which is the layer the application itself reads. That
 * makes it work cached or not, and it makes the answer true rather than merely
 * available: after `config:cache` the .env file is no longer consulted by
 * anything, so a value present there and absent from the cache is absent.
 *
 * What it would have caught on 29 Aug 2026: DISCORD_CLIENT_SECRET missing, so
 * every Discord sign-in came back from Discord and died on a 401 — found in the
 * logs by accident, three real attempts later.
 */
class ValidateEnv extends Command
{
    protected $signature = 'env:validate';

    protected $description = 'Check the configuration the application will actually run with';

    /** @var array<int, array{0: string, 1: string, 2: string}> */
    private array $rows = [];

    private int $fatal = 0;

    private int $broken = 0;

    public function handle(): int
    {
        $this->line(app()->configurationIsCached()
            ? 'Reading the cached configuration — the same one the running app sees.'
            : 'Reading configuration from source (not cached).');
        $this->newLine();

        $this->checkFoundations();
        $this->checkIntegrations();
        $this->checkAlerting();

        $this->table(['', 'Area', 'Detail'], $this->rows);

        if ($this->fatal > 0) {
            $this->error("{$this->fatal} fatal: the site cannot serve correctly like this.");
        }

        if ($this->broken > 0) {
            $this->warn("{$this->broken} feature(s) unavailable — the site runs, these do not.");
        }

        if ($this->fatal === 0 && $this->broken === 0) {
            $this->info('Everything the application needs is configured.');
        }

        $this->newLine();

        return $this->fatal > 0 ? 1 : 0;
    }

    /**
     * Without these the site does not serve, so they stop a deploy.
     */
    private function checkFoundations(): void
    {
        $this->require('app', 'APP_KEY', filled(config('app.key')) && strlen((string) config('app.key')) > 20);
        $this->require('app', 'APP_URL', filled(config('app.url')));
        $this->require('app', 'FRONTEND_URL', filled(config('app.frontend_url')));

        $connection = config('database.default');
        $db = config("database.connections.{$connection}");

        $this->require('database', "connection [{$connection}]", is_array($db));
        $this->require('database', 'database name', filled($db['database'] ?? null));
        $this->require('database', 'password', filled($db['password'] ?? null));

        // Server-side rendering identifies itself with this to escape the
        // 60/min per-IP limiter. Without it every SSR request on the site shares
        // one visitor's budget and readers are shown missing pages under load.
        $this->require('api', 'INTERNAL_API_TOKEN', filled(config('services.internal.token')));

        $this->require('frontend', 'REVALIDATE_SECRET_TOKEN', filled(config('services.revalidate.secret_token')));

        // A comma-separated FRONTEND_URL is accepted by CORS and read raw by
        // RevalidationService, which then posts to a hostname that cannot
        // resolve. Local .env carries three origins; production carries one.
        $this->flagFeature(
            'frontend',
            'FRONTEND_URL is a single origin (revalidation reads it raw)',
            ! str_contains((string) config('app.frontend_url'), ','),
        );
    }

    /**
     * Each of these is one feature. Missing means that feature is down and the
     * rest of the site is fine, so they are reported, not fatal.
     */
    private function checkIntegrations(): void
    {
        $this->flagFeature('sign-in: Discord', 'DISCORD_CLIENT_ID + DISCORD_CLIENT_SECRET',
            filled(config('services.discord.client_id')) && filled(config('services.discord.client_secret')));

        $this->flagFeature('sign-in: Battle.net', 'BATTLENET_CLIENT_ID + BATTLENET_CLIENT_SECRET',
            filled(config('services.battlenet.client_id')) && filled(config('services.battlenet.client_secret')));

        $this->flagFeature('sign-up defence', 'TURNSTILE_SECRET_KEY (verification fails closed without it)',
            ! config('services.turnstile.enabled') || filled(config('services.turnstile.secret_key')));

        $this->checkTurnstileKeysAgree();

        $this->flagFeature('WoW analyzer', 'GROQ_API_KEY', filled(config('services.groq.api_key')));
        $this->flagFeature('WoW analyzer', 'BLIZZARD_CLIENT_ID + secret',
            filled(config('services.blizzard.client_id')) && filled(config('services.blizzard.client_secret')));

        $this->flagFeature('game catalogue', 'STEAM_API_KEY', filled(config('services.steam.key')));

        $this->flagFeature('Discord bot', 'DISCORD_BOT_SECRET (bot API auth fails closed)',
            filled(config('services.discord.bot_secret')));

        $this->checkPayPal();

        $this->checkMail();
    }

    /**
     * A configured mail host that does not exist is worse than none.
     *
     * Everything about the setup looks right — a mailer, a host, a port — and
     * every send fails on `getaddrinfo`. That is the state this site has been
     * in for weeks, and it takes email verification, password resets, giveaway
     * winners and the weekly digest with it. Checking that the name is set is
     * not enough, so this asks whether it resolves.
     *
     * One DNS lookup at deploy time, and only when the mailer is smtp.
     */
    private function checkMail(): void
    {
        $mailer = config('mail.default');
        $host = config("mail.mailers.{$mailer}.host");

        if ($mailer !== 'smtp') {
            $this->row('info', 'mail', "mailer [{$mailer}] — nothing leaves this machine");

            return;
        }

        if (blank($host)) {
            $this->flagFeature('mail', 'MAIL_HOST is unset', false);

            return;
        }

        $resolves = gethostbyname($host) !== $host || filter_var($host, FILTER_VALIDATE_IP);

        $this->flagFeature(
            'mail',
            $resolves ? "host {$host} resolves" : "host {$host} does not resolve — nothing can be sent",
            (bool) $resolves,
        );
    }

    /**
     * Live mode is the only mode where a missing webhook id is worse than
     * useless: the payment succeeds and the order is never marked paid.
     */
    private function checkPayPal(): void
    {
        $live = config('services.paypal.mode') === 'live';
        $credentials = filled(config('services.paypal.client_id')) && filled(config('services.paypal.secret'));
        $webhook = filled(config('services.paypal.webhook_id'));

        if (! $live) {
            $this->row('info', 'shop', 'PayPal in sandbox — no real payments'.($webhook ? '' : ', webhook id unset'));

            return;
        }

        $this->require('shop', 'PAYPAL_CLIENT_ID + PAYPAL_SECRET (live mode)', $credentials);
        $this->require('shop', 'PAYPAL_WEBHOOK_ID (live mode — paid orders stay unpaid without it)', $webhook);
    }

    /**
     * If something breaks at four in the morning, this decides whether anyone
     * finds out.
     */
    private function checkAlerting(): void
    {
        $this->flagFeature('alerts', 'TELEGRAM_ALERT_TOKEN + chat id',
            filled(config('services.telegram.token')) && filled(config('services.telegram.chat_id')));
    }

    /**
     * The two halves of the sign-up check have to be the same pair.
     *
     * The site key is compiled into the browser bundle at build time, and the
     * secret is read by the API at request time — two files, two processes,
     * and nothing that ever compared them. For months the frontend had no
     * NEXT_PUBLIC_TURNSTILE_SITE_KEY at all and ran on a value hardcoded in
     * the component, which happened to be right.
     *
     * Rotate the key and update only one side and the failure is silent and
     * total: the widget renders against a key the secret does not belong to,
     * every solved challenge is refused, and nobody can register. Worth one
     * line of a table on every deploy.
     *
     * Reported rather than fatal. A missing or unreadable frontend env file is
     * not a reason to refuse a deploy of the backend.
     */
    private function checkTurnstileKeysAgree(): void
    {
        if (! config('services.turnstile.enabled')) {
            return;
        }

        $envFile = base_path('../frontend/.env.local');

        if (! is_readable($envFile)) {
            return;
        }

        preg_match('/^NEXT_PUBLIC_TURNSTILE_SITE_KEY=(.*)$/m', (string) file_get_contents($envFile), $m);

        $frontend = trim($m[1] ?? '', " 	\"'");
        $backend = (string) config('services.turnstile.site_key');

        $this->flagFeature(
            'sign-up defence',
            'NEXT_PUBLIC_TURNSTILE_SITE_KEY matches the backend site key',
            $frontend !== '' && $backend !== '' && hash_equals($backend, $frontend),
        );
    }

    private function require(string $area, string $detail, bool $ok): void
    {
        if ($ok) {
            $this->row('ok', $area, $detail);

            return;
        }

        $this->fatal++;
        $this->row('FATAL', $area, $detail);
    }

    private function flagFeature(string $area, string $detail, bool $ok): void
    {
        if ($ok) {
            $this->row('ok', $area, $detail);

            return;
        }

        $this->broken++;
        $this->row('DOWN', $area, $detail);
    }

    private function row(string $status, string $area, string $detail): void
    {
        $mark = match ($status) {
            'ok' => '<fg=green>ok</>',
            'DOWN' => '<fg=yellow>DOWN</>',
            'FATAL' => '<fg=red>FATAL</>',
            default => '<fg=gray>info</>',
        };

        $this->rows[] = [$mark, $area, $detail];
    }
}
