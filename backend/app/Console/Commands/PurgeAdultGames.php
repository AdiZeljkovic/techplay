<?php

namespace App\Console\Commands;

use App\Models\Game;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 * Removes adult titles from the catalogue, with receipts.
 *
 * The authoritative marker is Moby's own "Adult" tag — measured at 12,716
 * rows, against ~2,200 for the keyword list, of which all but ~200 also carry
 * the tag. Keywords exist to catch the stragglers, and they are split in two:
 *
 *  - SAFE words appear in adult titles and nowhere else (hentai, nsfw, ...).
 *    A word-boundary hit on name or tags deletes the row.
 *  - GREY words also appear in legitimate games — "yuri" is in Command &
 *    Conquer: Yuri's Revenge, "strip" in drag-strip racers, "furry" in a
 *    children's platformer. Grey hits WITHOUT the Adult tag are written to a
 *    review file for a human decision, never deleted blind.
 *
 * Every deleted row is dumped to a gzipped JSON archive first, and leaves a
 * tombstone so its URL answers 410 rather than 404. Latin-lookalike noise in
 * names (the katakana interpunct, Cyrillic С in otherwise-English titles) is
 * normalised in the same pass; names in genuinely non-Latin scripts join the
 * review file — measurement found only a handful, most of them false alarms.
 */
class PurgeAdultGames extends Command
{
    protected $signature = 'games:purge-adult
        {--dry-run : Count and write the review file, delete nothing}';

    protected $description = 'Delete adult titles (Adult tag + unambiguous keywords), archive them, leave tombstones';

    /** Word-boundary hits on these delete outright. */
    private const SAFE_WORDS = [
        'hentai', 'nsfw', 'futanari', 'milf', 'blowjob', 'handjob',
        'masturbation', 'masturbate', 'orgasm', 'stripper', 'eroge', 'ecchi',
        'lewd', 'uncensored', 'erotic', 'erotica', 'xxx', 'incest',
        'succubus', 'horny', 'boobs', 'tits', 'pussy', 'cum', 'h-game',
        'waifu', '18\+',
    ];

    /** These also live in legitimate titles — review, never blind-delete. */
    private const GREY_WORDS = ['yuri', 'strip', 'furry', 'pregnancy'];

    /**
     * Mainstream titles Moby's "Adult" tag marks for content, not for being
     * adult games — a hand-curated whitelist (the first run deleted The
     * Witcher 3 before anyone noticed the tag is a descriptor). Larry,
     * Playboy and the strip-poker catalogue stay deleted by choice.
     */
    private const SPARED_SLUGS = [
        'the-witcher', 'the-witcher-2-assassins-of-kings',
        'the-witcher-2-assassins-of-kings-enhanced-edition', 'the-witcher-3-wild-hunt',
        'cyberpunk-2077', 'far-cry-3',
        'god-of-war-ii', 'god-of-war-iii', 'god-of-war-iii-remastered',
        'god-of-war-chains-of-olympus', 'god-of-war-ghost-of-sparta', 'god-of-war-origins-collection',
        'duke-nukem-3d', 'duke-nukem-3d-30962', 'duke-nukem-3d-20th-anniversary-world-tour',
        'duke-nukem-64', 'duke-nukem-forever',
        'indigo-prophecy', 'fahrenheit-indigo-prophecy-remastered',
        'catherine', 'catherine-full-body', 'catherine-full-body-digital-deluxe-edition',
        'catherine-full-body-hearts-desire-premium-edition', 'catherine-full-body-dlc-bundle',
        'catherine-full-body-playable-character-set',
        'catherine-full-body-persona-5-joker-character-commentary-set',
        'catherine-full-body-bonus-content-horn-rimmed-glasses',
        'catherine-full-body-the-ideal-voice-all-voice-set',
        'catherine-full-body-the-ideal-voice-lovely-voice-set',
        'catherine-full-body-the-ideal-voice-sexy-voice-set',
        'catherine-full-body-the-ideal-voice-pretty-voice-set',
        'manhunt-2', 'dreamweb', 'the-cat-lady', 'the-godfather-ii',
        'second-life', 'the-sopranos-road-to-respect',
    ];

