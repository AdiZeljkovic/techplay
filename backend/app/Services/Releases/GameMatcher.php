<?php

namespace App\Services\Releases;

use App\Models\GameMatchDecision;
use Illuminate\Support\Carbon;

/**
 * Decides whether two store listings are the same game.
 *
 * This only ever runs on first contact. Once a title is linked to a store id
 * the sync looks it up exactly and never asks again, so everything here is
 * about the one moment a new listing appears and we have to place it.
 *
 * The bias throughout is toward asking rather than guessing. A missed match
 * surfaces in the review queue and an editor fixes it in seconds; a wrong
 * automatic merge silently fuses two different games and nobody notices until
 * the calendar is wrong.
 */
class GameMatcher
{
    public const MERGE = 'merge';

    public const REVIEW = 'review';

    public const SEPARATE = 'separate';

    public function __construct(private TitleNormalizer $normalizer) {}

    /**
     * @param  array{title:string,released:?string,publisher:?string}  $left
     * @param  array{title:string,released:?string,publisher:?string}  $right
     */
    public function verdict(array $left, array $right): string
    {
        $config = config('releases.matching');

        $leftKey = $this->normalizer->key($left['title']);
        $rightKey = $this->normalizer->key($right['title']);

        if ($leftKey === '' || $rightKey === '') {
            return self::SEPARATE;
        }

        // An editor has already ruled on this pair. Their answer outranks
        // every rule below it, and re-deciding would quietly undo their work.
        if (($remembered = $this->remembered($leftKey, $rightKey)) !== null) {
            return $remembered ? self::MERGE : self::SEPARATE;
        }

        $gap = $this->dayGap($left['released'] ?? null, $right['released'] ?? null);
        $exact = $leftKey === $rightKey;

        // A shared title this far apart is a port or a remaster. Those are
        // separate entries on purpose — "Lies of P" in 2023 and its Switch
        // release in 2026 are two things a calendar has to be able to show.
        if ($gap !== null && $gap > $config['never_merge_days']) {
            return self::SEPARATE;
        }

        // Without dates on both sides no rule below can be trusted, so an
        // identical title is worth asking about and nothing more.
        if ($gap === null) {
            return $exact ? self::REVIEW : self::SEPARATE;
        }

        if ($exact && $gap <= $config['auto_days']) {
            return self::MERGE;
        }

        if ($exact && $gap <= $config['publisher_days'] && $this->samePublisher($left, $right)) {
            return self::MERGE;
        }

        if ($exact) {
            return self::REVIEW;
        }

        if ($gap <= $config['review_days'] && $this->similarity($leftKey, $rightKey) >= $config['review_similarity']) {
            return self::REVIEW;
        }

        return self::SEPARATE;
    }

    /** 0..1, where 1 is identical. */
    public function similarity(string $a, string $b): float
    {
        if ($a === $b) {
            return 1.0;
        }

        if ($a === '' || $b === '') {
            return 0.0;
        }

        similar_text($a, $b, $percent);

        return round($percent / 100, 4);
    }

    /** Whether an editor has already answered this pair. */
    private function remembered(string $leftKey, string $rightKey): ?bool
    {
        [$a, $b] = $this->orderedPair($leftKey, $rightKey);

        return GameMatchDecision::where('left_key', $a)
            ->where('right_key', $b)
            ->value('same_game');
    }

    /**
     * Decisions are stored on a sorted pair so that asking about (a, b) finds
     * an answer given about (b, a).
     *
     * @return array{0:string,1:string}
     */
    public function orderedPair(string $a, string $b): array
    {
        return strcmp($a, $b) <= 0 ? [$a, $b] : [$b, $a];
    }

    private function dayGap(?string $left, ?string $right): ?int
    {
        if (! $left || ! $right) {
            return null;
        }

        return (int) round(abs(Carbon::parse($left)->diffInDays(Carbon::parse($right))));
    }

    private function samePublisher(array $left, array $right): bool
    {
        $a = $this->normalizer->key((string) ($left['publisher'] ?? ''));
        $b = $this->normalizer->key((string) ($right['publisher'] ?? ''));

        return $a !== '' && $a === $b;
    }
}
