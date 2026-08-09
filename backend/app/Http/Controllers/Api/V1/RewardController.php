<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Customization;
use App\Models\RewardItem;
use App\Models\RewardRedemption;
use App\Models\User;
use App\Models\UserCustomization;
use App\Services\BountyService;
use App\Services\RewardCatalogService;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class RewardController extends Controller
{
    use ApiResponse;

    /**
     * Public: active rewards store catalog.
     * GET /rewards
     */
    public function index()
    {
        $items = RewardItem::where('is_active', true)
            ->orderBy('sort_order')
            ->orderBy('cost')
            ->get(['id', 'name', 'slug', 'description', 'cost', 'type', 'image', 'stock']);

        return $this->success($items);
    }

    /**
     * Auth: the whole store as this user sees it — cosmetics and goods in one
     * catalog, with owned/affordable/locked state already resolved.
     * GET /rewards/catalog
     */
    public function catalog(Request $request, RewardCatalogService $catalog)
    {
        return $this->success($catalog->forUser($request->user()));
    }

    /**
     * Auth: redeem a reward with bounty.
     * POST /rewards/{slug}/redeem
     */
    public function redeem(Request $request, string $slug, BountyService $bounty)
    {
        $item = RewardItem::where('slug', $slug)->where('is_active', true)->first();

        if (! $item) {
            return $this->notFound('Reward not found.');
        }

        $user = $request->user();

        if ($item->stock !== null && $item->stock <= 0) {
            return $this->error('This reward is out of stock.', 422);
        }

        if ((int) ($user->bounty_balance ?? 0) < $item->cost) {
            return $this->error('Not enough bounty to redeem this reward.', 422);
        }

        // Re-redeeming a cosmetic used to charge full price while
        // grantCosmetic's firstOrCreate quietly did nothing.
        if ($this->alreadyOwnsCosmetic($user, $item)) {
            return $this->error('You already own this reward.', 422);
        }

        try {
            // Stock was read, then spent, then decremented, in three separate
            // transactions with the item row never locked — so concurrent
            // redemptions of a one-off physical item all succeeded and drove
            // `stock` negative. The whole exchange is one transaction now, and
            // the stock claim is the guard rather than the earlier read.
            $result = DB::transaction(function () use ($user, $item, $bounty) {
                if ($item->stock !== null) {
                    $claimed = RewardItem::whereKey($item->id)
                        ->where('stock', '>', 0)
                        ->decrement('stock');

                    if ($claimed === 0) {
                        throw new \RuntimeException('This reward is out of stock.');
                    }
                }

                $balance = $bounty->spend($user, $item->cost, "Redeemed: {$item->name}");

                $redemption = RewardRedemption::create([
                    'user_id' => $user->id,
                    'reward_item_id' => $item->id,
                    'cost' => $item->cost,
                    'status' => 'fulfilled',
                ]);

                $this->grantCosmetic($user, $item);

                return [$balance, $redemption];
            });
        } catch (\RuntimeException $e) {
            return $this->error($e->getMessage(), 422);
        }

        [$balance, $redemption] = $result;

        return $this->success([
            'balance' => $balance,
            'redemption' => $redemption->only(['id', 'reward_item_id', 'cost', 'status', 'created_at']),
        ], 'Reward redeemed!');
    }

    /**
     * Auth: the current user's redemption history.
     * GET /rewards/redemptions
     */
    public function redemptions(Request $request)
    {
        $items = RewardRedemption::where('user_id', $request->user()->id)
            ->with('rewardItem:id,name,type,image')
            ->latest()
            ->limit(50)
            ->get(['id', 'reward_item_id', 'cost', 'status', 'created_at']);

        return $this->success($items);
    }

    /** Does the user already hold the cosmetic this reward maps to? */
    private function alreadyOwnsCosmetic(User $user, RewardItem $item): bool
    {
        if (! in_array($item->type, ['badge', 'frame', 'theme', 'perk'], true)) {
            return false;
        }

        $slug = RewardCatalogService::SHADOWED[$item->slug] ?? $item->slug;
        $customizationId = Customization::where('slug', $slug)->value('id');

        if (! $customizationId) {
            return false;
        }

        return UserCustomization::where('user_id', $user->id)
            ->where('customization_id', $customizationId)
            ->exists();
    }

    /**
     * Map a RewardItem to its Customization counterpart and grant it to the user.
     * Cosmetic types (badge, frame, theme, perk) auto-unlock the matching Customization.
     */
    private function grantCosmetic(User $user, RewardItem $item): void
    {
        $cosmeticTypes = ['badge', 'frame', 'theme', 'perk'];

        if (! in_array($item->type, $cosmeticTypes, true)) {
            return;
        }

        $customizationSlug = RewardCatalogService::SHADOWED[$item->slug] ?? $item->slug;

        $customization = Customization::where('slug', $customizationSlug)->where('is_active', true)->first();

        if (! $customization) {
            Log::debug("No matching customization for reward slug [{$item->slug}]");

            return;
        }

        UserCustomization::firstOrCreate(
            ['user_id' => $user->id, 'customization_id' => $customization->id],
            ['is_equipped' => false, 'acquired_via' => 'bounty_store']
        );
    }
}
