<?php

namespace App\Services;

use App\Models\Customization;
use App\Models\RewardItem;
use App\Models\User;
use App\Models\UserCustomization;
use Illuminate\Support\Collection;

/**
 * One storefront over two registries.
 *
 * Bounty could historically be spent in two places — `reward_items` and
 * `customizations` — which meant the same bronze frame existed twice and
 * eight cosmetics were unreachable from the rewards tab. This service is the
 * single catalog: cosmetics come from `customizations` (the richer registry —
 * it carries the value, the asset and the equip state), everything else comes
 * from `reward_items`, and each entry names the endpoint that buys it.
 */
class RewardCatalogService
{
    /**
     * Reward items that are the same goods as a customization. The reward row
     * is suppressed in favour of the cosmetic; both endpoints keep working, so
     * nothing that already redeemed against these breaks.
     *
     * @var array<string,string> reward slug => customization slug
     */
    public const SHADOWED = [
        'bronze-profile-frame' => 'bronze-ring',
        'neon-profile-theme' => 'neon-cyan',
        'early-supporter-badge' => 'early-adopter',
        'animated-avatar' => 'animated-avatar',
        'featured-profile-spotlight' => 'profile-spotlight',
    ];

    /** Store types → the shelf they sit on. */
    private const CATEGORIES = [
        'frame' => 'Frames',
        'theme' => 'Themes',
        'badge' => 'Badges',
        'perk' => 'Perks',
        'discount' => 'Coupons',
        'physical' => 'Merch',
    ];

    /**
     * The catalog as this user sees it: what they own, what they can afford,
     * what is locked behind the supporter tier.
     */
    public function forUser(User $user): array
    {
        $owned = UserCustomization::where('user_id', $user->id)->get()->keyBy('customization_id');
        $balance = (int) ($user->bounty_balance ?? 0);
        $supporterTier = optional(optional($user->activeSupport()->with('tier')->first())->tier)->name;

        $cosmetics = Customization::where('is_active', true)
            ->orderBy('sort_order')->orderBy('cost')
            ->get()
            // Award-only badges (season and campaign grants) aren't for sale —
            // they appear only once they've been earned.
            ->filter(fn (Customization $c) => ! $c->isAwardOnly() || $owned->has($c->id))
            ->map(fn (Customization $c) => $this->fromCosmetic($c, $owned, $balance, $supporterTier));

        $goods = RewardItem::where('is_active', true)
            ->orderBy('sort_order')->orderBy('cost')
            ->get()
            ->reject(fn (RewardItem $r) => isset(self::SHADOWED[$r->slug]))
            ->map(fn (RewardItem $r) => $this->fromReward($r, $balance));

        $items = $cosmetics->concat($goods)->values();

        return [
            'items' => $items->all(),
            'categories' => $this->categories($items),
            'balance' => $balance,
            'supporter_tier' => $supporterTier,
        ];
    }

    private function fromCosmetic(Customization $c, Collection $owned, int $balance, ?string $supporterTier): array
    {
        $pivot = $owned->get($c->id);
        $isOwned = (bool) $pivot;
        $tierLocked = ! $isOwned && $c->required_tier && $c->required_tier !== $supporterTier;

        return [
            'key' => 'cosmetic:'.$c->id,
            'source' => 'cosmetic',
            'id' => $c->id,
            'slug' => $c->slug,
            'name' => $c->name,
            'description' => $c->description,
            'type' => $c->type,
            'category' => self::CATEGORIES[$c->type] ?? 'Other',
            'cost' => (int) $c->cost,
            'rarity' => $c->rarity ?? 'common',
            'image' => null,
            // The colour or gradient the cosmetic actually paints with — the
            // card art is drawn from this, so no upload is required.
            'value' => $c->value,
            'asset' => $c->asset,
            'owned' => $isOwned,
            'equipped' => $isOwned && $pivot->is_equipped,
            'tier_locked' => $tierLocked,
            'required_tier' => $c->required_tier,
            'stock' => null,
            'limited' => (bool) $c->required_tier,
            'affordable' => $isOwned || $tierLocked || $balance >= (int) $c->cost,
            'purchase' => ['path' => "/customizations/{$c->id}/acquire"],
        ];
    }

    private function fromReward(RewardItem $r, int $balance): array
    {
        $soldOut = $r->stock !== null && $r->stock <= 0;

        return [
            'key' => 'reward:'.$r->id,
            'source' => 'reward',
            'id' => $r->id,
            'slug' => $r->slug,
            'name' => $r->name,
            'description' => $r->description,
            'type' => $r->type,
            'category' => self::CATEGORIES[$r->type] ?? 'Other',
            'cost' => (int) $r->cost,
            'rarity' => $r->rarity ?? 'common',
            'image' => $r->image,
            'value' => null,
            'asset' => null,
            // Consumables can be redeemed again — they are never "owned".
            'owned' => false,
            'equipped' => false,
            'tier_locked' => false,
            'required_tier' => null,
            'stock' => $r->stock,
            'limited' => $r->stock !== null,
            'affordable' => ! $soldOut && $balance >= (int) $r->cost,
            'sold_out' => $soldOut,
            'purchase' => ['path' => "/rewards/{$r->slug}/redeem"],
        ];
    }

    /**
     * Filter chips with their counts. Only shelves that actually hold
     * something get a chip — an empty filter is worse than a missing one.
     */
    private function categories(Collection $items): array
    {
        $chips = collect(self::CATEGORIES)->values()->unique()
            ->map(fn (string $label) => [
                'id' => $label,
                'label' => $label,
                'count' => $items->where('category', $label)->count(),
            ])
            ->filter(fn (array $c) => $c['count'] > 0)
            ->values();

        $limited = $items->where('limited', true)->count();

        if ($limited > 0) {
            $chips->push(['id' => 'Limited', 'label' => 'Limited', 'count' => $limited]);
        }

        return $chips->all();
    }
}
