<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * The ascended guide's "Plan the materials" goes to the set page.
 *
 * It pointed at the crafting planner, which asks the reader to search for each
 * piece by name. `/gw2/ascended` plans the whole set from what the character
 * wears, which is what somebody finishing that guide wants next.
 *
 * Changed in the seeder too, but seeders are not run on deploy. Only while the
 * link is still exactly the seeded one and nobody has reviewed the guide — an
 * editor's next steps are theirs.
 */
return new class extends Migration
{
    private const OLD = ['Plan the materials', '/gw2/planner'];

    private const NEW = ['Plan your ascended armour', '/gw2/ascended'];

    public function up(): void
    {
        $this->swap(self::OLD, self::NEW);
    }

    public function down(): void
    {
        $this->swap(self::NEW, self::OLD);
    }

    /**
     * @param  array{0: string, 1: string}  $from
     * @param  array{0: string, 1: string}  $to
     */
    private function swap(array $from, array $to): void
    {
        if (! Schema::hasTable('gw2_guides')) {
            return;
        }

        $guide = DB::table('gw2_guides')
            ->where('family', 'goals')
            ->where('slug', 'first-ascended-set')
            ->whereNull('reviewed_at')
            ->first(['id', 'next_steps']);

        $steps = json_decode((string) ($guide->next_steps ?? ''), true);

        if (! is_array($steps) || ($steps[$from[0]] ?? null) !== $from[1]) {
            return;
        }

        // Rebuilt in order, so the link keeps its place in the list.
        $next = [];

        foreach ($steps as $label => $href) {
            if ($label === $from[0]) {
                $next[$to[0]] = $to[1];
            } else {
                $next[$label] = $href;
            }
        }

        DB::table('gw2_guides')->where('id', $guide->id)->update([
            'next_steps' => json_encode($next, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
            'updated_at' => now(),
        ]);
    }
};
