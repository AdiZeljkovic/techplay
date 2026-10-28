<?php

namespace App\Services\Gw2;

use App\Services\Gw2\Advisor\ContentProgress;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;

/**
 * Wiki pages for the things the API names only by slug.
 *
 * Raids, wings, dungeons and world bosses come back from the game as
 * `vale_guardian`, `spirit_vale`, `voice_in_the_void`. Turning a slug into a
 * page title is a guess — Dhuum's encounter is `voice_in_the_void`, and a search
 * for a generic word lands wherever the wiki keeps that word — so these get a
 * link only once somebody has opened the page and agreed it is the right one.
 *
 * Each subject is one `gw2_sources` row with a `subject` key. The row is created
 * with a suggested URL and no `checked_at`; until an editor confirms it, the
 * reader sees no link at all. Items, achievements, mastery tracks and mounts do
 * not come through here: their links are exact by construction (`Wiki`).
 */
class WikiPages
{
    /**
     * Subject => URL, for the pages somebody has confirmed.
     *
     * @return array<string, string>
     */
    public function checked(): array
    {
        return DB::table('gw2_sources')
            ->whereNotNull('subject')
            ->whereNotNull('checked_at')
            ->pluck('url', 'subject')
            ->all();
    }

    /**
     * What the page at this URL calls itself, read the one time an editor asks.
     *
     * The title, not the status: while the wiki was down in October 2026 every
     * URL answered 200 with a maintenance notice, so a status check would have
     * confirmed a hundred pages that did not exist. An article's title ends in
     * the wiki's own suffix; anything else is not a page we can vouch for.
     *
     * Only `/wiki/…` URLs are fetched. The wiki's robots.txt disallows
     * `index.php` and `Special:`, and this is one request per click, never a
     * crawl.
     *
     * @return array{ok: bool, title: ?string, reason: string}
     */
    public function title(string $url): array
    {
        if (! str_starts_with($url, Wiki::BASE.'/wiki/')) {
            return ['ok' => false, 'title' => null, 'reason' => 'Only '.Wiki::BASE.'/wiki/… pages can be checked here.'];
        }

        try {
            $response = Http::timeout(10)
                ->withHeaders(['User-Agent' => 'TechPlay.gg wiki link check (one request per editor click)'])
                ->get($url);
        } catch (\Throwable $e) {
            return ['ok' => false, 'title' => null, 'reason' => 'The wiki could not be reached: '.$e->getMessage()];
        }

        if (! preg_match('~<title>(.*?)</title>~si', $response->body(), $m)) {
            return ['ok' => false, 'title' => null, 'reason' => 'The response has no page title.'];
        }

        $title = trim(html_entity_decode($m[1], ENT_QUOTES | ENT_HTML5));

        if (! preg_match('~^(.+) - Guild Wars 2 Wiki \(GW2W\)$~u', $title, $page)) {
            return ['ok' => false, 'title' => $title, 'reason' => 'That is not a wiki article — most likely the maintenance page.'];
        }

        return ['ok' => true, 'title' => $page[1], 'reason' => ''];
    }

    /**
     * One row per raid wing, raid boss, dungeon and world boss the catalogue
     * knows, created if missing. Existing rows are never touched — an editor's
     * corrected URL must survive the next catalogue build.
     *
     * Returns how many rows were added.
     */
    public function ensure(): int
    {
        $known = DB::table('gw2_sources')->whereNotNull('subject')->pluck('subject')->flip();
        $rows = [];

        foreach ($this->subjects() as $subject => $slug) {
            if (isset($known[$subject])) {
                continue;
            }

            $title = ContentProgress::humanise($slug);

            $rows[] = [
                'subject' => $subject,
                'label' => 'GW2 Wiki — '.$title,
                'url' => Wiki::BASE.'/wiki/'.str_replace(' ', '_', $title),
                'kind' => 'wiki',
                'checked_at' => null,
                'notes' => 'Suggested from the API slug, not checked. Open it, and confirm only if it is the page for this '
                    .str_replace('_', ' ', strtok($subject, ':')).'.',
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        foreach (array_chunk($rows, 200) as $chunk) {
            DB::table('gw2_sources')->insert($chunk);
        }

        return count($rows);
    }

    /**
     * Every subject the catalogue gives us, keyed `kind:slug`.
     *
     * Raid checkpoints are left out: they are not kills, the interface does
     * not list them, and a page for "Escort" would be a page for the word.
     *
     * @return array<string, string>
     */
    private function subjects(): array
    {
        $subjects = [];

        foreach ($this->reference('raids') as $raid) {
            foreach ($raid['wings'] ?? [] as $wing) {
                if (isset($wing['id'])) {
                    $subjects['raid_wing:'.$wing['id']] = $wing['id'];
                }

                foreach ($wing['events'] ?? [] as $event) {
                    if (isset($event['id']) && ($event['type'] ?? 'Boss') === 'Boss') {
                        $subjects['raid_encounter:'.$event['id']] = $event['id'];
                    }
                }
            }
        }

        foreach ($this->reference('dungeons') as $dungeon) {
            if (isset($dungeon['id'])) {
                $subjects['dungeon:'.$dungeon['id']] = $dungeon['id'];
            }
        }

        foreach ($this->reference('worldbosses') as $boss) {
            if (isset($boss['id'])) {
                $subjects['world_boss:'.$boss['id']] = $boss['id'];
            }
        }

        return $subjects;
    }

    /** @return array<int, array<string, mixed>> */
    private function reference(string $kind): array
    {
        return DB::table('gw2_reference')
            ->where('kind', $kind)
            ->orderBy('ref_id')
            ->pluck('payload')
            ->map(fn ($p) => json_decode($p, true) ?: [])
            ->all();
    }
}
