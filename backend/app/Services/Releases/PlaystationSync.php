<?php

namespace App\Services\Releases;

/**
 * PlayStation: a coming-soon collection of several hundred products, each of
 * which has to be opened to learn its date.
 *
 * The same shape as Xbox — ask once, keep the answer — but one request per
 * product rather than two hundred at a time, so it paces itself.
 */
class PlaystationSync extends BlindCatalogueSync
{
    public const STORE = 'playstation';

    public function __construct(
        private PlaystationCatalog $catalog,
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
        $out = [];
        $delay = (int) config('releases.delay_ms');

        foreach (array_values($ids) as $i => $id) {
            $row = $this->catalog->details($id);

            if ($row !== null) {
                $out[$id] = $row;
            }

            // A page each, from someone else's storefront.
            if ($delay > 0 && $i < count($ids) - 1) {
                usleep($delay * 1000);
            }

            if ($progress && ($i % 25 === 24 || $i === count($ids) - 1)) {
                $progress($i + 1);
            }
        }

        return $out;
    }

    protected function productUrl(string $id): string
    {
        return 'https://store.playstation.com/en-us/product/'.$id;
    }

    protected function platformNames(array $row, array $details): array
    {
        return $details['platforms'] ?? ['PlayStation'];
    }
}