    public function handle(): int
    {
        if (DB::getDriverName() !== 'pgsql') {
            $this->error('This command speaks Postgres (word-boundary regex, text[]).');

            return self::FAILURE;
        }

        $dry = (bool) $this->option('dry-run');
        $safe = implode('|', self::SAFE_WORDS);
        $grey = implode('|', self::GREY_WORDS);

        // ── the sets ─────────────────────────────────────────────────────
        $doomedIds = DB::table('games')
            ->where(function ($q) use ($safe) {
                $q->whereRaw("tags @> ARRAY['Adult']::text[]")
                    ->orWhereRaw("(name || ' ' || array_to_string(tags, ' ')) ~* '\\m({$safe})\\M'");
            })
            ->whereNotIn('slug', self::SPARED_SLUGS)
            ->pluck('id');

        $greyRows = DB::table('games')
            ->whereRaw("(name || ' ' || array_to_string(tags, ' ')) ~* '\\m({$grey})\\M'")
            ->whereRaw("NOT (tags @> ARRAY['Adult']::text[])")
            ->whereNotIn('id', $doomedIds)
            ->get(['id', 'slug', 'name', 'tags']);

        $nonLatin = DB::table('games')
            ->whereNotIn('id', $doomedIds)
            ->whereRaw($this->nonLatinPredicate())
            ->get(['id', 'slug', 'name']);

        $this->info(sprintf(
            'Za brisanje: %s | sivi skup (pregled): %d | ne-latinica (pregled): %d',
            number_format($doomedIds->count()), $greyRows->count(), $nonLatin->count()
        ));

        // ── the review file exists in every mode ─────────────────────────
        $review = [
            'written_at' => now()->toIso8601String(),
            'grey_keyword_hits' => $greyRows->map(fn ($r) => [
                'id' => $r->id, 'slug' => $r->slug, 'name' => $r->name, 'tags' => $r->tags,
            ])->all(),
            'non_latin_names' => $nonLatin->map(fn ($r) => [
                'id' => $r->id, 'slug' => $r->slug, 'name' => $r->name,
            ])->all(),
        ];
        $reviewPath = storage_path('app/adult-review.json');
        file_put_contents($reviewPath, json_encode($review, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
        $this->line("Review fajl: {$reviewPath}");

        if ($dry) {
            $this->info('Dry run — ništa nije obrisano.');

            return self::SUCCESS;
        }

        // ── archive before anything dies ─────────────────────────────────
        $archivePath = storage_path('app/backups/adult-purge-'.now()->format('Y-m-d-His').'.json.gz');
        @mkdir(dirname($archivePath), 0775, true);
        $gz = gzopen($archivePath, 'wb6');
        foreach ($doomedIds->chunk(1000) as $chunk) {
            foreach (DB::table('games')->whereIn('id', $chunk)->get() as $row) {
                gzwrite($gz, json_encode($row, JSON_UNESCAPED_UNICODE)."\n");
            }
        }
        gzclose($gz);
        $this->line('Arhiva: '.$archivePath.' ('.round(filesize($archivePath) / 1048576, 1).' MB)');

        // ── tombstones, then the delete, in digestible bites ─────────────
        $deleted = 0;
        foreach ($doomedIds->chunk(1000) as $chunk) {
            $stones = DB::table('games')->whereIn('id', $chunk)->get(['id', 'slug', 'name'])
                ->map(fn ($r) => [
                    'slug' => $r->slug, 'name' => $r->name,
                    'reason' => 'adult', 'deleted_at' => now(),
                ])->all();
            DB::table('game_tombstones')->upsert($stones, ['slug'], ['name', 'reason', 'deleted_at']);

            // Children first; none of these tables cascade.
            foreach (['game_store_links' => 'game_id', 'game_external_ids' => 'game_id',
                'user_games' => 'game_id', 'game_ratings' => 'game_id',
                'game_list_items' => 'game_id'] as $tbl => $col) {
                DB::table($tbl)->whereIn($col, $chunk)->delete();
            }

            $deleted += DB::table('games')->whereIn('id', $chunk)->delete();
            $this->output->write('.');
        }
        $this->newLine();

        // ── normalise the lookalike noise in survivors ───────────────────
        // The katakana interpunct joins list titles (Danganronpa 1・2); it
        // becomes a middot. Cyrillic С/с in otherwise-Latin names is a typo
        // for C/c ("Parking Сar") and is corrected outright.
        $interpunct = DB::update("UPDATE games SET name = replace(name, '・', '·') WHERE name LIKE '%・%'");
        $cyrillic = DB::update(<<<'SQL'
            UPDATE games SET name = translate(name, 'Сс', 'Cc')
            WHERE name ~ '[Сс]' AND name !~ '[А-Яа-яЁё]{2,}'
        SQL);

        $this->info(sprintf(
            'Obrisano %s igara. Normalizovano: %d interpunkt, %d ćirilični lookalike.',
            number_format($deleted), $interpunct, $cyrillic
        ));
        $this->line('Preostalo igara: '.number_format(Game::count()));

        return self::SUCCESS;
    }

    /** Names carrying CJK, kana, Hangul, Cyrillic runs, Arabic or Thai. */
    private function nonLatinPredicate(): string
    {
        // Built via chr() so no non-ASCII literals live in this file.
        return "name ~ ('['
            || chr(x'4E00'::int) || '-' || chr(x'9FFF'::int)
            || chr(x'3040'::int) || '-' || chr(x'30FA'::int)
            || chr(x'AC00'::int) || '-' || chr(x'D7AF'::int)
            || chr(x'0600'::int) || '-' || chr(x'06FF'::int)
            || chr(x'0E00'::int) || '-' || chr(x'0E7F'::int)
            || ']') OR name ~ ('[' || chr(x'0400'::int) || '-' || chr(x'04FF'::int) || ']{2,}')";
    }
}
