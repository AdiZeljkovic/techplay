<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Gw2Guide;
use App\Services\Gw2\Advisor\MasteryRegions;
use App\Services\Gw2\Advisor\RecipeNode;
use App\Services\Gw2\Advisor\RecipeTree;
use App\Traits\ApiResponse;
use Illuminate\Database\Query\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

/**
 * The Guild Wars 2 reference, for everyone.
 *
 * Everything the advisor reads that is **the same for every player**: what a
 * recipe takes, what a mastery track costs, which encounters a raid wing holds.
 * None of it needs a key and none of it is anybody's personal data, so it is
 * public, cacheable and indexable — and it is the reason somebody arrives here
 * at all. Connecting an account personalises these pages; it is not the price
 * of entry.
 *
 * ── Why the cache key carries the build ────────────────────────────────
 *
 * The catalogue changes when the game does, and `gw2_catalog_meta` already
 * records which build each endpoint was read at. Keying on it means a patch
 * invalidates every one of these by writing a different key, rather than by
 * somebody remembering to flush. Between patches they can be cached hard,
 * because between patches they genuinely do not change.
 */
class Gw2PublicController extends Controller
{
    use ApiResponse;

    /** A game patch is the only thing that changes any of this. */
    private const TTL = 86400;

    /**
     * The shape of these payloads. Bump it when a field is added or removed.
     *
     * The key was versioned by the game build alone, which is right for the
     * *data* and wrong for the *structure*: adding `indexable` changed every
     * payload and invalidated none of them, so the field was missing from every
     * cached page for a day while the code that set it was live. A build id
     * says when ArenaNet changed; this says when we did.
     */
    private const PAYLOAD_VERSION = 2;

    /**
     * GET /gw2/public/recipe/{item}
     *
     * What it takes to make one of something, with nothing subtracted.
     *
     * The same tree the signed-in planner draws, minus the part that reads an
     * account. That is the whole shape of this section: useful on its own, and
     * better once we know what is already in your bank.
     */
    public function recipe(int $item): JsonResponse
    {
        $payload = Cache::remember(
            $this->key("recipe:{$item}"),
            self::TTL,
            function () use ($item) {
                $row = DB::table('gw2_items')->where('id', $item)->first(['id', 'name', 'rarity', 'type', 'level', 'icon', 'details', 'is_indexable']);

                if (! $row || $row->name === '' || $row->name === null) {
                    // 103 rows in this catalogue have an empty name. They are
                    // real rows and useless pages.
                    return null;
                }

                $tree = app(RecipeTree::class);
                $root = $tree->plan((int) $row->id, 1, []);

                return [
                    'item' => [
                        'id' => (int) $row->id,
                        'name' => $row->name,
                        'slug' => $this->slug($row->name),
                        'rarity' => $row->rarity,
                        'type' => $row->type,
                        'level' => (int) $row->level,
                        'icon' => $row->icon,
                    ],
                    'craftable' => $root->craftable(),
                    /*
                     * Whether Google should be told about this page.
                     *
                     * Every page stays reachable — the material tree and the
                     * "used in" links are the graph a crawler walks — but only a
                     * reviewed subset is indexed. §20.2 of the working document
                     * asks for reviewed data rather than thousands of generated
                     * pages, and thirteen thousand unreviewed ones is the thing
                     * it names.
                     */
                    'indexable' => (bool) $row->is_indexable,
                    'requires' => $root->craftable() ? [
                        'disciplines' => $root->disciplines,
                        'min_rating' => $root->minRating,
                    ] : null,
                    'tree' => $root->toArray(),
                    'materials' => array_map(fn (RecipeNode $n) => [
                        'item_id' => $n->itemId,
                        'name' => $n->name,
                        'slug' => $n->name ? $this->slug($n->name) : null,
                        'rarity' => $n->rarity,
                        'icon' => $n->icon,
                        'needed' => $n->needed,
                    ], $tree->shoppingList($root)),
                    'used_in' => $this->usedIn((int) $row->id),
                ];
            }
        );

        if (! $payload) {
            return $this->error('No such item.', 404);
        }

        return $this->success($payload);
    }

