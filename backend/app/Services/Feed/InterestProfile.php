<?php

namespace App\Services\Feed;

use App\Casts\PostgresArray;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

/**
 * What we can honestly say a reader is interested in.
 *
 * Built only from things the reader did: what they opened, what they saved,
 * what they replied to, and what is in their game collection. Nothing is
 * inferred from who they are.
 *
 * The profile deliberately reports whether it found anything at all. A feed
 * that quietly falls back to "newest" while calling itself personalised is
 * worse than one that says it does not know you yet.
 */
class InterestProfile
{
    /**
     * How much each action says about interest.
     *
     * Saving something is the clearest statement, then replying to it, then
     * finishing it. Opening and abandoning a piece says the least — it is kept
     * only because it is still evidence the subject drew a click.
     */
    private const WEIGHTS = [
        'bookmark' => 5,
        'comment' => 3,
        'read_through' => 3,
        'read' => 1,
        'collection' => 2,
    ];

    /**
     * How far through an article counts as having read it.
     *
     * progress is a smallint percentage, 0–100, which is what
     * ReadingController validates and stores — not a fraction.
     */
    private const READ_THROUGH = 50;

    /** @var array<string,float> tag => weight */
    public array $tags = [];

    /** @var array<int,float> category id => weight */
    public array $categories = [];

    /** @var array<int,bool> game ids the reader wants but does not own */
    public array $wishlist = [];

    /** @var array<int,bool> article ids already read, to be kept out of the feed */
    public array $seen = [];

    /** What the profile was actually built from, for the page to be honest about. */
    public array $basis = ['reads' => 0, 'bookmarks' => 0, 'comments' => 0, 'games' => 0];

    /**
     * Four queries, held for five minutes.
     *
     * A reading history does not turn over between two page loads, and this was
     * being rebuilt from scratch on every request to the personalised feed —
     * including the second page of the same session. The window matters only at
     * the edge: an article read now counts towards the feed within five
     * minutes rather than on the next refresh.
     */
    public static function for(int $userId): self
    {
        return Cache::remember("feed.profile.v1.{$userId}", 300, function () use ($userId) {
            $profile = new self;

            $profile->fromReading($userId);
            $profile->fromBookmarks($userId);
            $profile->fromComments($userId);
            $profile->fromCollection($userId);

            return $profile;
        });
    }

    /** True when there is nothing to go on and the feed must say so. */
    public function isEmpty(): bool
    {
        return $this->tags === [] && $this->categories === [] && $this->wishlist === [];
    }

    private function fromReading(int $userId): void
    {
        $rows = DB::table('article_reads')
            ->join('articles', 'articles.id', '=', 'article_reads.article_id')
            ->where('article_reads.user_id', $userId)
            ->orderByDesc('article_reads.last_read_at')
            ->limit(200)
            ->get(['articles.id', 'articles.category_id', 'articles.tags', 'article_reads.progress']);

        $this->basis['reads'] = $rows->count();

        foreach ($rows as $row) {
            $this->seen[(int) $row->id] = true;

            $weight = (int) $row->progress >= self::READ_THROUGH
                ? self::WEIGHTS['read_through']
                : self::WEIGHTS['read'];

            $this->credit($row->category_id, $row->tags, $weight);
        }
    }

    private function fromBookmarks(int $userId): void
    {
        $rows = DB::table('article_bookmarks')
            ->join('articles', 'articles.id', '=', 'article_bookmarks.article_id')
            ->where('article_bookmarks.user_id', $userId)
            ->limit(200)
            ->get(['articles.category_id', 'articles.tags']);

        $this->basis['bookmarks'] = $rows->count();

        foreach ($rows as $row) {
            $this->credit($row->category_id, $row->tags, self::WEIGHTS['bookmark']);
        }
    }

    private function fromComments(int $userId): void
    {
        $rows = DB::table('comments')
            ->join('articles', 'articles.id', '=', 'comments.commentable_id')
            ->where('comments.user_id', $userId)
            ->where('comments.commentable_type', 'App\\Models\\Article')
            ->limit(200)
            ->get(['articles.category_id', 'articles.tags']);

        $this->basis['comments'] = $rows->count();

        foreach ($rows as $row) {
            $this->credit($row->category_id, $row->tags, self::WEIGHTS['comment']);
        }
    }

    /**
     * The game collection, read through the genres it is made of.
     *
     * genres is a Postgres text[]; on SQLite, which the tests run on, the
     * same column is plain text. Both are read as a list rather than unnested
     * in SQL, which keeps this one query and one code path.
     */
    private function fromCollection(int $userId): void
    {
        $rows = DB::table('user_games')
            ->join('games', 'games.id', '=', 'user_games.game_id')
            ->where('user_games.user_id', $userId)
            ->limit(500)
            ->get(['games.id', 'games.genres', 'user_games.status']);

        $this->basis['games'] = $rows->count();

        foreach ($rows as $row) {
            if ($row->status === 'wishlist') {
                $this->wishlist[(int) $row->id] = true;
            }

            foreach (self::genres($row->genres) as $genre) {
                $key = self::normalise($genre);
                if ($key !== '') {
                    $this->tags[$key] = ($this->tags[$key] ?? 0) + self::WEIGHTS['collection'];
                }
            }
        }
    }

    private function credit(mixed $categoryId, mixed $rawTags, float $weight): void
    {
        if ($categoryId) {
            $this->categories[(int) $categoryId] = ($this->categories[(int) $categoryId] ?? 0) + $weight;
        }

        foreach (ContentFeed::tags($rawTags) as $tag) {
            $key = self::normalise($tag);
            if ($key !== '') {
                $this->tags[$key] = ($this->tags[$key] ?? 0) + $weight;
            }
        }
    }

    /** @return array<int,string> */
    private static function genres(mixed $raw): array
    {
        if (is_array($raw)) {
            return $raw;
        }

        if (! is_string($raw) || $raw === '') {
            return [];
        }

        // Postgres hands back arrays as {Action,"Role-Playing (RPG)"} when they
        // come through PDO untouched. Split here on every comma, so a tag like
        // "4X (explore, expand, exploit, and exterminate)" became four
        // interests, none of which anybody has.
        if (str_starts_with($raw, '{')) {
            return PostgresArray::parse($raw);
        }

        $decoded = json_decode($raw, true);

        return is_array($decoded) ? $decoded : [$raw];
    }

    public static function normalise(string $value): string
    {
        return trim(mb_strtolower($value));
    }

    /**
     * The top few things this reader is into, in words, so the page can show
     * what it is going on rather than asking for trust.
     *
     * @return array<int,string>
     */
    public function topTags(int $limit = 5): array
    {
        $tags = $this->tags;
        arsort($tags);

        return array_slice(array_keys($tags), 0, $limit);
    }
}
