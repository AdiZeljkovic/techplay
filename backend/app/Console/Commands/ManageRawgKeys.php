<?php

namespace App\Console\Commands;

use App\Models\RawgApiKey;
use App\Services\ApiKeyManager;
use Illuminate\Console\Command;

class ManageRawgKeys extends Command
{
    protected $signature = 'rawg:keys
        {action : add | list | stats | reset | disable | enable}
        {key? : API key value (required for add/disable/enable)}
        {--label= : Label for the key (e.g. account email)}
        {--limit=19800 : Monthly call limit for this key}';

    protected $description = 'Manage RAWG API keys used by the crawler.';

    public function handle(ApiKeyManager $keyManager): int
    {
        return match ($this->argument('action')) {
            'add'     => $this->addKey(),
            'list'    => $this->listKeys(),
            'stats'   => $this->showStats($keyManager),
            'reset'   => $this->resetCounters($keyManager),
            'disable' => $this->toggleKey(false),
            'enable'  => $this->toggleKey(true),
            default   => $this->invalidAction(),
        };
    }

    // -------------------------------------------------------------------------

    private function addKey(): int
    {
        $apiKey = $this->argument('key');

        if (! $apiKey) {
            $this->error('Please provide the API key: php artisan rawg:keys add <your-key>');
            return self::FAILURE;
        }

        $exists = RawgApiKey::where('api_key', $apiKey)->exists();
        if ($exists) {
            $this->warn("Key already exists in the database.");
            return self::SUCCESS;
        }

        RawgApiKey::create([
            'api_key'     => $apiKey,
            'label'       => $this->option('label'),
            'calls_used'  => 0,
            'calls_limit' => (int) $this->option('limit'),
            'is_active'   => true,
        ]);

        $label = $this->option('label') ? " ({$this->option('label')})" : '';
        $this->info("Key added successfully{$label}. Workers will pick it up automatically.");

        return self::SUCCESS;
    }

    private function listKeys(): int
    {
        $keys = RawgApiKey::orderBy('id')->get();

        if ($keys->isEmpty()) {
            $this->warn('No keys found. Add one:');
            $this->line('  php artisan rawg:keys add <your-key> --label="acc@gmail.com"');
            return self::SUCCESS;
        }

        $rows = $keys->map(fn ($k) => [
            $k->id,
            substr($k->api_key, 0, 8) . '...',
            $k->label ?? '—',
            number_format($k->calls_used) . ' / ' . number_format($k->calls_limit),
            number_format($k->calls_limit - $k->calls_used),
            $k->is_active ? '<info>active</info>' : '<comment>disabled</comment>',
        ])->toArray();

        $this->table(
            ['ID', 'Key (prefix)', 'Label', 'Used / Limit', 'Remaining', 'Status'],
            $rows
        );

        return self::SUCCESS;
    }

    private function showStats(ApiKeyManager $keyManager): int
    {
        $stats = $keyManager->getStats();

        $this->table(
            ['Metric', 'Value'],
            [
                ['Total keys',      number_format($stats['total_keys'])],
                ['Active keys',     number_format($stats['active_keys'])],
                ['Total used',      number_format($stats['total_used'])],
                ['Total remaining', number_format($stats['total_remaining'])],
            ]
        );

        return self::SUCCESS;
    }

    private function resetCounters(ApiKeyManager $keyManager): int
    {
        if (! $this->confirm('This will reset ALL call counters to 0 and re-enable all keys. Continue?')) {
            return self::SUCCESS;
        }

        $keyManager->resetMonthlyCounters();
        $this->info('All counters reset. Ready for a new month!');

        return self::SUCCESS;
    }

    private function toggleKey(bool $active): int
    {
        $apiKey = $this->argument('key');

        if (! $apiKey) {
            $this->error('Please provide the API key prefix or full key.');
            return self::FAILURE;
        }

        $key = RawgApiKey::where('api_key', $apiKey)->first();

        if (! $key) {
            $this->error("Key not found: {$apiKey}");
            return self::FAILURE;
        }

        $key->update(['is_active' => $active]);
        $status = $active ? 'enabled' : 'disabled';
        $this->info("Key {$status} successfully.");

        return self::SUCCESS;
    }

    private function invalidAction(): int
    {
        $this->error('Invalid action. Use: add | list | stats | reset | disable | enable');
        return self::FAILURE;
    }
}
