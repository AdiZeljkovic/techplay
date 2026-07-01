<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Customization;
use App\Models\UserCustomization;
use App\Services\BountyService;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;

class CustomizationController extends Controller
{
    use ApiResponse;

    /**
     * Auth: full catalog with the current user's owned/equipped status and
     * acquisition eligibility (bounty affordability / tier requirement).
     * GET /customizations
     */
    public function index(Request $request)
    {
        $user = $request->user();

        $owned = UserCustomization::where('user_id', $user->id)->get()->keyBy('customization_id');
        $tier = $user->relationLoaded('activeSupport')
            ? optional(optional($user->activeSupport)->tier)->name
            : optional(optional($user->activeSupport()->with('tier')->first())->tier)->name;
        $balance = (int) ($user->bounty_balance ?? 0);

        $items = Customization::where('is_active', true)
            ->orderBy('type')->orderBy('sort_order')->orderBy('cost')
            ->get()
            ->map(function (Customization $c) use ($owned, $tier, $balance) {
                $pivot = $owned->get($c->id);
                $isOwned = (bool) $pivot;
                $tierLocked = $c->required_tier && $c->required_tier !== $tier;

                return [
                    'id' => $c->id,
                    'name' => $c->name,
                    'slug' => $c->slug,
                    'type' => $c->type,
                    'description' => $c->description,
                    'cost' => $c->cost,
                    'required_tier' => $c->required_tier,
                    'value' => $c->value,
                    'asset' => $c->asset,
                    'owned' => $isOwned,
                    'equipped' => $isOwned && $pivot->is_equipped,
                    'tier_locked' => ! $isOwned && $tierLocked,
                    'affordable' => $isOwned || $tierLocked ? true : $balance >= $c->cost,
                ];
            });

        return $this->success([
            'items' => $items->values(),
            'tier' => $tier,
            'balance' => $balance,
        ]);
    }

    /**
     * Auth: acquire a customization (free, tier-unlock, or bounty purchase).
     * POST /customizations/{id}/acquire
     */
    public function acquire(Request $request, int $id, BountyService $bounty)
    {
        $user = $request->user();
        $item = Customization::where('is_active', true)->findOrFail($id);

        if (UserCustomization::where('user_id', $user->id)->where('customization_id', $item->id)->exists()) {
            return $this->error('You already own this item.', 422);
        }

        $tier = optional(optional($user->activeSupport()->with('tier')->first())->tier)->name;

        if ($item->required_tier) {
            if ($item->required_tier !== $tier) {
                return $this->error("Requires the {$item->required_tier} loyalty tier.", 403);
            }
            $via = 'tier';
        } elseif ($item->cost > 0) {
            try {
                $bounty->spend($user, $item->cost, "Unlocked: {$item->name}");
            } catch (\RuntimeException $e) {
                return $this->error($e->getMessage(), 422);
            }
            $via = 'bounty';
        } else {
            $via = 'free';
        }

        UserCustomization::create([
            'user_id' => $user->id,
            'customization_id' => $item->id,
            'is_equipped' => false,
            'acquired_via' => $via,
        ]);

        return $this->success(['balance' => (int) ($user->fresh()->bounty_balance ?? 0)], 'Unlocked!');
    }

    /**
     * Auth: equip an owned customization (unequips others of the same type).
     * POST /customizations/{id}/equip
     */
    public function equip(Request $request, int $id)
    {
        $user = $request->user();
        $item = Customization::findOrFail($id);

        $pivot = UserCustomization::where('user_id', $user->id)->where('customization_id', $item->id)->first();
        if (! $pivot) {
            return $this->error('You do not own this item.', 422);
        }

        if (! in_array($item->type, Customization::EQUIPPABLE)) {
            return $this->error('This item type cannot be equipped.', 422);
        }

        // Unequip other items of the same type.
        UserCustomization::where('user_id', $user->id)
            ->whereIn('customization_id', Customization::where('type', $item->type)->pluck('id'))
            ->update(['is_equipped' => false]);

        $pivot->update(['is_equipped' => true]);

        // post_color is denormalized onto users so PostResource/ThreadResource
        // can render it without joining customizations for every author.
        if ($item->type === 'post_color') {
            $user->update(['post_color' => $item->value]);
        }

        return $this->success(null, 'Equipped');
    }

    /**
     * Auth: unequip an owned customization.
     * POST /customizations/{id}/unequip
     */
    public function unequip(Request $request, int $id)
    {
        $user = $request->user();
        $item = Customization::find($id);

        UserCustomization::where('user_id', $user->id)
            ->where('customization_id', $id)
            ->update(['is_equipped' => false]);

        if ($item && $item->type === 'post_color') {
            $user->update(['post_color' => null]);
        }

        return $this->success(null, 'Unequipped');
    }
}
