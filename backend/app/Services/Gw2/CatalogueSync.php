<?php

namespace App\Services\Gw2;

use Illuminate\Support\Facades\DB;

/**
 * Tyria, copied here.
 *
 * Every endpoint below returns the same rows for every player, so reading them
 * per account would spend a shared rate limit on data no account can change.
 * Measured on 27 September 2026: 74,265 items, 13,198 recipes, 8,339
 * achievements and about 1,500 rows across the rest — roughly 492 requests at
 * the 200 ids the API accepts per call. Once per game build, that is a minute
 * of budget a patch. Per account, it would be unaffordable.
 *
 * Each endpoint records its own build and its own timestamp. Items take four
 * hundred requests and currencies take one, so they do not belong on the same
 * schedule, and a run that dies halfway must not leave the whole catalogue
 * claiming to be current.
 */
class CatalogueSync
{
    /**
     * What we mirror, and where each one lands.
     *
     * `reference` is the shared table for the small lists: seven more models
     * with an id, a name and a blob would be seven more things to keep in step
     * for no query anybody intends to write.
     */
    private const ENDPOINTS = [
        'items' => 'items',
        'recipes' => 'recipes',
        'achievements' => 'achievements',
        'masteries' => 'masteries',
        'itemstats' => 'reference',
        'currencies' => 'reference',
        'professions' => 'reference',
        'specializations' => 'reference',
        'titles' => 'reference',
        'quests' => 'reference',
        'mounts/types' => 'reference',
    ];

    public function __construct(private readonly Gw2Client $api) {}

    /** @return array<int, string> */
    public function endpoints(): array
    {
        return array_keys(self::ENDPOINTS);
    }

    /**
     * Which endpoints are behind the live game build.
     *
     * One request answers it for all of them. An endpoint that has never been
     * read counts as stale, which is how a first run pulls everything without
     * needing a separate "is this the first time" flag.
     *
     * @return array<int, string>
     */
    public function stale(int $buildId): array
    {
        $known = DB::table('gw2_catalog_meta')
            ->pluck('build_id', 'endpoint')
            ->all();

        return array_values(array_filter(
            $this->endpoints(),
            fn (string $e) => (int) ($known[$e] ?? 0) !== $buildId
        ));
    }

    /**
     * Read one endpoint into its table.
     *
     * Returns how many rows landed. Anything thrown is the caller's to handle:
     * a rate limit means come back, and the endpoint keeps its old build so the
     * next run picks it up again.
     */
    public function refresh(string $endpoint, int $buildId, ?callable $onProgress = null): int
    {
        if (! isset(self::ENDPOINTS[$endpoint])) {
            throw new \InvalidArgumentException("Unknown catalogue endpoint '{$endpoint}'.");
        }

        DB::table('gw2_catalog_meta')->updateOrInsert(
            ['endpoint' => $endpoint],
            ['attempted_at' => now(), 'last_error' => null]
        );

        $ids = $this->api->public($endpoint);
        $total = 0;

        foreach (array_chunk($ids, Gw2Client::BATCH) as $chunk) {
            $rows = $this->api->public($endpoint, ['ids' => implode(',', $chunk)]);

            $total += $this->store($endpoint, $rows, $buildId);

            if ($onProgress) {
                $onProgress($total, count($ids));
            }
        }

        DB::table('gw2_catalog_meta')->updateOrInsert(
            ['endpoint' => $endpoint],
            ['build_id' => $buildId, 'row_count' => $total, 'refreshed_at' => now(), 'last_error' => null]
        );

        return $total;
    }

