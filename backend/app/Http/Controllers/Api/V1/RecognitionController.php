<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\UserRecognition;
use App\Notifications\RecognitionNotification;
use App\Traits\ApiResponse;
use App\Traits\ProfilePrivacy;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class RecognitionController extends Controller
{
    use ApiResponse, ProfilePrivacy;

    private const VALID_TYPES = ['helpful', 'insightful', 'friendly', 'leader'];

    private const DAILY_CAP = 10;

    /**
     * GET /users/{username}/recognitions — counts + whether auth user has given each type.
     */
    public function index(string $username): JsonResponse
    {
        $target = User::where('username', $username)->firstOrFail();

        if ($this->profileHidden($target)) {
            return $this->error('This profile is private.', 403);
        }

        $authId = Auth::id();

        $counts = UserRecognition::where('receiver_id', $target->id)
            ->selectRaw('type, count(*) as count')
            ->groupBy('type')
            ->pluck('count', 'type');

        $givenByMe = [];
        if ($authId) {
            $givenByMe = UserRecognition::where('giver_id', $authId)
                ->where('receiver_id', $target->id)
                ->pluck('type')
                ->flip()
                ->map(fn () => true)
                ->all();
        }

        $result = collect(self::VALID_TYPES)->map(fn ($type) => [
            'type' => $type,
            'label' => ucfirst($type),
            'count' => $counts[$type] ?? 0,
            'given_by_me' => (bool) ($givenByMe[$type] ?? false),
        ])->values()->all();

        return $this->success($result);
    }

    /**
     * POST /users/{username}/recognitions — award a recognition.
     */
    public function store(Request $request, string $username): JsonResponse
    {
        $request->validate(['type' => 'required|in:helpful,insightful,friendly,leader']);

        $type = $request->input('type');
        $giver = Auth::user();
        $target = User::where('username', $username)->firstOrFail();

        if ($giver->id === $target->id) {
            return $this->error('You cannot recognise yourself', 422);
        }

        // index() checks this; store() did not, so you could write a row
        // against — and fire a notification at — someone whose profile you are
        // not allowed to see.
        if ($this->profileHidden($target)) {
            return $this->error('This profile is private.', 403);
        }

        // Daily cap
        $todayCount = UserRecognition::where('giver_id', $giver->id)
            ->whereDate('created_at', today())
            ->count();

        if ($todayCount >= self::DAILY_CAP) {
            return $this->error("You've reached the daily limit of ".self::DAILY_CAP.' recognitions', 429);
        }

        // Upsert (unique constraint: giver+receiver+type)
        $alreadyGiven = UserRecognition::where('giver_id', $giver->id)
            ->where('receiver_id', $target->id)
            ->where('type', $type)
            ->exists();

        if ($alreadyGiven) {
            return $this->error('You already gave this recognition', 409);
        }

        DB::table('user_recognitions')->insert([
            'giver_id' => $giver->id,
            'receiver_id' => $target->id,
            'type' => $type,
            'created_at' => now(),
        ]);

        try {
            $target->notify(new RecognitionNotification($giver, $type));
        } catch (\Throwable) {
        }

        $newCount = UserRecognition::where('receiver_id', $target->id)->where('type', $type)->count();

        return $this->success(['type' => $type, 'count' => $newCount]);
    }

    /**
     * DELETE /users/{username}/recognitions/{type} — revoke a recognition.
     */
    public function destroy(string $username, string $type): JsonResponse
    {
        $target = User::where('username', $username)->firstOrFail();

        UserRecognition::where('giver_id', Auth::id())
            ->where('receiver_id', $target->id)
            ->where('type', $type)
            ->delete();

        $newCount = UserRecognition::where('receiver_id', $target->id)->where('type', $type)->count();

        return $this->success(['type' => $type, 'count' => $newCount]);
    }
}
