<?php

namespace App\Services\Releases;

use App\Models\Game;
use Illuminate\Support\Carbon;

/**
 * Steam, whose listing is cheap and whose details are not.
 *
 * One listing request returns a hundred titles with name, date, tag ids and
 * art — enough to discover what is new and to notice a delay. The detail call
 * is the expensive one and a title costs it exactly once in its life.
 */
class SteamSync extends StoreSync
{
    public const STORE = 'steam';

    public function __construct(
        private SteamCatalog $catalog,
        QualityFilter $filter,
        TitleNormalizer $normalizer,
    ) {
        parent::__construct($filter, $normalizer);
    }

    public function store(): string
    {
        return self::STORE;
    }

    protected function discover(Carbon $from, Carbon $to): array
    {
        return $this->catalog->listWindow($from, $to);
    }

    protected function details(array $row): ?array
    {
        return $this->catalog->details($row['store_id']);
    }

    protected function platformNames(array $row, array $details): array
    {
        return ['PC'];
    }

    protected function createGame(array $row, array $details): Game
    {
        $game = parent::createGame($row, $details);

        // The listing's capsule is a poor substitute for the store header, but
        // it beats a card with no art at all.
        if (blank($game->cover_url) && filled($row['capsule'] ?? null)) {
            $game->forceFill(['cover_url' => $row['capsule']])->save();
        }

        return $game;
    }
}
