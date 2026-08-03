<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\BountyTransaction;
use App\Services\RewardTierService;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;

class BountyController extends Controller
{
    use ApiResponse;

    /**
     * The current user's bounty balance + recent transaction history.
     * GET /bounty
     */
    public function index(Request $request)
    {
        $user = $request->user();

        $transactions = BountyTransaction::where('user_id', $user->id)
            ->latest()
            ->limit((int) $request->integer('limit', 50) ?: 50)
            ->get(['id', 'amount', 'type', 'reason', 'balance_after', 'created_at']);

        $tiers = app(RewardTierService::class);
        $lifetime = $tiers->lifetime($user);

        return $this->success([
            'balance' => (int) ($user->bounty_balance ?? 0),
            'transactions' => $transactions,
            'earned_lifetime' => $lifetime['earned'],
            'spent_lifetime' => $lifetime['spent'],
            'tier' => $tiers->standing($lifetime['earned']),
            'ladder' => $tiers->ladder(),
        ]);
    }
}
