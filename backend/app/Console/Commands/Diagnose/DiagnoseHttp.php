<?php

namespace App\Console\Commands\Diagnose;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;

/**
 * What the site actually sends back, measured from the machine itself.
 *
 * Headers are the one area where the code is not the answer: nginx and
 * Cloudflare both add and strip things on the way out, so the only honest way
 * to know what a visitor receives is to ask for a page and read the response.
 *
 * Read-only — plain GETs against the public site.
 */
class DiagnoseHttp extends Command
{
    protected $signature = 'diagnose:http {--url= : Override the site URL}';

    protected $description = 'Security headers, cookie flags, robots.txt and TLS expiry, as served';

    /** Headers worth having, and what each is for. */
    private const EXPECTED = [
        'strict-transport-security' => 'drži posjetioca na HTTPS-u i nakon prvog posjeta',
        'x-content-type-options' => 'sprječava da browser pogađa tip sadržaja',
        'x-frame-options' => 'sprječava učitavanje sajta u tuđem okviru',
        'referrer-policy' => 'ograničava šta se odaje pri odlasku s sajta',
        'content-security-policy' => 'ograničava odakle se smiju učitati skripte',
        'permissions-policy' => 'gasi kameru, mikrofon i ostalo što nam ne treba',
    ];

    public function handle(): int
    {
        // frontend_url can hold a comma-separated allow-list (it doubles as the
        // CORS origin list in dev). The first entry is the site itself.
        $configured = explode(',', (string) config('app.frontend_url'))[0];
        $url = rtrim(trim((string) ($this->option('url') ?: $configured ?: 'https://techplay.gg')), '/');

        $this->newLine();
        $this->info('Mjereno prema '.$url);

        try {
            $response = Http::withOptions(['allow_redirects' => true])->timeout(15)->get($url);
        } catch (\Throwable $e) {
            $this->error('  Ne mogu dohvatiti: '.$e->getMessage());

            // Windows PHP ships without a CA bundle unless curl.cainfo is set,
            // so this fails locally against a site whose certificate is fine.
            if (str_contains($e->getMessage(), 'unable to get local issuer certificate')) {
                $this->line('  Ovo je lokalni CA bundle (curl.cainfo u php.ini), nije problem sajta.');
                $this->line('  Na serveru radi. Ovdje se preskače.');
            }

            return self::FAILURE;
        }

        $headers = [];
        foreach ($response->headers() as $name => $values) {
            $headers[strtolower($name)] = implode(', ', $values);
        }

        $this->securityHeaders($headers);
        $this->cookies($response->headers()['Set-Cookie'] ?? []);
        $this->robots($url);
        $this->tls($url);

        return self::SUCCESS;
    }

    private function securityHeaders(array $headers): void
    {
        $this->newLine();
        $this->info('Sigurnosni headeri');

        foreach (self::EXPECTED as $name => $why) {
            if (isset($headers[$name])) {
                $this->line(sprintf('  ✓ %-30s %s', $name, mb_substr($headers[$name], 0, 46)));
            } else {
                $this->line(sprintf('  ✗ %-30s nedostaje — %s', $name, $why));
            }
        }

        foreach (['server', 'x-powered-by'] as $leaky) {
            if (isset($headers[$leaky])) {
                $this->newLine();
                $this->warn('  '.$leaky.': '.$headers[$leaky]);
                $this->line('  Odaje šta i koje verzije vrtimo. Nije rupa, ali je besplatna informacija napadaču.');
            }
        }
    }

    private function cookies(array $cookies): void
    {
        if ($cookies === []) {
            return;
        }

        $this->newLine();
        $this->info('Kolačići');

        foreach ($cookies as $cookie) {
            $name = trim(explode('=', $cookie, 2)[0]);
            $flags = [];

            foreach (['Secure', 'HttpOnly', 'SameSite'] as $flag) {
                if (stripos($cookie, $flag) === false) {
                    $flags[] = 'bez '.$flag;
                }
            }

            $this->line(sprintf('  %-28s %s', $name, $flags === [] ? 'u redu' : implode(', ', $flags)));
        }
    }

    private function robots(string $url): void
    {
        $this->newLine();
        $this->info('robots.txt');

        try {
            $r = Http::timeout(10)->get($url.'/robots.txt');
        } catch (\Throwable $e) {
            $this->line('  ne mogu dohvatiti: '.$e->getMessage());

            return;
        }

        if (! $r->successful()) {
            $this->warn('  vraća '.$r->status());

            return;
        }

        $body = $r->body();

        if (preg_match('/^\s*Disallow:\s*\/\s*$/mi', $body)) {
            $this->error('  Disallow: /  — ovo govori pretraživačima da ne indeksiraju ništa.');
        } else {
            $this->line('  postoji, ne blokira cijeli sajt');
        }

        if (! preg_match('/Sitemap:/i', $body)) {
            $this->line('  nema Sitemap: linije');
        }
    }

    private function tls(string $url): void
    {
        $host = parse_url($url, PHP_URL_HOST);

        if (! $host || parse_url($url, PHP_URL_SCHEME) !== 'https') {
            return;
        }

        $this->newLine();
        $this->info('TLS');

        $context = stream_context_create(['ssl' => ['capture_peer_cert' => true]]);
        $client = @stream_socket_client("ssl://{$host}:443", $errno, $errstr, 10,
            STREAM_CLIENT_CONNECT, $context);

        if (! $client) {
            $this->line('  ne mogu se povezati: '.$errstr);

            return;
        }

        $params = stream_context_get_params($client);
        $cert = openssl_x509_parse($params['options']['ssl']['peer_certificate']);
        fclose($client);

        $expires = (int) ($cert['validTo_time_t'] ?? 0);
        $days = (int) floor(($expires - time()) / 86400);

        $this->line('  izdat za: '.($cert['subject']['CN'] ?? '?'));
        $this->line('  ističe:   '.date('Y-m-d', $expires)."  (za {$days} dana)");

        if ($days < 21) {
            $this->error('  Manje od tri sedmice — provjeri da obnova radi sama.');
        }
    }
}
