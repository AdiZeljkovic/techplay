<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\TrophyCaseSlot;
use App\Models\User;
use App\Services\TrophyCaseService;
use App\Traits\ApiResponse;
use App\Traits\ProfilePrivacy;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TrophyCaseController extends Controller
{
    use ApiResponse, ProfilePrivacy;

    public function __construct(private readonly TrophyCaseService $case) {}

    /**
     * GET /users/{username}/trophy-case — what is on the shelf.
     */
    public function show(string $username): JsonResponse
    {
        $user = User::where('username', $username)->firstOrFail();

        if ($this->profileHidden($user)) {
            return $this->error('This profile is private.', 403);
        }

        return $this->success([
            'capacity' => TrophyCaseSlot::CAPACITY,
            'items' => $this->case->forUser($user),
        ]);
    }

    /**
     * GET /me/trophy-case/available — everything the owner could shelve.
     *
     * Owner-only, and not because it is secret: a picker for somebody else's
     * shelf is not a thing.
     */
    public function available(Request $request): JsonResponse
    {
        return $this->success(['items' => $this->case->available($request->user())]);
    }

    /**
     * PUT /me/trophy-case — the finished arrangement, in order.
     */
    public function update(Request $request): JsonResponse
    {
        $data = $request->validate([
            'picks' => 'present|array|max:'.TrophyCaseSlot::CAPACITY,
            'picks.*.source' => 'required|in:'.implode(',', TrophyCaseSlot::SOURCES),
            'picks.*.reference' => 'required|integer|min:1',
        ]);

        return $this->success(
            ['items' => $this->case->replace($request->user(), $data['picks'])],
            'Trophy case updated.'
        );
    }
}