    /**
     * GET /gw2/public/masteries
     *
     * Every track, its tiers and what each tier costs.
     *
     * Complete data and small — forty tracks — which makes it the one part of
     * this catalogue that needs no judgement at all about what to leave out.
     */
    public function masteries(): JsonResponse
    {
        return $this->success(Cache::remember($this->key('masteries'), self::TTL, function () {
            $regions = [];

            foreach (DB::table('gw2_masteries')->orderBy('region')->orderBy('order')->get() as $track) {
                $levels = json_decode($track->levels ?? '[]', true) ?: [];
                $account = MasteryRegions::toAccountName($track->region);

                // The catalogue has a region the account endpoint does not name.
                // It is shown under its own heading rather than filed under a
                // guess. See MasteryRegions.
                $key = $account ?? $track->region;

                $regions[$key] ??= [
                    'region' => $key,
                    'catalogue_region' => $track->region,
                    'paired' => $account !== null,
                    'tracks' => [],
                    'points_total' => 0,
                ];

                $cost = array_sum(array_map(fn ($l) => (int) ($l['point_cost'] ?? 0), $levels));

                $regions[$key]['tracks'][] = [
                    'id' => (int) $track->id,
                    'name' => $track->name,
                    'slug' => $this->slug($track->name),
                    'requirement' => $track->requirement,
                    'tiers' => count($levels),
                    'points_total' => $cost,
                    'levels' => array_map(fn ($l) => [
                        'name' => $l['name'] ?? '',
                        'description' => $l['description'] ?? null,
                        'point_cost' => (int) ($l['point_cost'] ?? 0),
                    ], $levels),
                ];

                $regions[$key]['points_total'] += $cost;
            }

            return array_values($regions);
        }));
    }

    /**
     * GET /gw2/public/guides
     *
     * Every published guide, for the index and the sitemap.
     */
    public function guides(): JsonResponse
    {
        return $this->success(Cache::remember($this->key('guides'), self::TTL, fn () => Gw2Guide::query()
            ->published()
            ->orderBy('family')
            ->orderBy('sort_order')
            ->get(['family', 'slug', 'title', 'standfirst', 'hero_image', 'updated_at'])
            ->map(fn (Gw2Guide $g) => [
                'family' => $g->family,
                'slug' => $g->slug,
                'title' => $g->title,
                'standfirst' => $g->standfirst,
                'hero_image' => $g->hero_image,
                'path' => $g->path(),
                'updated_at' => $g->updated_at?->toIso8601String(),
            ])
            ->all()));
    }

    /**
     * GET /gw2/public/guides/{family}/{slug}
     *
     * One guide, with no account attached. The personalised half is a separate,
     * authenticated call — this one has to be complete on its own, because
     * §20.2 requires the page to be useful without a key and because a page
     * that is empty for a crawler cannot rank.
     */
    public function guide(string $family, string $slug): JsonResponse
    {
        $payload = Cache::remember(
            $this->key("guide:{$family}:{$slug}"),
            self::TTL,
            function () use ($family, $slug) {
                $guide = Gw2Guide::query()->published()->where('family', $family)->where('slug', $slug)->first();

                if (! $guide) {
                    return null;
                }

                return [
                    'family' => $guide->family,
                    'slug' => $guide->slug,
                    'path' => $guide->path(),
                    'title' => $guide->title,
                    'standfirst' => $guide->standfirst,
                    'body' => $guide->body,
                    'hero_image' => $guide->hero_image,
                    'next_steps' => $guide->next_steps ?? [],
                    /*
                     * Named, not resolved. The figures behind it are somebody's
                     * own account and cannot be in a page cached for everyone.
                     */
                    'personalise_as' => $guide->personalise_as,
                    'seo' => [
                        'title' => $guide->seo_title ?: $guide->title,
                        'description' => $guide->seo_description ?: $guide->standfirst,
                        'keywords' => $guide->keywords ?? [],
                    ],
                    'reviewed_at' => $guide->reviewed_at?->toIso8601String(),
                    'updated_at' => $guide->updated_at?->toIso8601String(),
                ];
            }
        );

        if (! $payload) {
            return $this->error('No such guide.', 404);
        }

        return $this->success($payload);
    }

    /**
     * GET /gw2/public/craftable
     *
     * The index, and what the sitemap walks.
     *
     * 13,025 items have a recipe. Paged rather than returned whole: a sitemap
     * generator and a browse page both want a window, and neither wants a
     * megabyte.
     */
    public function craftable(Request $request): JsonResponse
    {
        $request->validate([
            'page' => 'nullable|integer|min:1|max:500',
            'rarity' => 'nullable|string|max:24',
            'type' => 'nullable|string|max:32',
        ]);

        // The browse index offers what the sitemap offers. Everything else is
        // reachable by link and simply not advertised.
        $query = self::craftableQuery(indexableOnly: true);

        if ($rarity = $request->string('rarity')->toString()) {
            $query->where('rarity', $rarity);
        }

        if ($type = $request->string('type')->toString()) {
            $query->where('type', $type);
        }

        $items = $query
            ->orderBy('id')
            ->paginate(100, ['id', 'name', 'rarity', 'type', 'icon']);

        return $this->success([
            'items' => array_map(fn ($i) => [
                'id' => (int) $i->id,
                'name' => $i->name,
                'slug' => $this->slug($i->name),
                'rarity' => $i->rarity,
                'type' => $i->type,
                'icon' => $i->icon,
            ], $items->items()),
            'page' => $items->currentPage(),
            'pages' => $items->lastPage(),
            'total' => $items->total(),
        ]);
    }

