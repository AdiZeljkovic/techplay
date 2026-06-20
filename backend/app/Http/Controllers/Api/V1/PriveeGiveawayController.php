<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Giveaway;
use App\Models\PriveeGiveawayEntry;
use App\Services\PriveeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use RuntimeException;

class PriveeGiveawayController extends Controller
{
    /**
     * Authenticate with Privee email/password and enter giveaway.
     */
    public function login(Request $request, string $slug, PriveeService $priveeService): JsonResponse
    {
        $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string', 'min:6'],
        ]);

        $giveaway = $this->getActivePriveeGiveaway($slug);

        try {
            $priveeData = $priveeService->login(
                $request->input('email'),
                $request->input('password')
            );
        } catch (RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 401);
        }

        return $this->createEntry($request, $giveaway, $priveeData);
    }

    /**
     * Authenticate with Google token and enter giveaway.
     */
    public function googleLogin(Request $request, string $slug, PriveeService $priveeService): JsonResponse
    {
        $request->validate([
            'google_token' => ['required', 'string'],
        ]);

        $giveaway = $this->getActivePriveeGiveaway($slug);

        try {
            $priveeData = $priveeService->googleLogin(
                $request->input('google_token')
            );
        } catch (RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 401);
        }

        return $this->createEntry($request, $giveaway, $priveeData);
    }

    /**
     * Return the current user's Privee entry for this giveaway (from session).
     */
    public function myEntry(Request $request, string $slug): JsonResponse
    {
        $giveaway = Giveaway::where('slug', $slug)
            ->where('requires_privee_auth', true)
            ->firstOrFail();

        $entryId = session("privee_entry_{$giveaway->id}");

        if (! $entryId) {
            return response()->json(['entry' => null]);
        }

        $entry = PriveeGiveawayEntry::find($entryId);

        if (! $entry || $entry->giveaway_id !== $giveaway->id) {
            session()->forget("privee_entry_{$giveaway->id}");

            return response()->json(['entry' => null]);
        }

        return response()->json(['entry' => $this->formatEntry($entry)]);
    }

    // ─────────────────────────────────────────────────────────────
    // PRIVATE HELPERS
    // ─────────────────────────────────────────────────────────────

    private function getActivePriveeGiveaway(string $slug): Giveaway
    {
        $giveaway = Giveaway::where('slug', $slug)
            ->where('requires_privee_auth', true)
            ->firstOrFail();

        if (! $giveaway->isActive()) {
            abort(422, 'This giveaway is not currently active.');
        }

        return $giveaway;
    }

    private function createEntry(Request $request, Giveaway $giveaway, array $priveeData): JsonResponse
    {
        // Extract user info from Privee response (flexible — handles different response shapes)
        $user = $priveeData['user'] ?? [];
        $userId = $user['id'] ?? $user['userId'] ?? $user['sub'] ?? $priveeData['userId'] ?? null;
        $email = $user['email'] ?? $priveeData['email'] ?? null;
        $name = $user['name'] ?? $user['displayName'] ?? $user['username'] ?? null;

        // Fallback: use email as unique identifier if no explicit user ID
        if (! $userId) {
            $userId = $email ?? md5($priveeData['accessToken']);
        }

        $entry = PriveeGiveawayEntry::firstOrCreate(
            [
                'giveaway_id' => $giveaway->id,
                'privee_user_id' => $userId,
            ],
            [
                'privee_email' => $email,
                'privee_display_name' => $name,
                'access_token' => $priveeData['accessToken'],
                'refresh_token' => $priveeData['refreshToken'] ?? null,
                'ip_address' => $request->ip(),
                'user_agent' => substr($request->userAgent() ?? '', 0, 500),
            ]
        );

        // If user already had an entry, refresh their tokens
        if (! $entry->wasRecentlyCreated) {
            $entry->update([
                'access_token' => $priveeData['accessToken'],
                'refresh_token' => $priveeData['refreshToken'] ?? $entry->refresh_token,
            ]);
        }

        // Store entry ID in server-side session
        session(["privee_entry_{$giveaway->id}" => $entry->id]);

        return response()->json([
            'success' => true,
            'entry' => $this->formatEntry($entry),
        ]);
    }

    private function formatEntry(PriveeGiveawayEntry $entry): array
    {
        return [
            'id' => $entry->id,
            'privee_email' => $entry->privee_email,
            'privee_display_name' => $entry->privee_display_name,
            'entered_at' => $entry->created_at?->toIso8601String(),
        ];
    }
}
