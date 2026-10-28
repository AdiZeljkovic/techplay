<?php

namespace App\Services\Gw2\Advisor;

use App\Models\Gw2Guide;

/**
 * Where a recommendation sends you: the button at the foot of its card.
 *
 * The mockup gives every card one — "View Gear Guide", "Fractal Progress
 * Guide" — and the honest version has one only where a page of ours answers
 * the card. A card about a ring the player can only replace in game gets no
 * button rather than one that leads somewhere vaguely related. The wiki is not
 * an action: every card already carries its own wiki link, and a button that
 * opens another site is a different promise from one that opens the next page
 * of this tool.
 *
 * A guide is linked only while it is published. An unpublished guide is a 404,
 * and a button that leads to one is worse than no button.
 */
final class CardAction
{
    /** @return array{href: string, label: string} */
    public static function page(string $href, string $label): array
    {
        return ['href' => $href, 'label' => $label];
    }

    /**
     * Looked up per call, not remembered: a static cache would outlive the
     * request under Octane, and a guide unpublished in the admin would keep
     * its button until the worker restarted.
     *
     * @return array{href: string, label: string}|null
     */
    public static function guide(string $family, string $slug, string $label): ?array
    {
        $guide = Gw2Guide::query()
            ->published()
            ->where('family', $family)
            ->where('slug', $slug)
            ->first(['family', 'slug']);

        return $guide ? self::page($guide->path(), $label) : null;
    }
}