    /**
     * Items that have a recipe, counted exactly once.
     *
     * `whereExists` rather than a join with `distinct()`, and the difference is
     * not style. 105 items in this catalogue have more than one recipe, and
     * `paginate()` builds its total from `count(*)` over the joined rows before
     * the distinct is applied — so a join reported 13,156 craftable items where
     * there are 13,024, and therefore 132 pages where there are 131. The last
     * page would have been empty, and the index page turns an empty page into a
     * 404: a broken link inside our own pagination, pointed at by our own
     * sitemap.
     *
     * The sitemap builds its list the same way for the same reason. The two have
     * to agree by construction, not by both being written carefully.
     */
    public static function craftableQuery(bool $indexableOnly = false): Builder
    {
        $query = DB::table('gw2_items')
            ->where('name', '!=', '')
            ->whereNotNull('name');

        if ($indexableOnly) {
            /*
             * The flag is the authority, not craftability.
             *
             * 86 of the reviewed items are materials rather than products —
             * Mithril Ore has no recipe and is in 174 of them — and their page
             * answers "what is this used for", which is exactly why they were
             * reviewed in. Keying the sitemap on craftability left 26 pages
             * marked index and named nowhere.
             */
            return $query->where('is_indexable', true);
        }

        return $query->whereExists(fn ($q) => $q->selectRaw('1')
            ->from('gw2_recipes')
            ->whereColumn('gw2_recipes.output_item_id', 'gw2_items.id'));
    }

    /**
     * What this item goes into.
     *
     * The reason a materials page is worth reading on its own: somebody looking
     * up Deldrimor Steel Ingot usually wants to know what it is for. It is also
     * what turns 13,000 separate pages into a graph a crawler can walk.
     *
     * @return array<int, array<string, mixed>>
     */
    private function usedIn(int $itemId): array
    {
        $query = DB::table('gw2_recipes')
            ->join('gw2_items', 'gw2_items.id', '=', 'gw2_recipes.output_item_id')
            ->where('gw2_items.name', '!=', '');

        /*
         * Exact on both databases, each through its own facility.
         *
         * Production is PostgreSQL and `@>` is what `gw2_recipes_ingredients_gin`
         * answers — 0.147 ms against 9.2 ms for the scan it replaced. The suite
         * runs on SQLite, which has neither, so it walks the array with JSON1.
         *
         * What is deliberately *not* here is a LIKE on the serialised JSON. It
         * would pass every test in this file and quietly match item 1000 when
         * asked for item 100.
         */
        if (DB::connection()->getDriverName() === 'pgsql') {
            $query->whereRaw('gw2_recipes.ingredients @> ?::jsonb', [json_encode([['item_id' => $itemId]])]);
        } else {
            $query->whereRaw(
                "exists (select 1 from json_each(gw2_recipes.ingredients) je where json_extract(je.value, '$.item_id') = ?)",
                [$itemId]
            );
        }

        return $query
            ->orderBy('gw2_items.rarity')
            ->limit(24)
            ->get(['gw2_items.id', 'gw2_items.name', 'gw2_items.rarity', 'gw2_items.icon'])
            ->map(fn ($i) => [
                'id' => (int) $i->id,
                'name' => $i->name,
                'slug' => $this->slug($i->name),
                'rarity' => $i->rarity,
                'icon' => $i->icon,
            ])
            ->all();
    }

    /**
     * The build these pages were read at.
     *
     * `items` is the endpoint that moves most, and everything here derives from
     * it, so it stands for the catalogue as a whole. Falling back to 0 means an
     * unfilled catalogue caches under its own key rather than poisoning the
     * real one.
     */
    private function key(string $suffix): string
    {
        $build = Cache::remember('gw2:public:build', 300, fn () => (int) DB::table('gw2_catalog_meta')
            ->where('endpoint', 'items')
            ->value('build_id'));

        return 'gw2:public:v'.self::PAYLOAD_VERSION.":{$build}:{$suffix}";
    }

    /**
     * A readable URL segment. Never an identifier.
     *
     * Names in this catalogue are not unique — 74,265 items share 51,604 names,
     * and one of them appears 135 times — so every URL carries the id and the
     * slug is decoration a reader and a search engine can both use. Matching on
     * the slug would be a bug waiting for "Fallen Adventurer's Backpack".
     */
    private function slug(string $name): string
    {
        return trim(preg_replace('/-+/', '-', preg_replace('/[^a-z0-9]+/', '-', mb_strtolower($name))), '-');
    }
}
