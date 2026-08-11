<?php

namespace App\Console\Commands\Diagnose;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Route;

/**
 * How long the public API actually takes, measured from the machine serving it.
 *
 * Reading a controller tells you what it does, never what it costs. An endpoint
 * that looks trivial can sit behind an unindexed sort; one that looks heavy can
 * be served entirely from Redis. The only honest answer is to ask for it and
 * hold a stopwatch.
 *
 * The route list is discovered, not written down, so an endpoint added next
 * month is measured without anyone remembering to add it here.
 *
 * Read-only. Only parameterless GET routes are called, and anything whose name
 * suggests it records something is skipped — see SIDE_EFFECTS.
 */
class DiagnosePerf extends Command
{
    protected $signature = 'diagnose:perf
        {--base= : Base URL to measure (default APP_URL)}
        {--samples=3 : Requests per endpoint}
        {--limit=40 : Maximum endpoints}
        {--delay=0 : Milliseconds to wait between requests, to stay under the rate limit}
        {--host= : Host header to send, when measuring the app directly behind the proxy}';

    protected $description = 'Response time per public GET endpoint, measured end to end';

    /**
     * A GET that writes something. Rare, but they exist — view counters and
     * ping endpoints are GETs by habit — and this command must not trip them.
     */
    private const SIDE_EFFECTS = [
        'track', 'view', 'increment', 'revalidate', 'ping', 'sync',
        'claim', 'read', 'seen', 'visit', 'redirect', 'callback', 'webhook',
    ];

    /** Middleware that means the route needs a token we do not have. */
    private const NEEDS_AUTH = ['auth', 'auth:sanctum', 'auth:api', 'verified'];

    public function handle(): int
    {
        $base = rtrim((string) ($this->option('base') ?: config('app.url')), '/');
        $samples = max(1, (int) $this->option('samples'));
        $limit = max(1, (int) $this->option('limit'));
        $delay = max(0, (int) $this->option('delay')) * 1000;

        $paths = $this->publicGetPaths($limit);

        $this->newLine();
        $this->info('Vrijeme odgovora — '.$base);

        if ($paths === []) {
            $this->line('  Nijedna javna GET ruta bez parametra.');

            return self::SUCCESS;
        }

        $this->line(sprintf('  %d ruta, %d mjerenja svaka. Mjeri se cijeli put: PHP, baza, keš.',
            count($paths), $samples));

        $rows = [];
        $bar = $this->output->createProgressBar(count($paths));
        $bar->start();

        foreach ($paths as $path) {
            $times = [];
            $status = null;

            for ($i = 0; $i < $samples; $i++) {
                if ($delay > 0) {
                    usleep($delay);
                }

                $started = microtime(true);

                try {
                    $response = Http::timeout(20)
                        ->acceptJson()
                        ->withHeaders($this->headers())
                        ->get($base.'/'.$path);
                    $status = $response->status();
                } catch (\Throwable) {
                    $status = 0;
                    break;
                }

                $times[] = (microtime(true) - $started) * 1000;
            }

            if ($times !== []) {
                sort($times);
                $rows[] = [$path, $status, $times[intdiv(count($times), 2)], min($times), max($times)];
            } else {
                $rows[] = [$path, $status, null, null, null];
            }

            $bar->advance();
        }

        $bar->finish();
        $this->newLine(2);

        usort($rows, fn ($a, $b) => ($b[2] ?? -1) <=> ($a[2] ?? -1));

        $this->table(
            ['Ruta', 'Status', 'Medijan', 'Najbrže', 'Najsporije'],
            array_map(fn ($r) => [
                mb_substr($r[0], 0, 46),
                $this->statusLabel($r[1]),
                $r[2] === null ? '-' : round($r[2]).' ms',
                $r[3] === null ? '-' : round($r[3]).' ms',
                $r[4] === null ? '-' : round($r[4]).' ms',
            ], $rows)
        );

        $this->summarise($rows);

        return self::SUCCESS;
    }

    /**
     * A default Guzzle User-Agent is exactly what a WAF drops. Measuring the
     * refusal instead of the endpoint produces a table of identical, very fast,
     * completely meaningless numbers — which is what the first production run
     * of this command produced: fifteen routes, all 403, all about 52 ms.
     */
    private function headers(): array
    {
        $headers = [
            'User-Agent' => 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 '.
                '(KHTML, like Gecko) Chrome/126.0 Safari/537.36 TechPlayDiagnose/1.0',
            'Accept-Language' => 'en-US,en;q=0.9',
        ];

        if ($host = $this->option('host')) {
            $headers['Host'] = $host;
            $headers['Origin'] = 'https://'.$host;
        }

        return $headers;
    }

