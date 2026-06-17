<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\BountyTransaction;
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
            ->limit(50)
            ->get(['id', 'amount', 'type', 'reason', 'balance_after', 'created_at']);

        return $this->success([
            'balance' => (int) ($user->bounty_balance ?? 0),
            'transactions' => $transactions,
        ]);
    }
}
