<?php

namespace App\Services\Releases;

use Illuminate\Support\Carbon;

/**
 * Nintendo, whose listing is the whole story.
 *
 * One request returns the entire window already complete, so there is no detail
 * call to make, nothing to pace, and no way for a title to be lost to
 * throttling. The machinery in StoreSync still applies — the quality gate,
 * remembered rejections, delays noticed on a later run, an editor's locked
 * fields — it simply never has to spend anything to apply it.
 */
class NintendoSync extends StoreSync
{
    public const STORE = 'nintendo';

    /** Titles the catalogue handed us, keyed by store id. */
    private array $loaded = [];

    public function __construct(
        private NintendoCatalog $catalog,
        QualityFilter $filter,
        TitleNormalizer $normalizer,
    ) {
        parent::__construct($filter, $normalizer);
    }

    public function store(): string
    {
        return self::STORE;
    }

    /** Nothing here costs a request per title, so nothing needs pacing. */
    protected function delayMs(): int
    {
        return 0;
    }

    protected function discover(Carbon $from, Carbon $to): array
    {
        $rows = $this->catalog->listWindow($from, $to);

        $this->loaded = collect($rows)->keyBy('store_id')->all();

        return $rows;
    }

    protected function details(array $row): ?array
    {
        return $this->loaded[$row['store_id']] ?? $row;
    }

    protected function platformNames(array $row, array $details): array
    {
        return $details['platforms'] ?: ['Nintendo Switch'];
    }
}
