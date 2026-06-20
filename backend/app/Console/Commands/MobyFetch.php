<?php

namespace App\Console\Commands;

use App\Models\Game;
use App\Models\GameCompany;
use App\Services\MobyGamesService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Bulk-import all MobyGames games via the paginated list API.
 *
 * The /v1/games?include=publishers,developers endpoint returns full game data
 * (description, genres, platforms, developers, publishers, cover, screenshots),
 * so a single pass fills everything except age ratings, full screenshots, and
 * cover art gallery — those are handled by `moby:enrich` afterwards.
 *
 * Usage:
 *   php artisan moby:fetch                     # fetch all from offset 0
 *   php artisan moby:fetch --offset=5000       # resume from a specific offset
 *   php artisan moby:fetch --max=10000         # fetch only N games (testing)
 */
class MobyFetch extends Command
{
    protected $signature = 'moby:fetch
        {--offset=0  : Starting offset (use to resume an interrupted run)}
        {--max=0     : Max total games to fetch this run (0 = all)}
        {--batch=100 : Games per API call (MobyGames max is 100)}';

    protected $description = 'Bulk-import all MobyGames game data via the paginated list API';

    private MobyGamesService $moby;

    public function handle(MobyGamesService $moby): int
    {
        $this->moby = $moby;
        $offset = (int) $this->option('offset');
        $max = (int) $this->option('max');
        $batchSize = min(100, max(1, (int) $this->option('batch')));
        $totalFetched = 0;
        $totalUpserted = 0;

        $this->info("Starting MobyGames bulk fetch (offset={$offset}, max=".($max ?: 'unlimited').')');
        $this->line('Rate limit: 0.2 req/sec = 1 call / 5 sec. Each call imports '.$batchSize.' games.');
        $this->newLine();

        while (true) {
            if ($max > 0 && $totalFetched >= $max) {
                $this->info("Reached max limit of {$max} games.");
                break;
            }

            $this->line("Fetching offset={$offset} …");

            $response = $this->moby->getGames($offset, $batchSize);

            if (! $response || empty($response['games'])) {
                $this->info('No more games returned — fetch complete.');
                break;
            }

            $games = $response['games'];
            $count = count($games);
            $upserted = $this->processBatch($games);

            $totalFetched += $count;
            $totalUpserted += $upserted;
            $offset += $count;

            $this->line("  → Batch: {$count} received, {$upserted} upserted. Total: {$totalFetched} fetched, {$totalUpserted} upserted. Next offset: {$offset}");

            // API returned fewer than requested — we've reached the end
            if ($count < $batchSize) {
                $this->info('Last page reached — fetch complete.');
                break;
            }
        }

        $this->newLine();
        $this->info("Done. Total fetched: {$totalFetched} | Upserted: {$totalUpserted}");
        $this->line('Run supplementary enrichment next:');
        $this->line('  php artisan moby:enrich');
        $this->line('  php artisan queue:work --queue=moby-enrich --sleep=1 --tries=3');

        return self::SUCCESS;
    }

    private function processBatch(array $games): int
    {
        $upserted = 0;

        foreach ($games as $data) {
            try {
                $this->upsertGame($data);
                $upserted++;
            } catch (\Throwable $e) {
                $this->warn('  Error processing game_id='.($data['game_id'] ?? '?').': '.$e->getMessage());
            }
        }

        return $upserted;
    }

