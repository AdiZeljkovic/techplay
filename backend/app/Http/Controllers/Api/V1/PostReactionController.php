<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Post;
use App\Models\Thread;
use App\Support\ForumCache;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

/**
 * Reacting to one reply rather than to the whole thread.
 *
 * The only signal the forum had was a thread upvote, so the way to tell
 * somebody their answer helped was to post another reply saying so — which is
 * how a useful thread fills with "this", "same" and "thanks" that everyone
 * after has to scroll past.
 *
 * The vocabulary is fixed and short on purpose. Free-form emoji turn a reply
 * list into a column of arbitrary pictures; five named reactions stay
 * scannable, and each one means something a reader can act on.
 */
class PostReactionController extends Controller
{
    public const REACTIONS = [
        'helpful',   // answered the question
        'agree',     // saves a "+1" reply
        'funny',
        'insightful',
        'disagree',  // stated once, rather than argued three times
    ];

    /**
     * POST /forum/threads/{slug}/posts/{postId}/reactions
     *
     * Sending the reaction you already have removes it, the way the thread
     * upvote already behaves — one control, on and off.
     */
    public function toggle(Request $request, string $slug, int $postId)
    {
        $request->validate([
            'reaction' => ['required', 'string', Rule::in(self::REACTIONS)],
        ]);

        // Bound to the thread in the URL, like every other post action here:
        // unbound, the caller picks {slug} freely and invalidates a cache
        // belonging to some other thread.
        $thread = Thread::where('slug', $slug)->firstOrFail();
        $post = Post::where('thread_id', $thread->id)->findOrFail($postId);

        $userId = Auth::id();
        $reaction = $request->string('reaction')->toString();

        $result = DB::transaction(function () use ($post, $userId, $reaction) {
            $existing = DB::table('post_reactions')
                ->where('post_id', $post->id)
                ->where('user_id', $userId)
                ->lockForUpdate()
                ->first();

            if ($existing && $existing->reaction === $reaction) {
                DB::table('post_reactions')->where('id', $existing->id)->delete();

                return 'removed';
            }

            DB::table('post_reactions')->updateOrInsert(
                ['post_id' => $post->id, 'user_id' => $userId],
                ['reaction' => $reaction, 'updated_at' => now(), 'created_at' => now()],
            );

            return $existing ? 'changed' : 'added';
        });

        ForumCache::forgetThread($slug);

        return response()->json([
            'action' => $result,
            'reactions' => $this->countsFor($post->id),
            'mine' => $result === 'removed' ? null : $reaction,
        ]);
    }

    /** reaction => how many, with zero-count kinds left out entirely. */
    private function countsFor(int $postId): array
    {
        return DB::table('post_reactions')
            ->where('post_id', $postId)
            ->groupBy('reaction')
            ->selectRaw('reaction, count(*) as total')
            ->pluck('total', 'reaction')
            ->map(fn ($n) => (int) $n)
            ->all();
    }
}
