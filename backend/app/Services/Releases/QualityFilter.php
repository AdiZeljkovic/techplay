<?php

namespace App\Services\Releases;

/**
 * Decides whether a store listing belongs on the calendar.
 *
 * Steam alone ships around 1,800 titles a month and a large share of it is
 * asset flips, demos and adult content. A calendar that showed all of it would
 * be useless, so this is the gate everything passes through.
 *
 * It works on a normalised shape rather than any one store's payload, so the
 * same rules apply to Steam, PlayStation, Xbox and Nintendo and the reasons for
 * a rejection read the same everywhere.
 *
 * Measured against 40 upcoming Steam titles this rejects half: 12 on the
 * description threshold, 6 demos, 2 DLC.
 */
class QualityFilter
{
    /**
     * A candidate is an array with the keys this returns a verdict on:
     * type, title, description, screenshots (int), has_trailer (bool),
     * publisher, adult (bool).
     *
     * @return string|null the reason it was rejected, or null when it passes
     */
    public function reject(array $candidate, string $store = 'default'): ?string
    {
        $config = config('releases');

        if ($candidate['adult'] ?? false) {
            return 'adult content';
        }

        $type = $candidate['type'] ?? 'game';
        if (! in_array($type, $config['allowed_types'], true)) {
            return "not a game ({$type})";
        }

        $quality = $this->rulesFor($store);

        if (mb_strlen((string) ($candidate['description'] ?? '')) < $quality['min_description']) {
            return 'description too short';
        }

        $screenshots = (int) ($candidate['screenshots'] ?? 0);

        if ($screenshots < $quality['min_screenshots']) {
            return 'too few screenshots';
        }

        // A trailer is the clearest sign someone actually finished the thing.
        // Without one we ask for more screenshots instead of refusing outright,
        // because plenty of good small games never cut a trailer.
        if (! ($candidate['has_trailer'] ?? false) && $screenshots < $quality['screenshots_without_trailer']) {
            return 'no trailer and too few screenshots';
        }

        if ($quality['require_publisher'] && blank($candidate['publisher'] ?? null)) {
            return 'no publisher';
        }

        return null;
    }

    public function passes(array $candidate, string $store = 'default'): bool
    {
        return $this->reject($candidate, $store) === null;
    }

    /**
     * The thresholds a given store is judged by.
     *
     * They cannot be the same everywhere. These rules were written against
     * Steam, where anyone may publish and much of the upcoming catalogue is
     * asset flips. The eShop is curated and its search API carries no
     * screenshots at all, so applying Steam's numbers there would not filter
     * Nintendo's catalogue — it would erase it.
     *
     * @return array<string,mixed>
     */
    private function rulesFor(string $store): array
    {
        $quality = config('releases.quality');

        return array_merge($quality['default'], $quality[$store] ?? []);
    }

    /**
     * The cheap half of the gate: Steam publishes tag ids in its search
     * listing, so a flagged title is dropped before we ever ask about it.
     *
     * @param  array<int,int>  $tagIds
     */
    public function isAdultBySteamTags(array $tagIds): bool
    {
        return (bool) array_intersect($tagIds, config('releases.adult.steam_tag_ids'));
    }

    /**
     * The thorough half: content descriptors arrive with the detail payload and
     * catch what the community never tagged.
     *
     * @param  array<int,int>  $descriptorIds
     */
    public function isAdultBySteamDescriptors(array $descriptorIds): bool
    {
        return (bool) array_intersect($descriptorIds, config('releases.adult.steam_descriptor_ids'));
    }
}
