<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Studio;
use App\Services\CacheService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Studios, as a section of the site rather than a field on a game.
 *
 * The listing shows the ones worth landing on — a studio with one game and
 * nothing written about it has a page, because game pages link to it, but it is
 * not what anyone wants on page one of an index. `indexable` carries that
 * distinction and `?all=1` sets it aside for anyone who wants the long tail.
 */
class StudioController extends Controller
{
    use ApiResponse;

    private const PER_PAGE = 24;

    public function index(Request $request): JsonResponse
    {
        $perPage = min(60, max(6, (int) $request->integer('per_page', self::PER_PAGE)));

        $query = Studio::query()
            ->when(! $request->boolean('all'), fn ($q) => $q->where('indexable', true))
            /* Either the ISO number IGDB stores or the two-letter code a URL
               would carry — /studios?country=JP has to work as well as 392. */
            ->when($request->filled('country'), fn ($q) => $q->where('country', $this->countryCode((string) $request->input('country'))))
            ->when($request->filled('search'), function ($q) use ($request) {
                $term = trim((string) $request->input('search'));

                /* ILIKE on Postgres, LIKE everywhere else — the tests run on
                   SQLite, which has neither the operator nor a case-sensitive
                   LIKE to need it. */
                $operator = $q->getConnection()->getDriverName() === 'pgsql' ? 'ilike' : 'like';

                $q->where('name', $operator, '%'.$term.'%');
            });

        $sort = $request->input('sort', 'games');

        match ($sort) {
            'name' => $query->orderBy('name'),
            'founded' => $query->orderByRaw('founded is null')->orderBy('founded'),
            default => $query->orderByDesc('games_count')->orderBy('name'),
        };

        $studios = $query->paginate($perPage);

        $studios->setCollection($studios->getCollection()->map(fn (Studio $s) => $this->card($s)));

        return $this->paginated($studios);
    }

    public function show(string $slug): JsonResponse
    {
        /* A miss stores null, which Cache cannot tell from an absent key, so a
           slug nobody holds simply re-runs the lookup rather than being
           remembered as missing. That is the behaviour we want here. */
        $studio = CacheService::remember(
            "studios.show.v1.{$slug}",
            fn () => $this->payload($slug),
            3600,
        );

        if ($studio === null) {
            return $this->notFound('Studio nije pronadjen.');
        }

        return $this->success($studio);
    }

    /** @return array<string, mixed>|null */
    private function payload(string $slug): ?array
    {
        $studio = Studio::where('slug', $slug)
            ->with(['parent:id,name,slug', 'became:id,name,slug'])
            ->first();

        if (! $studio) {
            return null;
        }

        return [
            'id' => $studio->id,
            'name' => $studio->name,
            'slug' => $studio->slug,
            'description' => $studio->description,
            'logo_url' => $studio->logo_url,
            'country' => $this->country($studio->country),
            'founded' => $studio->founded?->format('Y-m-d'),
            'website' => $studio->website,
            'indexable' => $studio->indexable,

            /* A studio that closed in 1995 is a different thing from one
               shipping games this year, and the page had no way to say so.
               `active` is stated rather than implied by silence, because IGDB
               not knowing and IGDB saying "still working" are not the same. */
            'status' => $studio->status,
            'changed_at' => $studio->changed_at?->format('Y-m-d'),
            'became' => $studio->became ? ['name' => $studio->became->name, 'slug' => $studio->became->slug] : null,
            'games_count' => $studio->games_count,
            'developed_count' => $studio->developed_count,
            'published_count' => $studio->published_count,
            'parent' => $studio->parent ? ['name' => $studio->parent->name, 'slug' => $studio->parent->slug] : null,
            'subsidiaries' => $studio->subsidiaries()
                ->orderByDesc('games_count')
                ->limit(24)
                ->get(['name', 'slug', 'logo_url', 'games_count'])
                ->toArray(),

            /* The two lists apart, which is the whole reason the role is on the
               pivot. Newest first: a studio's recent work is what a reader came
               for, and the 1994 shovelware can wait for the full list. */
            'developed' => $this->games($studio, 'developer'),
            'published' => $this->games($studio, 'publisher'),
        ];
    }

    /** @return array<int, array<string, mixed>> */
    private function games(Studio $studio, string $role): array
    {
        return $studio->games()
            ->wherePivot('role', $role)
            ->orderByRaw('games.released is null')
            ->orderByDesc('games.released')
            ->limit(48)
            ->get(['games.id', 'games.name', 'games.slug', 'games.cover_url', 'games.released', 'games.rating'])
            ->map(fn ($game) => [
                'name' => $game->name,
                'slug' => $game->slug,
                'cover_url' => $game->cover_url,
                'released' => $game->released?->format('Y-m-d'),
                'rating' => $game->rating,
            ])
            ->toArray();
    }

    /** "JP" or "392", both meaning Japan. Zero when neither is known. */
    private function countryCode(string $input): int
    {
        $input = trim($input);

        if (ctype_digit($input)) {
            return (int) $input;
        }

        foreach (config('countries') as $code => [$alpha2]) {
            if (strcasecmp($alpha2, $input) === 0) {
                return (int) $code;
            }
        }

        return 0;
    }

    /**
     * A country as something printable.
     *
     * IGDB gives ISO 3166-1 numeric and nothing else. Resolved here so the
     * mapping has one home and no client has to know that 392 means Japan; a
     * code we do not hold comes back null, because a studio missing its country
     * line is a smaller wrong than one labelled with somebody else's.
     *
     * @return array{code: int, alpha2: string, name: string}|null
     */
    private function country(?int $code): ?array
    {
        if ($code === null) {
            return null;
        }

        $entry = config('countries')[$code] ?? null;

        return $entry ? ['code' => $code, 'alpha2' => $entry[0], 'name' => $entry[1]] : null;
    }

    /** @return array<string, mixed> */
    private function card(Studio $studio): array
    {
        return [
            'name' => $studio->name,
            'slug' => $studio->slug,
            'logo_url' => $studio->logo_url,
            'country' => $this->country($studio->country),
            'founded' => $studio->founded?->format('Y'),
            'games_count' => $studio->games_count,
            'developed_count' => $studio->developed_count,
            'published_count' => $studio->published_count,
        ];
    }
}
