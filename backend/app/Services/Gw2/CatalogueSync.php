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
        /*
         * Mount icons. `mounts/types` carries no icon at all — it names a
         * `default_skin`, and the skin is what has the picture. So the nine
         * mount cards need this endpoint or they need drawing without one.
         */
        'mounts/skins' => 'reference',
        /*
         * Structure, not names. `/v2/raids` gives wings and the encounters in
         * them, `/v2/dungeons` gives paths, `/v2/worldbosses` gives the
         * canonical fifteen — and all three return bare slugs with no display
         * name anywhere in the API.
         *
         * They are here because the account endpoints return the same slugs and
         * nothing else: `/v2/account/raids` answers ["samarog","deimos",...],
         * which is unreadable until you know which wing each one belongs to.
         * Seven requests for raids, eight for dungeons, one for world bosses.
         */
        'raids' => 'reference',
        'dungeons' => 'reference',
        'worldbosses' => 'reference',
        /*
         * Story structure. `/v2/stories` is 148 chapters and
         * `/v2/stories/seasons` groups them into 13 — two requests for the only
         * thing that turns a character's 172 completed quest ids into
         * something a reader recognises.
         */
        'stories' => 'reference',
        'stories/seasons' => 'reference',
        /*
         * Achievement grouping. 360 categories inside 19 groups, and it is the
         * only structured way to say "these eighteen achievements are the
         * Skyscale collection" — matching on the word in the name would be a
         * guess that breaks on the first achievement called "Skyscale Rider"
         * that belongs somewhere else.
         */
        'achievements/categories' => 'reference',
        'achievements/groups' => 'reference',
        /*
         * What each legendary can be held in multiples of. Rings and
         * accessories take two, some weapons four, and "how many more copies
         * are still useful" is a question the account endpoint cannot answer
         * on its own — it gives counts, not ceilings.
         */
        'legendaryarmory' => 'reference',
        /*
         * The daily-reset lists: Hero's Choice chests and time-gated crafts.
         * Nineteen and five ids. The account endpoints return the ids already
         * done today; these are the denominators.
         */
        'mapchests' => 'reference',
        'dailycrafting' => 'reference',
        /*
         * The current Wizard's Vault season — one object, not a list — and
         * what it sells. The season's `end` is the only deadline the API
         * publishes anywhere.
         */
        'wizardsvault' => 'single',
        'wizardsvault/listings' => 'reference',
        /*
         * Collections. Minis and outfits name the item that unlocks them, so
         * a missing one can be priced; skins are reached through the items
         * whose `default_skin` they are. 10,680 skins is about 54 requests.
         */
        'minis' => 'reference',
        'outfits' => 'reference',
        'skins' => 'reference',
        /*
         * Where things are in the world: mastery insights, hero challenges and
         * waypoints, per map. Nothing else in the API has coordinates. Read
         * floor by floor (see refreshContinents) and boiled down to those three
         * lists, because a single floor is eight megabytes of mostly sector
         * outlines nobody here draws.
         */
        'continents' => 'continents',
    ];

    /** Tyria. The Mists has no mastery insights or hero challenges. */
    private const CONTINENT = 1;

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

        $total = match (self::ENDPOINTS[$endpoint]) {
            'single' => $this->refreshSingle($endpoint, $buildId),
            'continents' => $this->refreshContinents($buildId, $onProgress),
            default => $this->refreshList($endpoint, $buildId, $onProgress),
        };

        DB::table('gw2_catalog_meta')->updateOrInsert(
            ['endpoint' => $endpoint],
            ['build_id' => $buildId, 'row_count' => $total, 'refreshed_at' => now(), 'last_error' => null]
        );

        return $total;
    }

    /** The ordinary shape: a list of ids, then the rows in batches of 200. */
    private function refreshList(string $endpoint, int $buildId, ?callable $onProgress): int
    {
        $ids = $this->api->public($endpoint);
        $total = 0;

        foreach (array_chunk($ids, Gw2Client::BATCH) as $chunk) {
            $rows = $this->api->public($endpoint, ['ids' => implode(',', $chunk)]);

            $total += $this->store($endpoint, $rows, $buildId);

            if ($onProgress) {
                $onProgress($total, count($ids));
            }
        }

        return $total;
    }

    /** An endpoint that answers with one object — the Wizard's Vault season. */
    private function refreshSingle(string $endpoint, int $buildId): int
    {
        $row = $this->api->public($endpoint);

        if ($row === []) {
            return 0;
        }

        return $this->upsert('gw2_reference', [[
            'kind' => $this->kind($endpoint),
            'ref_id' => 1,
            'name' => $this->text((string) ($row['title'] ?? $endpoint)),
            'payload' => $this->json($row),
            'build_id' => $buildId,
        ]], ['name', 'payload', 'build_id'], ['kind', 'ref_id']);
    }

    /**
     * Every map in Tyria that has a mastery insight or a hero challenge, with
     * its waypoints.
     *
     * Floor by floor, because that is the only call that returns whole maps
     * with their points — and because a map's points are spread over its
     * floors: Verdant Brink's canopy and its jungle floor list different
     * insights. Measured 28 October 2026: 307 distinct insights across all
     * floors, against 221 on floor 1 alone.
     *
     * One floor is up to eight megabytes, so each is decoded, boiled down and
     * dropped before the next. The memory ceiling is raised for this endpoint
     * only; it is the one read here that needs it.
     *
     * Insight ids are the same ids `account/mastery/points` reports as
     * unlocked — checked against the owner's account on 28 October 2026, when
     * every unlocked id was either one of these or an achievement's mastery
     * reward. That is what makes "which insights are left" answerable.
     */
    private function refreshContinents(int $buildId, ?callable $onProgress): int
    {
        @ini_set('memory_limit', '768M');

        $floors = $this->api->public('continents/'.self::CONTINENT.'/floors');
        $maps = [];

        foreach ($floors as $i => $floor) {
            $data = $this->api->public('continents/'.self::CONTINENT.'/floors/'.$floor);

            foreach ($data['regions'] ?? [] as $region) {
                foreach ($region['maps'] ?? [] as $map) {
                    $this->mergeMap($maps, $map, (string) ($region['name'] ?? ''), (int) $floor);
                }
            }

            unset($data);

            if ($onProgress) {
                $onProgress($i + 1, count($floors));
            }
        }

        $rows = [];

        foreach ($maps as $id => $map) {
            if ($map['mastery_points'] === [] && $map['hero_challenges'] === []) {
                continue;
            }

            $map['mastery_points'] = array_values($map['mastery_points']);
            $map['hero_challenges'] = array_values($map['hero_challenges']);
            $map['waypoints'] = array_values($map['waypoints']);
            sort($map['floors']);

            $rows[] = [
                'kind' => 'continent_maps',
                'ref_id' => $id,
                'name' => $this->text($map['name']),
                'payload' => $this->json($map),
                'build_id' => $buildId,
            ];
        }

        /*
         * A map that lost its last insight in a patch must not keep the old row,
         * and upsert alone never deletes. Replaced whole, inside the run.
         */
        DB::transaction(function () use ($rows) {
            DB::table('gw2_reference')->where('kind', 'continent_maps')->delete();
            $this->upsert('gw2_reference', $rows, ['name', 'payload', 'build_id'], ['kind', 'ref_id']);
        });

        return count($rows);
    }

    /**
     * @param  array<int, array<string, mixed>>  $maps
     * @param  array<string, mixed>  $map
     */
    private function mergeMap(array &$maps, array $map, string $region, int $floor): void
    {
        $id = (int) ($map['id'] ?? 0);

        if ($id === 0) {
            return;
        }

        $maps[$id] ??= [
            'id' => $id,
            'name' => (string) ($map['name'] ?? ''),
            'region' => $region,
            'min_level' => $map['min_level'] ?? null,
            'max_level' => $map['max_level'] ?? null,
            'map_rect' => $map['map_rect'] ?? null,
            'continent_rect' => $map['continent_rect'] ?? null,
            'floors' => [],
            'mastery_points' => [],
            'hero_challenges' => [],
            'waypoints' => [],
        ];

        $maps[$id]['floors'][] = $floor;

        // Keyed by id so the same point seen on two floors is kept once.
        foreach ($map['mastery_points'] ?? [] as $point) {
            if (isset($point['id'])) {
                $maps[$id]['mastery_points'][$point['id']] = [
                    'id' => (int) $point['id'],
                    'region' => $point['region'] ?? null,
                    'coord' => $point['coord'] ?? null,
                ];
            }
        }

        foreach ($map['skill_challenges'] ?? [] as $challenge) {
            if (isset($challenge['id'])) {
                $maps[$id]['hero_challenges'][(string) $challenge['id']] = [
                    'id' => (string) $challenge['id'],
                    'coord' => $challenge['coord'] ?? null,
                ];
            }
        }

        foreach ($map['points_of_interest'] ?? [] as $poi) {
            if (($poi['type'] ?? null) === 'waypoint' && isset($poi['id'])) {
                $maps[$id]['waypoints'][$poi['id']] = [
                    'id' => (int) $poi['id'],
                    'name' => $poi['name'] ?? null,
                    'coord' => $poi['coord'] ?? null,
                    'chat_link' => $poi['chat_link'] ?? null,
                ];
            }
        }
    }

    /**
     * @param  array<int, array<string, mixed>>  $rows
     */
    private function store(string $endpoint, array $rows, int $buildId): int
    {
        if ($rows === []) {
            return 0;
        }

        /*
         * Categories hand their membership to the achievements themselves.
         *
         * Before the match, and by endpoint name rather than inside it,
         * because the match branches on ENDPOINTS' *value* — which for this
         * endpoint is `reference`, same as a dozen others. An arm keyed on
         * `achievements/categories` sits there looking correct and never runs;
         * it did exactly that for one deploy, and the column stayed null while
         * the sync reported 360 rows stored.
         *
         * The mapping only exists in this direction — a category lists its
         * achievements, an achievement names no category — so this is the one
         * moment it is in hand.
         */
        if ($endpoint === 'achievements/categories') {
            $this->linkCategories($rows);
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
                'description' => $this->text($r['description'] ?? ''),
                'locked_text' => $this->text($r['locked_text'] ?? ''),
                'icon' => $r['icon'] ?? null,
                'prerequisites' => $this->json($r['prerequisites'] ?? null),
                'mastery_region' => $this->masteryRegion($r['rewards'] ?? null),
                'build_id' => $buildId,
            ], $rows), [
                'name', 'requirement', 'type', 'tiers', 'rewards', 'flags', 'bits',
                'description', 'locked_text', 'icon', 'prerequisites', 'mastery_region', 'build_id',
            ]),

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
                /*
                 * A scene render per track, and the only art at that scale the
                 * API gives out. `levels[].icon` comes along inside `levels`,
                 * which is already stored whole.
                 */
                'background' => $r['background'] ?? null,
                'build_id' => $buildId,
            ], $rows), ['name', 'region', 'requirement', 'order', 'levels', 'background', 'build_id']),

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
     * Writes each category's id onto the achievements it names.
     *
     * The point is coverage, not tidiness. Only 1,418 of 8,339 achievements
     * carry an icon; all 360 categories do. With this column an achievement
     * card can fall back to its category's picture, and almost none are left
     * without one.
     *
     * Grouped by category and issued as one statement per category rather than
     * one per achievement — 360 updates instead of about eight thousand.
     *
     * @param  array<int, array<string, mixed>>  $rows
     */
    private function linkCategories(array $rows): void
    {
        foreach ($rows as $category) {
            $ids = array_values(array_filter(array_map(
                // A category's `achievements` are bare integers today. The
                // objects are guarded against because this array has carried
                // both shapes in the past and costs nothing to allow.
                fn ($entry) => is_array($entry) ? (int) ($entry['id'] ?? 0) : (int) $entry,
                (array) ($category['achievements'] ?? [])
            )));

            if ($ids === [] || ! isset($category['id'])) {
                continue;
            }

            DB::table('gw2_achievements')
                ->whereIn('id', $ids)
                ->update(['category_id' => (int) $category['id']]);
        }
    }

    /**
     * @param  array<int, array<string, mixed>>  $rows
     * @param  array<int, string>  $update
     * @param  array<int, string>  $by
     */
    private function upsert(string $table, array $rows, array $update, array $by = ['id']): int
    {
        /*
         * The same key twice in one statement is a Postgres error, not a
         * no-op: "ON CONFLICT DO UPDATE command cannot affect row a second
         * time". And the game hands us duplicates — `/v2/mounts/skins` lists
         * 488 ids of which 487 are distinct, with 537 appearing twice. That is
         * upstream and we do not get to fix it there.
         *
         * Last one wins, which is the same answer two identical rows would
         * have given anyway.
         */
        $rows = array_values(array_column(
            array_map(fn ($row) => [implode('|', array_map(fn ($k) => (string) ($row[$k] ?? ''), $by)), $row], $rows),
            1,
            0
        ));

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

    /**
     * The mastery region an achievement pays out in, or null.
     *
     * Lifted from `rewards[]` rather than computed later because it is asked
     * of every candidate on every snapshot and the answer never changes
     * between builds. Kept in ArenaNet's spelling — `Desert`, `Sky` — so this
     * column stays a mirror of the payload; `MasteryRegions` owns the
     * translation to what the account endpoint calls the same place, and that
     * separation is not decorative: collapsing the two is the bug that left
     * the mastery rule scoring zero for a fortnight.
     *
     * @param  array<int, array<string, mixed>>|null  $rewards
     */
    private function masteryRegion(?array $rewards): ?string
    {
        foreach ($rewards ?? [] as $reward) {
            if (($reward['type'] ?? null) === 'Mastery' && ($reward['region'] ?? null)) {
                return (string) $reward['region'];
            }
        }

        return null;
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
