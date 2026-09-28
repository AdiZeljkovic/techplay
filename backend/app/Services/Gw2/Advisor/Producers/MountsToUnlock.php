<?php

namespace App\Services\Gw2\Advisor\Producers;

use App\Models\Gw2Guide;
use App\Models\Gw2Rule;
use App\Services\Gw2\Advisor\Intent;
use App\Services\Gw2\Advisor\Producer;
use App\Services\Gw2\Advisor\Signal;
use App\Services\Gw2\Advisor\Snapshot;
use Illuminate\Support\Facades\DB;

/**
 * Mounts the account has not unlocked.
 *
 * §9.5 draws the line exactly where this producer draws it:
 *
 * > *"Mount type unlocks are directly observable through the account API. The
 * > acquisition path, however, is content logic and must be maintained as
 * > TechPlay curated data."*
 *
 * So this half is mechanical — ten mount types in the catalogue, four unlocked
 * on the test account, six missing — and the half that says *how* is a written
 * guide in the `mounts` family. A producer that invented acquisition steps
 * would be inventing game knowledge; one that names the gap and points at a
 * page somebody wrote is doing its job.
 *
 * A mount with no guide yet is still recommended. Knowing a mount exists and is
 * missing is worth something on its own, and suppressing it until the desk has
 * written the page would hide a true fact behind an editorial backlog.
 */
class MountsToUnlock implements Producer
{
    public const KEY = 'mounts.not_unlocked';

    /** Two at a time. Six missing mounts would be six cards saying one thing. */
    private const MOST = 2;

    public function produce(Gw2Rule $rule, Snapshot $snapshot, Intent $intent): array
    {
        $unlocked = array_flip($this->unlocked($snapshot));

        $guides = Gw2Guide::query()
            ->published()
            ->where('family', 'mounts')
            ->pluck('slug', 'slug')
            ->all();

        $signals = [];

        foreach ($this->catalogue() as $slug => $name) {
            if (isset($unlocked[$slug]) || count($signals) >= self::MOST) {
                continue;
            }

            $signals[] = new Signal(
                rule: $rule,
                subject: "mount:{$slug}",
                facts: [
                    'mount' => $name,
                    'unlocked' => count($unlocked),
                    'total' => count($this->catalogue()),
                ],
                blockers: $this->blockers($slug, $guides),
                pushes: ['mounts'],
                details: array_filter(['icon' => $this->icons()[$slug] ?? null]),
            );
        }

        return $signals;
    }

    /**
     * @param  array<string, string>  $guides
     * @return array<int, string>
     */
    private function blockers(string $slug, array $guides): array
    {
        /*
         * The honest blocker when nobody has written the page yet. §9.5 is
         * clear that the route is curated content, so saying "we have not
         * written this up" is more useful than either silence or a guess.
         */
        return isset($guides[$slug])
            ? []
            : ['We have not written up how to get this one yet.'];
    }

    /**
     * Mount types the account has, as bare slugs.
     *
     * @return array<int, string>
     */
    private function unlocked(Snapshot $snapshot): array
    {
        $state = DB::table('gw2_account_state')
            ->where('gw2_account_id', $snapshot->accountId)
            ->value('unlocks');

        $decoded = is_string($state) ? json_decode($state, true) : $state;

        return array_values(array_filter((array) ($decoded['mounts'] ?? [])));
    }

    /**
     * A picture per mount, slug to icon.
     *
     * `mounts/types` carries no icon — it names a `default_skin`, and the skin
     * is what has the picture. Two lookups rather than one, and the reason the
     * skins endpoint is mirrored at all.
     *
     * @return array<string, string>
     */
    private function icons(): array
    {
        static $icons = null;

        if ($icons !== null) {
            return $icons;
        }

        $skins = DB::table('gw2_reference')
            ->where('kind', 'mounts_skins')
            ->pluck('payload')
            ->mapWithKeys(function ($payload) {
                $row = json_decode($payload, true) ?: [];

                return [(int) ($row['id'] ?? 0) => (string) ($row['icon'] ?? '')];
            })
            ->all();

        $icons = DB::table('gw2_reference')
            ->where('kind', 'mounts_types')
            ->pluck('payload')
            ->mapWithKeys(function ($payload) use ($skins) {
                $row = json_decode($payload, true) ?: [];

                return [(string) ($row['id'] ?? '') => $skins[(int) ($row['default_skin'] ?? 0)] ?? ''];
            })
            ->filter()
            ->all();

        return $icons;
    }

    /**
     * Every mount type, slug to display name.
     *
     * From the catalogue rather than a list here, so a mount added in an
     * expansion appears the night the catalogue refreshes.
     *
     * @return array<string, string>
     */
    private function catalogue(): array
    {
        static $mounts = null;

        if ($mounts !== null) {
            return $mounts;
        }

        $mounts = DB::table('gw2_reference')
            ->where('kind', 'mounts_types')
            ->pluck('payload')
            ->mapWithKeys(function ($payload) {
                $row = json_decode($payload, true) ?: [];

                return [(string) ($row['id'] ?? '') => (string) ($row['name'] ?? $row['id'] ?? '')];
            })
            ->filter(fn ($name, $slug) => $slug !== '')
            ->all();

        return $mounts;
    }
}
