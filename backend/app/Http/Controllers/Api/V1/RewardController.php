<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\RewardItem;
use App\Models\RewardRedemption;
use App\Services\BountyService;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;

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
     * Auth: redeem a reward with bounty.
     * POST /rewards/{slug}/redeem
     */
    public function redeem(Request $request, string $slug, BountyService $bounty)
    {
        $item = RewardItem::where('slug', $slug)->where('is_active', true)->first();

        if (! $item) {
            return $this->notFound('Reward not found.');
        }

        if ($item->stock !== null && $item->stock <= 0) {
            return $this->error('This reward is out of stock.', 422);
        }

        $user = $request->user();

        if ((int) ($user->bounty_balance ?? 0) < $item->cost) {
            return $this->error('Not enough bounty to redeem this reward.', 422);
        }

        try {
            $balance = $bounty->spend($user, $item->cost, "Redeemed: {$item->name}");
        } catch (\RuntimeException $e) {
            return $this->error($e->getMessage(), 422);
        }

        $redemption = RewardRedemption::create([
            'user_id' => $user->id,
            'reward_item_id' => $item->id,
            'cost' => $item->cost,
            'status' => 'fulfilled',
        ]);

        if ($item->stock !== null) {
            $item->decrement('stock');
        }

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
}
