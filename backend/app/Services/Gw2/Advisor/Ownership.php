<?php

namespace App\Services\Gw2\Advisor;

use Illuminate\Support\Facades\DB;

/**
 * What an account owns, read from `access` against the editorial product
 * table — and what came with it for free.
 *
 * `access` names the product bought, and it is known to be incomplete in two
 * documented ways: Heart of Thorns is missing for accounts that upgraded
 * through Path of Fire (gw2-api #86), and Visions of Eternity is not reported
 * at all (#118). The first is handled in the table (Path of Fire counts for
 * Heart of Thorns); the second is reported as unknown, never as "not owned".
 *
 * Living World seasons are not in `access` either. Since 13 October 2026 they
 * come with expansions, or are free, so they are derived from the table — and
 * the "how" says which, because "you have Season 4 because you own Path of
 * Fire" is news to most people who bought it before.
 */
class Ownership
{
    /**
     * @param  array<int, string>|null  $access  The account's `access` list; null for nobody.
     * @return array<int, array<string, mixed>>
     */
    public function for(?array $access): array
    {
        $products = DB::table('gw2_products')->orderBy('sort_order')->get();
        $owned = [];

        // Expansions and the base game first: everything else derives from them.
        foreach ($products as $product) {
            $flags = json_decode((string) $product->access_flags, true) ?: [];
            $included = json_decode((string) $product->included_with, true) ?: [];

            if ($product->is_free) {
                $owned[$product->key] = ['owned' => true, 'how' => 'free'];
            } elseif ($flags !== []) {
                $owned[$product->key] = $access === null
                    ? ['owned' => null, 'how' => null]
                    : ['owned' => array_intersect($flags, $access) !== [], 'how' => 'access'];
            } elseif ($included === []) {
                // Neither reported nor derivable — Visions of Eternity today.
                $owned[$product->key] = ['owned' => null, 'how' => 'unknown'];
            }
        }

        foreach ($products as $product) {
            $included = json_decode((string) $product->included_with, true) ?: [];

            if ($included === [] || isset($owned[$product->key])) {
                continue;
            }

            $any = array_filter($included, fn ($key) => ($owned[$key]['owned'] ?? null) === true);
            $unknown = array_filter($included, fn ($key) => ($owned[$key]['owned'] ?? null) === null);

            $owned[$product->key] = $any !== []
                ? ['owned' => true, 'how' => 'included', 'with' => array_values($any)]
                : ['owned' => $unknown !== [] ? null : false, 'how' => 'included'];
        }

        return $products->map(fn ($p) => [
            'key' => $p->key,
            'name' => $p->name,
            'kind' => $p->kind,
            'owned' => $owned[$p->key]['owned'] ?? null,
            'how' => $owned[$p->key]['how'] ?? null,
            'with' => $owned[$p->key]['with'] ?? [],
            'is_free' => (bool) $p->is_free,
            'grants' => $p->grants,
            'grants_source' => $p->grants_source_url ? ['url' => $p->grants_source_url, 'label' => $p->grants_source_label] : null,
            'note' => $p->note,
            'source' => $p->source_url ? ['url' => $p->source_url, 'label' => $p->source_label] : null,
        ])->all();
    }

    /**
     * Product key => owned (true, false, or null when it cannot be told).
     *
     * @param  array<int, string>|null  $access
     * @return array<string, bool|null>
     */
    public function map(?array $access): array
    {
        return array_column($this->for($access), 'owned', 'key');
    }

    /** @return array<int, string>|null */
    public static function accessFor(int $gw2AccountId): ?array
    {
        $access = json_decode((string) DB::table('gw2_accounts')->where('id', $gw2AccountId)->value('access'), true);

        return is_array($access) ? $access : null;
    }
}
