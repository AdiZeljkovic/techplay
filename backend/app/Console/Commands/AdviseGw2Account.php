<?php

namespace App\Console\Commands;

use App\Services\Gw2\Advisor\Advisor;
use App\Services\Gw2\Advisor\Intent;
use App\Services\Gw2\Advisor\SnapshotReader;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 * Print what the advisor would tell one account.
 *
 * The rules are editable data, which means a bad edit produces bad advice with no
 * error anywhere. This is how that gets caught: run it against a real account,
 * read the sentences, and see whether a person would act on them.
 */
class AdviseGw2Account extends Command
{
    protected $signature = 'gw2:advise
        {account? : gw2_accounts.id, or the account name}
        {--minutes= : How long the player says they have}
        {--goal= : A domain to favour}
        {--avoid=* : Domains to drop}';

    protected $description = 'Print the advisor output for one Guild Wars 2 account';

    public function handle(SnapshotReader $reader, Advisor $advisor): int
    {
        $id = $this->resolve($this->argument('account'));

        if (! $id) {
            $this->error('No such account.');

            return self::FAILURE;
        }

        $snapshot = $reader->for($id);

        if (! $snapshot) {
            $this->error('That account has no snapshot yet. Run gw2:sync-accounts --force.');

            return self::FAILURE;
        }

        $intent = new Intent(
            goal: $this->option('goal'),
            minutes: $this->option('minutes') !== null ? (int) $this->option('minutes') : null,
            avoid: (array) $this->option('avoid'),
        );

        $advice = $advisor->advise($snapshot, $intent);

        $this->newLine();
        $this->line("<options=bold>{$snapshot->name}</>  <fg=gray>{$advice['considered']} candidates considered</>");

        if ($intent->minutes !== null) {
            $this->line("<fg=gray>  filtered to what fits in {$intent->minutes} minutes: "
                .implode(', ', $intent->bandsThatFit()).'</>');
        }

        $this->show('Do these', $advice['headline']);
        $this->show('Or instead', $advice['alternatives']);

        if ($advice['headline'] === []) {
            $this->warn('No rule matched. Either the account is in good shape or the rule table is empty.');
        }

        return self::SUCCESS;
    }

    /** @param array<int, array<string, mixed>> $signals */
    private function show(string $heading, array $signals): void
    {
        if ($signals === []) {
            return;
        }

        $this->newLine();
        $this->line("<options=bold>{$heading}</>");

        foreach ($signals as $s) {
            $this->newLine();
            $this->line("  <info>{$s['title']}</info>");
            $this->line("    {$s['body']}");
            $this->line(sprintf(
                '    <fg=gray>%s · %s · %s · score %s</>',
                $s['domain'],
                $s['confidence'],
                $s['effort'] ?? 'unbanded',
                $s['score']
            ));

            foreach ($s['blockers'] as $blocker) {
                $this->line("    <comment>blocked: {$blocker}</comment>");
            }
        }
    }

    private function resolve(?string $argument): ?int
    {
        $query = DB::table('gw2_accounts');

        if ($argument === null) {
            return $query->count() === 1 ? (int) $query->value('id') : null;
        }

        if (ctype_digit($argument)) {
            return $query->where('id', (int) $argument)->exists() ? (int) $argument : null;
        }

        return $query->where('name', 'like', $argument.'%')->value('id');
    }
}
