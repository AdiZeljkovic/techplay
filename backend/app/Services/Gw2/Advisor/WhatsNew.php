<?php

namespace App\Services\Gw2\Advisor;

use Illuminate\Support\Facades\DB;

/**
 * What changed in the game, dated and sourced — and, for a returning player,
 * only what changed since they left and touches what they own.
 *
 * The list is editorial (`gw2_changes`), every row carries the page it was
 * written from, and the filter is the ownership table. A change for content
 * whose ownership cannot be told — Visions of Eternity, which the API does not
 * report — is kept and marked, because hiding it would be a guess too.
 */
class WhatsNew
{
    public const SUBJECT = 'returned_from';

    /**
     * @param  array<string, bool|null>|null  $owned  Product key => owned; null for nobody.
     * @return array<int, array<string, mixed>>
     */
    public function changes(?array $owned = null, ?string $since = null): array
    {
        $names = DB::table('gw2_products')->pluck('name', 'key');

        return DB::table('gw2_changes')
            ->where('is_published', true)
            ->when($since, fn ($q) => $q->where('happened_on', '>', $since))
            ->orderByDesc('happened_on')
            ->orderBy('id')
            ->get()
            ->map(function ($c) use ($owned, $names) {
                $applies = $c->applies_to;
                $yours = $applies === 'all' ? true : ($owned === null ? null : ($owned[$applies] ?? null));

                return [
                    'date' => (string) $c->happened_on,
                    'title' => $c->title,
                    'summary' => $c->summary,
                    'applies_to' => $applies,
                    'applies_to_name' => $applies === 'all' ? null : ($names[$applies] ?? $applies),
                    'category' => $c->category,
                    'source' => ['url' => $c->source_url, 'label' => $c->source_label],
                    // true: yours. null: cannot be told from the key. false is
                    // filtered out below for a signed-in reader.
                    'yours' => $yours,
                ];
            })
            ->filter(fn ($c) => $owned === null || $c['yours'] !== false)
            ->values()
            ->all();
    }

    /** The date the player says they last played before coming back, if they said. */
    public static function returnedFrom(int $gw2AccountId): ?string
    {
        $note = DB::table('gw2_confirmations')
            ->where('gw2_account_id', $gw2AccountId)
            ->where('subject', self::SUBJECT)
            ->value('note');

        return is_string($note) && preg_match('/^\d{4}-\d{2}-\d{2}$/', $note) ? $note : null;
    }
}
