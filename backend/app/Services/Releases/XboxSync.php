<?php

namespace App\Services\Releases;

/**
 * Xbox: a sitemap of forty thousand identifiers, and a catalogue endpoint that
 * will describe two hundred of them at a time.
 *
 * Everything about asking once and remembering the answer lives in
 * BlindCatalogueSync, which PlayStation shares. All that is particular to Xbox
 * is where the identifiers come from and how many may be asked about at once.
 */
class XboxSync extends BlindCatalogueSync
{
    public const STORE = 'xbox';

    public function __construct(
        private XboxCatalog $catalog,
        QualityFilter $filter,
        TitleNormalizer $normalizer,
    ) {
        parent::__construct($filter, $normalizer);
    }

    public function store(): string
    {
        return self::STORE;
    }

    protected function allProductIds(): array
    {
        return $this->catalog->productIds();
    }

    protected function fetchDetails(array $ids, ?\Closure $progress = null): array
    {
        $batch = (int) config('releases.xbox.batch');
        $out = [];
        $done = 0;

        foreach (array_chunk($ids, $batch) as $i => $chunk) {
            foreach ($this->catalog->details($chunk) as $id => $row) {
                $out[$id] = $row;
            }

            $done += count($chunk);

            if ($progress && ($i % 10 === 9 || $done >= count($ids))) {
                $progress($done);
            }
        }

        return $out;
    }

    protected function productUrl(string $id): string
    {
        return 'https://www.xbox.com/en-US/games/store/_/'.$id;
    }

    protected function platformNames(array $row, array $details): array
    {
        return $details['platforms'] ?? ['Xbox'];
    }
}
