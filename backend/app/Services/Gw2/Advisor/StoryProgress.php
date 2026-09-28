<?php

namespace App\Services\Gw2\Advisor;

use Illuminate\Support\Facades\DB;

/**
 * Detected story progress — and the word "detected" is load-bearing.
 *
 * §16 is the most cautious section in the working document, and every caution
 * in it is earned:
 *
 * > *"Display 'detected story progress' rather than 'account story
 * > completion'. Allow one-click manual correction. Quest data is
 * > character-level and the quest endpoint is manually whitelisted / can lag
 * > associated story endpoints. Treat story tracking as medium-confidence."*
 *
 * Three separate reasons this can under-report, and none of them is a bug:
 *
 * **It is per character.** A player with six characters has done the personal
 * story six times and each expansion once, on whichever one they felt like.
 * There is no account view.
 *
 * **The quest endpoint lags.** The wiki documents it as manually whitelisted,
 * so a chapter can be finished in game and absent here.
 *
 * **Races and orders branch.** The early personal story differs by race and by
 * the order a character joined, so a chapter another character had is not one
 * this character skipped.
 *
 * So this reports what it can see, says so in those words, and leaves the
 * correction to the player through `gw2_confirmations`. It never says
 * "incomplete".
 */
class StoryProgress
{
    /**
     * @return array<string, mixed>|null
     */
    public function for(Snapshot $snapshot, ?string $characterName = null): ?array
    {
        $character = $characterName
            ? $this->named($snapshot, $characterName)
            : $snapshot->primaryCharacter();

        if (! $character) {
            return null;
        }

        $done = array_flip($this->questsOf($snapshot->accountId, $character->name));

        if ($done === []) {
            /*
             * No quests read at all. That is "we do not know", not "you have
             * done nothing" — the key may lack the scope, or the endpoint may
             * not have answered for this character. §17.3 wants unknown
             * rendered as unknown.
             */
            return [
                'character' => $character->name,
                'known' => false,
                'seasons' => [],
                'note' => 'We could not read this character\'s story. That is not the same as it being empty.',
            ];
        }

        $stories = $this->reference('stories');
        $byId = [];

        foreach ($stories as $story) {
            if (isset($story['id'])) {
                $byId[(int) $story['id']] = $story;
            }
        }

        // Quests carry the story they belong to; stories carry the season.
        $doneByStory = [];

        foreach ($this->reference('quests') as $quest) {
            if (isset($quest['id'], $quest['story']) && isset($done[(int) $quest['id']])) {
                $doneByStory[(int) $quest['story']] = ($doneByStory[(int) $quest['story']] ?? 0) + 1;
            }
        }

        $totalByStory = [];

        foreach ($this->reference('quests') as $quest) {
            if (isset($quest['story'])) {
                $totalByStory[(int) $quest['story']] = ($totalByStory[(int) $quest['story']] ?? 0) + 1;
            }
        }

        $seasons = [];

        foreach ($this->reference('stories_seasons') as $season) {
            $rows = [];

            foreach ($season['stories'] ?? [] as $storyId) {
                $story = $byId[(int) $storyId] ?? null;

                if (! $story) {
                    continue;
                }

                $total = $totalByStory[(int) $storyId] ?? 0;
                $doneCount = $doneByStory[(int) $storyId] ?? 0;

                $rows[] = [
                    'id' => (int) $storyId,
                    'name' => $story['name'] ?? '',
                    'timeline' => $story['timeline'] ?? null,
                    'level' => $story['level'] ?? null,
                    // Races, where the story is race-specific. Shown so nobody
                    // reads a charr-only chapter as something they skipped.
                    'races' => $story['races'] ?? [],
                    'steps_seen' => $doneCount,
                    'steps_total' => $total,
                ];
            }

            if ($rows === []) {
                continue;
            }

            $seasons[] = [
                'name' => $season['name'] ?? '',
                'order' => $season['order'] ?? 0,
                'stories' => $rows,
                'steps_seen' => array_sum(array_column($rows, 'steps_seen')),
                'steps_total' => array_sum(array_column($rows, 'steps_total')),
            ];
        }

        usort($seasons, fn ($a, $b) => $a['order'] <=> $b['order']);

        return [
            'character' => $character->name,
            'race' => $character->race,
            'known' => true,
            'steps_seen' => count($done),
            'seasons' => $seasons,
            /*
             * The sentence that keeps this honest, and it is not boilerplate:
             * all three reasons below are real and documented.
             */
            'note' => 'Story is recorded per character, the game\'s quest data can lag behind what you '
                .'have played, and the early personal story branches by race and order. So this is what we '
                .'can detect on '.$character->name.' — not a claim about your account.',
        ];
    }

    private function named(Snapshot $snapshot, string $name): ?CharacterView
    {
        foreach ($snapshot->characters as $character) {
            if ($character->name === $name) {
                return $character;
            }
        }

        return null;
    }

    /** @return array<int, int> */
    private function questsOf(int $accountId, string $name): array
    {
        $raw = DB::table('gw2_characters')
            ->where('gw2_account_id', $accountId)
            ->where('name', $name)
            ->value('quests');

        $decoded = is_string($raw) ? json_decode($raw, true) : $raw;

        return is_array($decoded) ? array_map('intval', $decoded) : [];
    }

    /** @return array<int, array<string, mixed>> */
    private function reference(string $kind): array
    {
        return DB::table('gw2_reference')
            ->where('kind', $kind)
            ->pluck('payload')
            ->map(fn ($p) => json_decode($p, true) ?: [])
            ->all();
    }
}