    private function upsertGame(array $data): void
    {
        $mobyId = $data['game_id'] ?? null;
        if (! $mobyId) {
            return;
        }

        $mobyUrl = $data['moby_url'] ?? null;
        $slug = $mobyUrl ? MobyGamesService::slugFromUrl($mobyUrl) : null;
        if (! $slug) {
            $slug = Str::slug($data['title'] ?? 'game-'.$mobyId);
        }

        // Make slug unique if it conflicts with another game
        $slug = $this->uniqueSlug($slug, $mobyId);

        $descriptionHtml = $data['description'] ?? null;
        $descriptionRaw = $descriptionHtml ? strip_tags($descriptionHtml) : null;

        ['genre_names' => $genreNames, 'tag_names' => $tagNames] =
            MobyGamesService::splitGenres($data['genres'] ?? []);

        $platformNames = MobyGamesService::normalizePlatformNames($data['platforms'] ?? []);
        $released = MobyGamesService::earliestReleaseDate($data['platforms'] ?? []);

        $detailsData = [
            'description' => $descriptionHtml,
            'description_raw' => $descriptionRaw,
            'moby_url' => $mobyUrl,
            'official_url' => $data['official_url'] ?? null,
            'num_votes' => $data['num_votes'] ?? 0,
            'alternate_titles' => $data['alternate_titles'] ?? [],
            'sample_screenshots' => $data['sample_screenshots'] ?? [],
            'developers' => $data['developers'] ?? [],
            'publishers' => $data['publishers'] ?? [],
            'ratings' => [],  // filled by moby:enrich
            'attributes' => [],  // filled by moby:enrich
            'covers' => [],  // filled by moby:enrich
        ];

        $backgroundImage = $data['sample_cover']['thumbnail_image']
            ?? $data['sample_cover']['image']
            ?? null;

        $shortScreenshots = array_slice($data['sample_screenshots'] ?? [], 0, 5);

        // Build the record to upsert
        $record = [
            'moby_id' => $mobyId,
            'slug' => $slug,
            'name' => $data['title'] ?? $slug,
            'rating' => $data['moby_score'] ?? null,
            'has_description' => ! empty($descriptionRaw),
            'details_data' => json_encode($detailsData),
            'short_screenshots' => json_encode($shortScreenshots),
            'details_crawled_at' => now()->toDateTimeString(),
        ];

        if ($backgroundImage) {
            $record['background_image'] = $backgroundImage;
        }

        if ($released) {
            $record['released'] = $released;
        }

        if (! empty($data['platforms'])) {
            $record['platforms'] = json_encode($data['platforms']);
        }

        // Upsert game by moby_id
        DB::table('games')->upsert(
            [$record],
            ['moby_id'],
            ['name', 'slug', 'rating', 'has_description', 'details_data',
                'short_screenshots', 'background_image', 'released', 'platforms',
                'details_crawled_at']
        );

        // Get the game id for array updates and company pivots
        $gameId = DB::table('games')->where('moby_id', $mobyId)->value('id');
        if (! $gameId) {
            return;
        }

        // Update TEXT[] columns (genre_names, platform_names, tag_names)
        if (! empty($genreNames)) {
            $this->updateTextArray($gameId, 'genre_names', $genreNames);
        }
        if (! empty($platformNames)) {
            $this->updateTextArray($gameId, 'platform_names', $platformNames);
        }
        if (! empty($tagNames)) {
            $this->updateTextArray($gameId, 'tag_names', $tagNames);
        }

        // Upsert developers and publishers into game_companies + pivot
        $this->upsertCompanies($gameId, $data['developers'] ?? [], 'developer');
        $this->upsertCompanies($gameId, $data['publishers'] ?? [], 'publisher');
    }

    private function uniqueSlug(string $slug, int $mobyId): string
    {
        $exists = DB::table('games')
            ->where('slug', $slug)
            ->where('moby_id', '!=', $mobyId)
            ->exists();

        if (! $exists) {
            return $slug;
        }

        // Append moby_id to make it unique
        return $slug.'-'.$mobyId;
    }

    private function upsertCompanies(int $gameId, array $companies, string $role): void
    {
        foreach ($companies as $company) {
            $mobyCompanyId = $company['company_id'] ?? null;
            $companyName = $company['company_name'] ?? null;

            if (! $mobyCompanyId || ! $companyName) {
                continue;
            }

            $slug = Str::slug($companyName);

            $gc = GameCompany::updateOrCreate(
                ['moby_company_id' => $mobyCompanyId],
                [
                    'name' => $companyName,
                    'slug' => $slug,
                    'moby_url' => $company['moby_url'] ?? null,
                ]
            );

            // Update role to 'both' if needed
            if ($gc->role !== $role && in_array($gc->role, ['developer', 'publisher'], true)) {
                $gc->update(['role' => 'both']);
            }

            $gc->increment('games_count');

            DB::table('game_company')->insertOrIgnore([
                'game_id' => $gameId,
                'game_company_id' => $gc->id,
                'role' => $role,
            ]);
        }
    }

    private function updateTextArray(int $gameId, string $column, array $values): void
    {
        $literal = '{'.implode(',', array_map(
            fn ($v) => '"'.addslashes($v).'"',
            $values
        )).'}';

        DB::statement("UPDATE games SET {$column} = ? WHERE id = ?", [$literal, $gameId]);
    }
}