    /**
     * @param  array<int, array<string, mixed>>  $rows
     */
    private function store(string $endpoint, array $rows, int $buildId): int
    {
        if ($rows === []) {
            return 0;
        }

        return match (self::ENDPOINTS[$endpoint]) {
            'items' => $this->upsert('gw2_items', array_map(fn ($r) => [
                'id' => $r['id'],
                'name' => $this->text($r['name'] ?? ''),
                'type' => $r['type'] ?? null,
                'rarity' => $r['rarity'] ?? null,
                'level' => (int) ($r['level'] ?? 0),
                'icon' => $r['icon'] ?? null,
                'details' => $this->json($r['details'] ?? null),
                'flags' => $this->json($r['flags'] ?? null),
                'build_id' => $buildId,
            ], $rows), ['name', 'type', 'rarity', 'level', 'icon', 'details', 'flags', 'build_id']),

            /*
             * `advisor_eligible` and `effort_band` are missing from the update
             * list on purpose. They are TechPlay's curation, not ArenaNet's
             * data, and a catalogue refresh must not undo an editor's decision
             * about which achievements belong in an easy-wins list.
             */
            'achievements' => $this->upsert('gw2_achievements', array_map(fn ($r) => [
                'id' => $r['id'],
                'name' => $this->text($r['name'] ?? ''),
                'requirement' => $this->text($r['requirement'] ?? ''),
                'type' => $r['type'] ?? null,
                'tiers' => $this->json($r['tiers'] ?? null),
                'rewards' => $this->json($r['rewards'] ?? null),
                'flags' => $this->json($r['flags'] ?? null),
                'bits' => $this->json($r['bits'] ?? null),
                'build_id' => $buildId,
            ], $rows), ['name', 'requirement', 'type', 'tiers', 'rewards', 'flags', 'bits', 'build_id']),

            'recipes' => $this->upsert('gw2_recipes', array_map(fn ($r) => [
                'id' => $r['id'],
                'output_item_id' => (int) ($r['output_item_id'] ?? 0),
                'output_item_count' => (int) ($r['output_item_count'] ?? 1),
                'ingredients' => $this->json($r['ingredients'] ?? null),
                'disciplines' => $this->json($r['disciplines'] ?? null),
                'min_rating' => (int) ($r['min_rating'] ?? 0),
                'flags' => $this->json($r['flags'] ?? null),
                'build_id' => $buildId,
            ], $rows), ['output_item_id', 'output_item_count', 'ingredients', 'disciplines', 'min_rating', 'flags', 'build_id']),

            'masteries' => $this->upsert('gw2_masteries', array_map(fn ($r) => [
                'id' => $r['id'],
                'name' => $this->text($r['name'] ?? ''),
                'region' => $r['region'] ?? null,
                'requirement' => $this->text($r['requirement'] ?? ''),
                'order' => (int) ($r['order'] ?? 0),
                'levels' => $this->json($r['levels'] ?? null),
                'build_id' => $buildId,
            ], $rows), ['name', 'region', 'requirement', 'order', 'levels', 'build_id']),

            default => $this->upsert('gw2_reference', array_map(fn ($r) => [
                'kind' => $this->kind($endpoint),
                /*
                 * Professions and mount types are keyed by name, not a number.
                 * crc32 gives them a stable integer so one table can hold both
                 * without a nullable string key nothing else would ever use.
                 */
                'ref_id' => is_numeric($r['id'] ?? null) ? (int) $r['id'] : crc32((string) ($r['id'] ?? '')),
                'name' => $this->text($r['name'] ?? ($r['id'] ?? '')),
                'payload' => $this->json($r),
                'build_id' => $buildId,
            ], $rows), ['name', 'payload', 'build_id'], ['kind', 'ref_id']),
        };
    }

    /**
     * @param  array<int, array<string, mixed>>  $rows
     * @param  array<int, string>  $update
     * @param  array<int, string>  $by
     */
    private function upsert(string $table, array $rows, array $update, array $by = ['id']): int
    {
        // Postgres has a parameter ceiling per statement, and 200 rows of a
        // wide item is comfortably inside it while still being one round trip.
        foreach (array_chunk($rows, 200) as $chunk) {
            DB::table($table)->upsert($chunk, $by, $update);
        }

        return count($rows);
    }

    private function kind(string $endpoint): string
    {
        return str_replace('/', '_', $endpoint);
    }

    private function json(mixed $value): ?string
    {
        return $value === null ? null : json_encode($value, JSON_UNESCAPED_UNICODE);
    }

    /**
     * Item names arrive with the game's own markup and occasionally with
     * invalid sequences; Postgres refuses the latter outright.
     */
    private function text(string $value): string
    {
        return mb_substr(mb_convert_encoding($value, 'UTF-8', 'UTF-8'), 0, 255);
    }
}
