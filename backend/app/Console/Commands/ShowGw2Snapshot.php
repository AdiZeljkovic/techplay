<?php

namespace App\Console\Commands;

use App\Services\Gw2\Advisor\Snapshot;
use App\Services\Gw2\Advisor\SnapshotReader;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 * Print what the advisor sees.
 *
 * Exists because the normalisation layer decides things that are invisible in
 * the database and expensive to get wrong — which slots count towards an
 * ascended figure, how much Agony Resistance the worn set adds up to, which
 * expansions the account can really reach. Reading those off a real account and
 * checking them against the game is the only honest way to know they are right.
 */
class ShowGw2Snapshot extends Command
{
    protected $signature = 'gw2:snapshot {account? : gw2_accounts.id, or the account name}';

    protected $description = 'Print the normalised advisor view of one Guild Wars 2 account';

    public function handle(SnapshotReader $reader): int
    {
        $id = $this->resolve($this->argument('account'));

        if (! $id) {
            $this->error('No such account. Connected accounts: '
                .(DB::table('gw2_accounts')->pluck('name')->implode(', ') ?: 'none'));

            return self::FAILURE;
        }

        $snapshot = $reader->for($id);

        if (! $snapshot) {
            $this->error("gw2_accounts row {$id} disappeared while reading it.");

            return self::FAILURE;
        }

        $this->account($snapshot);
        $this->masteries($snapshot);
        $this->characters($snapshot);
        $this->vault($snapshot);
        $this->easyWins($snapshot);

        return self::SUCCESS;
    }

    private function account(Snapshot $s): void
    {
        $this->newLine();
        $this->line("<options=bold>{$s->name}</>  <fg=gray>read {$s->observedAt}</>");
        $this->line('  fractal level '.($s->fractalLevel ?? '—')
            .'   daily AP '.($s->dailyAp ?? '—')
            .'   WvW rank '.($s->wvwRank ?? '—'));
        $this->line('  reachable: '.implode(', ', $s->expansions));
        $this->line('  held items: '.number_format(count($s->owned)).' distinct'
            .'   currencies: '.count($s->wallet)
            .'   raids this week: '.count($s->raidsThisWeek)
            .'   bosses today: '.count($s->bossesToday));
    }

    private function masteries(Snapshot $s): void
    {
        $this->newLine();
        $this->line('<options=bold>Mastery points</>  '.$s->unspentMasteryPoints().' unspent in total');

        $rows = [];

        foreach ($s->masteryRegions as $region) {
            // A region with nothing earned is content the account has not
            // touched; printing it would be six empty lines every time.
            if ($region->earned === 0 && $region->spent === 0) {
                continue;
            }

            $rows[] = [$region->region, $region->earned, $region->spent, $region->unspent()];
        }

        $this->table(['Region', 'Earned', 'Spent', 'Unspent'], $rows);
    }

    private function characters(Snapshot $s): void
    {
        $this->line('<options=bold>Characters</>  '.count($s->characters));

        $rows = [];

        foreach ($s->characters as $c) {
            $rows[] = [
                $c->name,
                "{$c->profession} {$c->level}",
                $c->agonyResistance.' AR'.($c->agonyShortfall() > 0 ? " ({$c->agonyShortfall()} to T4)" : ' (T4 ready)'),
                "{$c->ascendedSlots}/{$c->coreSlots}",
                "{$c->ascendedWeapons}/{$c->weaponSlots}",
                implode(', ', $c->slotsBelowAscended()) ?: '—',
            ];
        }

        $this->table(['Character', 'Class', 'Agony', 'Ascended core', 'Weapons', 'Below ascended'], $rows);

        if ($primary = $s->primaryCharacter()) {
            $this->line("  advisor would talk about <info>{$primary->name}</info>");

            if ($primary->emptySlots() !== []) {
                $this->line('  <comment>empty core slots: '.implode(', ', $primary->emptySlots()).'</comment>');
            }

            $this->line('  crafting: '.(implode(', ', $primary->craftingDisciplines) ?: 'none active'));
        }
    }

    private function vault(Snapshot $s): void
    {
        $this->newLine();

        if (! $s->vault) {
            $this->line('<options=bold>Wizard\'s Vault</>  not read — the key is missing the progression scope');

            return;
        }

        $v = $s->vault;

        $this->line('<options=bold>Wizard\'s Vault</>'
            ."  daily {$v->dailyMetaProgress}/{$v->dailyMetaTarget}".($v->dailyMetaClaimed ? ' claimed' : ' <comment>unclaimed</comment>')
            ."   weekly {$v->weeklyMetaProgress}/{$v->weeklyMetaTarget}".($v->weeklyMetaClaimed ? ' claimed' : ' <comment>unclaimed</comment>'));

        if ($v->unclaimedAcclaim() > 0) {
            $this->line("  <comment>{$v->unclaimedAcclaim()} acclaim already earned and not collected</comment>");
        }

        foreach ($v->open() as $o) {
            $this->line(sprintf('  <fg=gray>%-7s</> %-52s %d/%d  %d acclaim', $o->period, $o->title, $o->current, $o->target, $o->acclaim));
        }
    }

    private function easyWins(Snapshot $s): void
    {
        $this->newLine();
        $this->line('<options=bold>Nearly done</>  '.count($s->nearlyDone).' achievements past 80%');

        $rows = [];

        foreach (array_slice($s->nearlyDone, 0, 12) as $win) {
            $rows[] = [
                $win->name ?? "#{$win->id}",
                "{$win->current}/{$win->max}",
                $win->remaining(),
                $win->effortBand ?? ($win->curated ? '—' : 'unreviewed'),
            ];
        }

        $this->table(['Achievement', 'Progress', 'Left', 'Effort'], $rows);
    }

    private function resolve(?string $argument): ?int
    {
        $query = DB::table('gw2_accounts');

        if ($argument === null) {
            // One connected account is the normal case while this is being
            // built; asking for an id every time is friction for nothing.
            return $query->count() === 1 ? (int) $query->value('id') : null;
        }

        if (ctype_digit($argument)) {
            return $query->where('id', (int) $argument)->exists() ? (int) $argument : null;
        }

        return $query->where('name', 'like', $argument.'%')->value('id');
    }
}
