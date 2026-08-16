<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Thread;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

/**
 * Read state, kept apart from the boards themselves.
 *
 * A board's pages are cached for thirty seconds and served to everybody from
 * the same entry, so nothing personal can travel in them — put one reader's
 * unread marks in that payload and the next reader gets them. So the boards
 * stay public and shared, and who-has-read-what is one small authenticated
 * request the client makes alongside.
 *
 * The client holds the answer for the session and decides which rows are bold.
 * That keeps this off the critical path: the board renders whether or not this
 * has arrived, and gains its marks a moment later.
 */
class ForumReadController extends Controller
{
    /** How far back the map reaches. Older reads are simply "read". */
    private const WINDOW_DAYS = 90;

    /**
     * GET /forum/reads — everything this reader has already seen.
     *
     * Returned as a map rather than a list so the client can look a thread up
     * by id without scanning.
     */
    public function index()
    {
        $user = Auth::user();

        $reads = DB::table('thread_reads')
            ->where('user_id', $user->id)
            ->where('last_read_at', '>=', now()->subDays(self::WINDOW_DAYS))
            ->pluck('last_read_at', 'thread_id');

        return response()->json([
            // Anything older than the watermark is read, whatever the map says.
            'watermark' => $user->forum_last_read_at,
            'threads' => $reads,
        ])->header('Cache-Control', 'private, no-store');
    }

    /**
     * POST /forum/threads/{slug}/read — this thread, as of now.
     *
     * Called by the thread page on open. Deliberately not folded into
     * showThread: that endpoint answers to guests as well, and a GET should not
     * be the thing that writes.
     */
    public function markThread(string $slug)
    {
        $thread = Thread::where('slug', $slug)->firstOrFail();
        $user = Auth::user();

        DB::table('thread_reads')->updateOrInsert(
            ['user_id' => $user->id, 'thread_id' => $thread->id],
            ['last_read_at' => now()],
        );

        return response()->json(['read_at' => now()->toIso8601String()]);
    }

    /**
     * POST /forum/reads/all — dismiss everything at once.
     *
     * Moves the watermark rather than writing a row per thread, which is the
     * whole reason the watermark exists: a member with three thousand unread
     * threads should cost one UPDATE, not three thousand INSERTs.
     */
    public function markAll(Request $request)
    {
        $user = Auth::user();
        $user->forum_last_read_at = now();
        $user->save();

        // The per-thread rows are now redundant for anything older, so they go.
        DB::table('thread_reads')
            ->where('user_id', $user->id)
            ->where('last_read_at', '<', $user->forum_last_read_at)
            ->delete();

        return response()->json([
            'watermark' => $user->forum_last_read_at->toIso8601String(),
            'message' => 'Everything marked read.',
        ]);
    }
}
