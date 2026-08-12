<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\LastDiscSignature;
use App\Models\LastDiscVote;
use App\Services\SanitizationService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

/**
 * The Last Disc campaign: an open letter to Sony about physical PlayStation
 * games, and a poll beside it.
 *
 * Every figure the page prints is counted here. A campaign page that inflates
 * its own signature count is worth less than one that admits it has eleven —
 * the number is the argument, so it has to be the real one.
 */
class LastDiscController extends Controller
{
    use ApiResponse;

    /** The poll, and the only answers it accepts. */
    private const CHOICES = ['keep', 'digital_only', 'unsure'];

    /**
     * GET /last-disc — the counts the page opens with.
     */
    public function index(Request $request): JsonResponse
    {
        $stats = Cache::remember('last-disc.stats.v1', 60, function () {
            $signatures = LastDiscSignature::count();

            return [
                'signatures' => $signatures,
                'anonymous' => LastDiscSignature::where('display', 'anonymous')->count(),
                'countries' => LastDiscSignature::whereNotNull('country')->distinct('country')->count('country'),
                'recent' => LastDiscSignature::query()
                    ->where('display', 'name')
                    ->whereNotNull('name')
                    ->latest('id')
                    ->limit(12)
                    ->get(['name', 'country', 'created_at'])
                    ->map(fn (LastDiscSignature $s) => [
                        'name' => $s->name,
                        'country' => $s->country,
                        'signed_at' => $s->created_at?->toIso8601String(),
                    ])
                    ->all(),
            ];
        });

        return $this->success([
            'stats' => $stats,
            'poll' => $this->poll(),
            'signed' => $this->alreadySigned($request),
            'voted' => $this->alreadyVoted($request),
        ]);
    }

    /**
     * POST /last-disc/sign
     */
    public function sign(Request $request, SanitizationService $sanitizer): JsonResponse
    {
        $data = $request->validate([
            'email' => 'required|email|max:255',
            'name' => 'nullable|string|max:80',
            'country' => 'nullable|string|size:2',
            'display' => 'required|in:name,anonymous',
            'message' => 'nullable|string|max:1000',
            'wants_updates' => 'nullable|boolean',
            'consent' => 'accepted',
        ]);

        $email = mb_strtolower(trim($data['email']));

        if (LastDiscSignature::where('email', $email)->exists()) {
            return $this->error('This address has already signed. Thank you — once is enough.', 409);
        }

        LastDiscSignature::create([
            'user_id' => Auth::guard('sanctum')->id() ?? Auth::id(),
            'email' => $email,
            // A name that will never be shown is a name we have no reason to keep.
            'name' => $data['display'] === 'name' && filled($data['name'] ?? null)
                ? $sanitizer->sanitizePlainText($data['name'])
                : null,
            'country' => filled($data['country'] ?? null) ? mb_strtoupper($data['country']) : null,
            'display' => $data['display'],
            'message' => filled($data['message'] ?? null) ? $sanitizer->sanitizePlainText($data['message']) : null,
            'wants_updates' => (bool) ($data['wants_updates'] ?? false),
        ]);

        Cache::forget('last-disc.stats.v1');

        return $this->success(['signatures' => LastDiscSignature::count()], 'Your name is on the letter.');
    }

    /**
     * POST /last-disc/vote
     */
    public function vote(Request $request): JsonResponse
    {
        $data = $request->validate([
            'choice' => 'required|in:'.implode(',', self::CHOICES),
        ]);

        $hash = $this->voterHash($request);

        if (LastDiscVote::where('voter_hash', $hash)->exists()) {
            return $this->error('You have already voted.', 409);
        }

        LastDiscVote::create([
            'user_id' => Auth::guard('sanctum')->id() ?? Auth::id(),
            'choice' => $data['choice'],
            'voter_hash' => $hash,
        ]);

        Cache::forget('last-disc.poll.v1');

        return $this->success(['poll' => $this->poll()], 'Vote counted.');
    }

    /* ── the numbers ──────────────────────────────────────────────────── */

    /**
     * Tallies with their shares. Percentages are computed here rather than in
     * the page so the three of them always add to a hundred.
     */
    private function poll(): array
    {
        return Cache::remember('last-disc.poll.v1', 60, function () {
            $tally = LastDiscVote::query()
                ->selectRaw('choice, COUNT(*) as votes')
                ->groupBy('choice')
                ->pluck('votes', 'choice');

            $total = (int) $tally->sum();

            return [
                'total' => $total,
                'options' => collect(self::CHOICES)->map(fn (string $choice) => [
                    'choice' => $choice,
                    'votes' => (int) ($tally[$choice] ?? 0),
                    'percent' => $total > 0 ? (int) round(($tally[$choice] ?? 0) / $total * 100) : 0,
                ])->all(),
            ];
        });
    }

    /**
     * Signed-in readers are recognised by account; everyone else by the same
     * hash the vote uses. Neither is proof — it is enough to keep the page from
     * asking twice.
     */
    private function alreadySigned(Request $request): bool
    {
        $user = Auth::guard('sanctum')->user() ?? Auth::user();

        if (! $user) {
            return false;
        }

        return LastDiscSignature::where('user_id', $user->id)
            ->orWhere('email', mb_strtolower($user->email))
            ->exists();
    }

    private function alreadyVoted(Request $request): bool
    {
        return LastDiscVote::where('voter_hash', $this->voterHash($request))->exists();
    }

    /**
     * Who is voting, without storing who is voting.
     *
     * A signed-in account votes as itself so it carries across devices;
     * everyone else is the address and the browser string, hashed with the
     * app key. The raw values never reach the table.
     */
    private function voterHash(Request $request): string
    {
        $user = Auth::guard('sanctum')->user() ?? Auth::user();

        $identity = $user
            ? 'u:'.$user->id
            : 'a:'.$request->ip().'|'.substr((string) $request->userAgent(), 0, 120);

        return hash_hmac('sha256', $identity, (string) config('app.key'));
    }

    /**
     * GET /last-disc/export — the letter's signatures, for whoever delivers it.
     *
     * Staff only. The whole point of a petition is that it can be handed over,
     * and that means somebody has to be able to read it out of the database.
     */
    public function export(Request $request)
    {
        $user = $request->user();

        if (! $user || ! $user->isStaff()) {
            return $this->error('Unauthorized.', 403);
        }

        $rows = DB::table('last_disc_signatures')
            ->orderBy('id')
            ->get(['name', 'country', 'display', 'message', 'created_at']);

        return response()->streamDownload(function () use ($rows) {
            $out = fopen('php://output', 'w');
            fputcsv($out, ['name', 'country', 'display', 'message', 'signed_at']);

            foreach ($rows as $row) {
                fputcsv($out, [
                    $row->display === 'anonymous' ? '(anonymous)' : $row->name,
                    $row->country,
                    $row->display,
                    $row->message,
                    $row->created_at,
                ]);
            }

            fclose($out);
        }, 'the-last-disc-signatures.csv', ['Content-Type' => 'text/csv']);
    }
}
