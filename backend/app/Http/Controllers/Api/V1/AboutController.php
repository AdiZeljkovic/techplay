<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Game;
use App\Models\HelpArticle;
use App\Models\Studio;
use App\Models\User;
use App\Services\CacheService;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

/**
 * What the About page needs to describe the site truthfully.
 *
 * ── Why the figures come from here rather than from the page ─────────────
 *
 * The About page printed "141,000 games" in three places. The catalogue passed
 * two hundred thousand in the IGDB import of August 2026 and is over three
 * hundred thousand now, so for months the page understated the one thing it
 * was most proud of by more than half — and nobody noticed, because a number
 * typed into a paragraph has nothing to go wrong.
 *
 * That is the actual cause of a stale About page, and the fix is not to retype
 * the number. Every figure the page states is counted here, so the page cannot
 * drift from the site again.
 *
 * ── And why the team is read from author pages ───────────────────────────
 *
 * This endpoint used to group staff by their assigned role, which returned two
 * people. Six write here: the other four have a public author page and no
 * editorial role, because roles are assigned by hand and that step is easy to
 * forget. A page about who we are that names a third of us is worse than one
 * that names nobody, so the list is built from the thing that is true by
 * construction — having an author page means having written something.
 */
class AboutController extends Controller
{
    /** Editorial roles, in the order they should be shown. */
    private const ROLE_ORDER = ['Editor-in-Chief', 'Editor', 'Journalist', 'Moderator'];

    public function index()
    {
        return response()->json([
            'team' => $this->team(),
            'figures' => $this->figures(),
        ]);
    }

    /**
     * Everyone with a public author page, best-known first.
     *
     * @return array<int, array<string, mixed>>
     */
    private function team(): array
    {
        return Cache::remember('about.team.v1', CacheService::TTL_LONG, function () {
            $authors = User::query()
                ->whereNotNull('author_slug')
                ->with('roles:id,name')
                ->withCount(['articles' => fn ($q) => $q->where('status', 'published')])
                ->get(['id', 'username', 'display_name', 'name', 'avatar_url', 'bio', 'tagline', 'author_slug', 'created_at']);

            return $authors
                ->map(function (User $user): array {
                    $role = $user->roles
                        ->map(fn ($r) => $r->name)
                        ->filter(fn (string $name) => in_array($name, self::ROLE_ORDER, true))
                        ->sortBy(fn (string $name) => array_search($name, self::ROLE_ORDER, true))
                        ->first();

                    return [
                        'name' => $user->display_name ?: ($user->name ?: $user->username),
                        'username' => $user->username,
                        'slug' => $user->author_slug,
                        'avatar_url' => $user->avatar_url,
                        // The tagline is the one-liner people write about
                        // themselves; the bio is the long version and belongs
                        // on the author page rather than in a grid.
                        'tagline' => $user->tagline ?: $user->bio,
                        'role' => $role,
                        'articles' => (int) $user->articles_count,
                    ];
                })
                // Editorial roles first, then whoever has written most. Both
                // halves matter: a masthead that is only a leaderboard reads as
                // a competition, and one that ignores output entirely puts the
                // person who wrote once above the person who writes weekly.
                ->sortBy([
                    fn (array $a, array $b) => ($a['role'] ? 0 : 1) <=> ($b['role'] ? 0 : 1),
                    fn (array $a, array $b) => $b['articles'] <=> $a['articles'],
                ])
                ->values()
                ->all();
        });
    }

    /**
     * The figures the page states, counted rather than remembered.
     *
     * @return array<string, int>
     */
    private function figures(): array
    {
        return Cache::flexible('about.figures.v1', [CacheService::TTL_DAY, CacheService::TTL_DAY * 2], fn (): array => [
            'games' => Game::count(),
            'studios' => Studio::count(),
            'articles' => DB::table('articles')->where('status', 'published')->count(),
            'answers' => HelpArticle::published()->count(),
        ]);
    }
}