    private function summarise(array $rows): void
    {
        // Every route answering with the same non-2xx status means something in
        // front of the application answered them all: a WAF, a proxy rule, an
        // origin check. Whatever the numbers say, they are not about the app.
        $statuses = array_unique(array_map(fn ($r) => $r[1], $rows));

        if (count($rows) > 3 && count($statuses) === 1 && ! in_array((int) reset($statuses), [200, 204], true)) {
            $only = (int) reset($statuses);

            $this->newLine();
            $this->error("  Sve rute su vratile {$only}. Ovo nije mjerenje aplikacije.");
            $this->line('  Nešto ispred Laravela odgovara na sve — nginx pravilo, WAF ili');
            $this->line('  provjera porijekla. Brojke iznad su vrijeme tog odbijanja.');
            $this->newLine();
            $this->line('  Mjeri iza ruba, direktno na aplikaciju:');
            $this->line('    php artisan diagnose:perf --base=http://127.0.0.1:8000 --host='.parse_url((string) ($this->option('base') ?: config('app.url')), PHP_URL_HOST));
            $this->line('  (port je onaj na kojem sluša Octane; provjeri u supervisor konfiguraciji)');

            return;
        }

        $timed = array_values(array_filter($rows, fn ($r) => $r[2] !== null));

        if ($timed === []) {
            $this->error('  Nijedno mjerenje nije uspjelo — provjeri --base.');

            return;
        }

        $throttled = array_values(array_filter($rows, fn ($r) => $r[1] === 429));
        $slow = array_values(array_filter($timed, fn ($r) => $r[2] > 500 && $r[1] !== 429));
        $broken = array_values(array_filter($rows, fn ($r) => $r[1] === null || $r[1] === 0 || $r[1] >= 500));

        $this->newLine();

        if ($throttled !== []) {
            // Our own doing: a few dozen requests in one minute from one IP is
            // exactly what the throttle exists to stop. Those numbers are the
            // rate limiter's, not the endpoint's.
            $this->warn('  '.count($throttled).' ruta je vratila 429 — potrošili smo vlastiti rate limit.');
            $this->line('  To nije nalaz o ruti. Ponovi s --limit=15 ili --delay=1200 za ostatak.');
            $this->newLine();
        }

        if ($broken !== []) {
            $this->error('  '.count($broken).' ruta ne vraća uspješan odgovor:');
            foreach (array_slice($broken, 0, 8) as $r) {
                $this->line('   - '.$r[0].'  → '.$this->statusLabel($r[1]));
            }
        }

        if ($slow !== []) {
            $this->warn('  '.count($slow).' ruta sporija od 500 ms.');
            $this->line('  Za svaku od njih pogledaj pg_stat_statements u diagnose:db —');
            $this->line('  ako se vrijeme troši u bazi, tamo se vidi na kojem upitu.');
        } else {
            $this->line('  Nijedna ruta nije prešla 500 ms.');
        }

        $this->newLine();
        $this->line('  Napomena: mjereno s ove mašine, pa mrežni put do posjetioca nije uračunat.');
        $this->line('  Prvi poziv puni keš — medijan od tri je bliži stvarnosti nego jedno mjerenje.');
        $this->line('  Kroz `artisan serve` svaka brojka nosi režiju dev servera; Octane ima drugu');
        $this->line('  osnovicu. Razlike među rutama znače nešto, apsolutne brojke tek na serveru.');
    }

    private function statusLabel(?int $status): string
    {
        return match (true) {
            $status === null, $status === 0 => 'ne odgovara',
            default => (string) $status,
        };
    }

    /**
     * Parameterless public GET routes, longest-lived first.
     *
     * @return list<string>
     */
    private function publicGetPaths(int $limit): array
    {
        $paths = [];

        foreach (Route::getRoutes() as $route) {
            if (! in_array('GET', $route->methods(), true)) {
                continue;
            }

            $uri = $route->uri();

            if (! str_starts_with($uri, 'api/v1/') || str_contains($uri, '{')) {
                continue;
            }

            $middleware = $route->gatherMiddleware();

            foreach (self::NEEDS_AUTH as $guard) {
                if (in_array($guard, $middleware, true)) {
                    continue 2;
                }
            }

            foreach (self::SIDE_EFFECTS as $word) {
                if (str_contains($uri, $word)) {
                    continue 2;
                }
            }

            $paths[$uri] = true;
        }

        return array_slice(array_keys($paths), 0, $limit);
    }
}
