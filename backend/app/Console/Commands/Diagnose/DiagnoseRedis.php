<?php

namespace App\Console\Commands\Diagnose;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Redis;

/**
 * Whether Redis has a ceiling, and what is filling it.
 *
 * Two questions the code cannot answer. First: is `maxmemory` set, and with
 * which eviction policy — because with none, Redis grows until the machine
 * refuses, and it shares that machine with Postgres. Second: how many keys have
 * no expiry, which is the shape of a slow leak.
 *
 * That second one is not hypothetical here: the daily XP counter was created by
 * a bare INCRBY, which sets no TTL, so one permanent key per user per day had
 * been accumulating until P4 fixed it. The keys written before that fix are
 * still there.
 *
 * Read-only. SCAN is used rather than KEYS so a large database is not blocked.
 */
class DiagnoseRedis extends Command
{
    protected $signature = 'diagnose:redis {--sample=20000 : How many keys to sample}';

    protected $description = 'Memory ceiling, keys without expiry, queue depth';

    public function handle(): int
    {
        try {
            $info = Redis::info();
        } catch (\Throwable $e) {
            $this->error('Redis nedostupan: '.$e->getMessage());

            return self::FAILURE;
        }

        $this->memory($info);
        $this->queues();
        $this->keyspace((int) $this->option('sample'));

        return self::SUCCESS;
    }

    private function memory(array $info): void
    {
        $get = function (string $key) use ($info) {
            foreach ($info as $k => $v) {
                if ($k === $key) {
                    return $v;
                }
                if (is_array($v) && array_key_exists($key, $v)) {
                    return $v[$key];
                }
            }

            return null;
        };

        $maxmemory = (int) ($get('maxmemory') ?? 0);
        $policy = $get('maxmemory_policy') ?? 'nepoznato';
        $used = (int) ($get('used_memory') ?? 0);

        $this->newLine();
        $this->info('Memorija');
        $this->line('  iskorišteno: '.$this->human($used));

        if ($maxmemory === 0) {
            $this->warn('  maxmemory: NIJE POSTAVLJEN');
            $this->line('  Redis će rasti dok mašina ne odbije — a dijeli je s Postgresom.');
            $this->line('  Preporuka: maxmemory na dio RAM-a i politika allkeys-lru za keš.');
        } else {
            $pct = $maxmemory > 0 ? round($used / $maxmemory * 100, 1) : 0;
            $this->line('  maxmemory:   '.$this->human($maxmemory)." ({$pct}% popunjeno)");
        }

        $this->line('  politika:    '.$policy);

        if ($policy === 'noeviction' && $maxmemory > 0) {
            $this->warn('  Uz noeviction, kad se napuni, upisi počinju vraćati grešku umjesto da nešto ispadne.');
        }
    }

    private function queues(): void
    {
        $this->newLine();
        $this->info('Redovi poslova');

        $connection = (string) config('queue.default');
        $driver = (string) config("queue.connections.{$connection}.driver", '?');

        if ($driver !== 'redis') {
            $this->line("  Red nije na Redisu — veza je '{$connection}' (drajver: {$driver}).");

            return;
        }

        $empty = true;

        foreach (['default', 'high', 'low'] as $queue) {
            try {
                $depth = (int) Redis::llen("queues:{$queue}");
                $delayed = (int) Redis::zcard("queues:{$queue}:delayed");
                $reserved = (int) Redis::zcard("queues:{$queue}:reserved");
            } catch (\Throwable) {
                continue;
            }

            if ($depth + $delayed + $reserved === 0) {
                continue;
            }

            $empty = false;
            $this->line(sprintf('  %-10s čeka: %-8s odgođeno: %-8s u obradi: %s',
                $queue, number_format($depth), number_format($delayed), number_format($reserved)));
        }

        if ($empty) {
            $this->line('  Svi redovi prazni.');
        }
    }

    private function keyspace(int $sample): void
    {
        $this->newLine();
        $this->info('Ključevi');

        $cursor = '0';
        $scanned = 0;
        $noTtl = 0;
        $groups = [];
        $noTtlGroups = [];

        do {
            try {
                [$cursor, $keys] = Redis::scan($cursor, ['count' => 1000]);
            } catch (\Throwable $e) {
                $this->warn('  SCAN nije uspio: '.$e->getMessage());

                return;
            }

            foreach ((array) $keys as $key) {
                $scanned++;

                // Group by the first two colon-separated parts, which is how
                // this app names things: user:123:xp:2026-08-10 -> user:*:xp
                $parts = explode(':', (string) $key);
                $group = count($parts) > 2
                    ? $parts[0].':*:'.$parts[2]
                    : ($parts[0] ?? 'ostalo');

                $groups[$group] = ($groups[$group] ?? 0) + 1;

                if ((int) Redis::ttl($key) === -1) {
                    $noTtl++;
                    $noTtlGroups[$group] = ($noTtlGroups[$group] ?? 0) + 1;
                }

                if ($scanned >= $sample) {
                    $cursor = '0';
                    break;
                }
            }
        } while ($cursor !== '0' && $cursor !== 0);

        $this->line('  pregledano: '.number_format($scanned).($scanned >= $sample ? ' (uzorak, ima ih još)' : ''));
        $this->line('  bez roka trajanja: '.number_format($noTtl));

        if ($noTtl > 0) {
            $this->newLine();
            $this->warn('  Ključevi bez roka, po grupama — ovi ne nestaju sami:');
            arsort($noTtlGroups);
            foreach (array_slice($noTtlGroups, 0, 12, true) as $g => $n) {
                $this->line(sprintf('    %-34s %s', $g, number_format($n)));
            }
        }

        $this->newLine();
        $this->line('  Najbrojnije grupe:');
        arsort($groups);
        foreach (array_slice($groups, 0, 12, true) as $g => $n) {
            $this->line(sprintf('    %-34s %s', $g, number_format($n)));
        }
    }

    private function human(int $bytes): string
    {
        if ($bytes <= 0) {
            return '0 B';
        }

        foreach (['B', 'KB', 'MB', 'GB'] as $i => $unit) {
            $v = $bytes / (1024 ** $i);
            if ($v < 1024 || $unit === 'GB') {
                return round($v, 1).' '.$unit;
            }
        }

        return $bytes.' B';
    }
}
