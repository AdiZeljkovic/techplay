<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Poll;
use App\Models\PollOption;
use App\Models\Thread;
use App\Services\SanitizationService;
use App\Support\ForumCache;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

/**
 * A poll attached to a thread.
 *
 * "Which GPU should I buy" and "game of the year" are threads that want a
 * count, not forty replies each naming one thing. Without one, the tally has to
 * be kept by hand in the last post, where it is wrong by the time anybody reads
 * it.
 *
 * One poll per thread, created by the thread's author or by staff. Results are
 * public unless the poll hides them until you vote, which is the one thing that
 * stops the first three votes from steering the rest.
 */
class PollController extends Controller
{
    public function store(Request $request, string $slug, SanitizationService $sanitizer)
    {
        $request->validate([
            'question' => 'required|string|min:5|max:255',
            'options' => 'required|array|min:2|max:10',
            'options.*' => 'required|string|min:1|max:120',
            'allows_multiple' => 'boolean',
            'hide_results_until_voted' => 'boolean',
            'closes_at' => 'nullable|date|after:now',
        ]);

        $thread = Thread::where('slug', $slug)->firstOrFail();
        $user = Auth::user();

        if ($thread->author_id !== $user->id && ! $user->isForumModerator()) {
            return response()->json(['message' => 'Only the thread author or staff can add a poll.'], 403);
        }

        if (Poll::where('thread_id', $thread->id)->exists()) {
            return response()->json(['message' => 'This thread already has a poll.'], 422);
        }

        // Options are the author's own words rendered as labels, so they are
        // stripped to text rather than sanitised as rich content — a poll
        // option is not a place that needs markup.
        $labels = collect($request->input('options'))
            ->map(fn ($label) => $sanitizer->sanitizeTitle((string) $label))
            ->filter(fn ($label) => $label !== '')
            ->unique()
            ->values();

        if ($labels->count() < 2) {
            return response()->json(['message' => 'A poll needs at least two different options.'], 422);
        }

        $poll = DB::transaction(function () use ($thread, $request, $sanitizer, $labels) {
            $poll = Poll::create([
                'thread_id' => $thread->id,
                'question' => $sanitizer->sanitizeTitle($request->input('question')),
                'allows_multiple' => $request->boolean('allows_multiple'),
                'hide_results_until_voted' => $request->boolean('hide_results_until_voted'),
                'closes_at' => $request->input('closes_at'),
            ]);

            $labels->each(fn ($label, $i) => PollOption::create([
                'poll_id' => $poll->id,
                'label' => $label,
                'position' => $i,
            ]));

            return $poll;
        });

        ForumCache::forgetThread($slug);

        return response()->json($this->present($poll->fresh('options'), Auth::id()), 201);
    }

    /**
     * POST /forum/threads/{slug}/poll/vote
     *
     * Sends the whole selection rather than one option at a time, so changing
     * your mind is one request and the "single choice" rule has something to
     * enforce itself against.
     */
    public function vote(Request $request, string $slug)
    {
        $request->validate([
            'options' => 'required|array|min:1',
            'options.*' => 'required|integer',
        ]);

        $thread = Thread::where('slug', $slug)->firstOrFail();
        $poll = Poll::with('options')->where('thread_id', $thread->id)->firstOrFail();

        if ($poll->isClosed()) {
            return response()->json(['message' => 'This poll has closed.'], 422);
        }

        if ($thread->is_locked) {
            return response()->json(['message' => 'Thread is locked.'], 403);
        }

        $chosen = collect($request->input('options'))->map(fn ($id) => (int) $id)->unique();

        // Options are validated against this poll's own, not merely as integers
        // — otherwise a vote could be cast into somebody else's poll.
        $valid = $poll->options->pluck('id');
        if ($chosen->diff($valid)->isNotEmpty()) {
            return response()->json(['message' => 'That is not an option on this poll.'], 422);
        }

        if (! $poll->allows_multiple && $chosen->count() > 1) {
            return response()->json(['message' => 'This poll takes one answer.'], 422);
        }

        $userId = Auth::id();

        DB::transaction(function () use ($poll, $chosen, $userId) {
            // Replace rather than add: a second vote is a change of mind, and
            // this is also what makes the single-choice rule hold over time.
            DB::table('poll_votes')->where('poll_id', $poll->id)->where('user_id', $userId)->delete();

            $chosen->each(fn ($optionId) => DB::table('poll_votes')->insert([
                'poll_id' => $poll->id,
                'poll_option_id' => $optionId,
                'user_id' => $userId,
                'created_at' => now(),
                'updated_at' => now(),
            ]));
        });

        ForumCache::forgetThread($slug);

        return response()->json($this->present($poll->fresh('options'), $userId));
    }

    /**
     * The poll as a page needs it: options with counts, what you picked, and
     * whether you are allowed to see the numbers yet.
     */
    public static function present(?Poll $poll, ?int $userId): ?array
    {
        if (! $poll) {
            return null;
        }

        $counts = DB::table('poll_votes')
            ->where('poll_id', $poll->id)
            ->groupBy('poll_option_id')
            ->selectRaw('poll_option_id, count(*) as total')
            ->pluck('total', 'poll_option_id');

        $mine = $userId
            ? DB::table('poll_votes')
                ->where('poll_id', $poll->id)
                ->where('user_id', $userId)
                ->pluck('poll_option_id')
                ->all()
            : [];

        // Voters, not votes: a multiple-choice poll where three people pick two
        // things each has six votes and three voters, and "60% of votes" is a
        // number nobody wants.
        $voters = (int) DB::table('poll_votes')->where('poll_id', $poll->id)->distinct('user_id')->count('user_id');

        $hasVoted = count($mine) > 0;
        $canSeeResults = ! $poll->hide_results_until_voted || $hasVoted || $poll->isClosed();

        return [
            'id' => $poll->id,
            'question' => $poll->question,
            'allows_multiple' => $poll->allows_multiple,
            'hide_results_until_voted' => $poll->hide_results_until_voted,
            'closes_at' => $poll->closes_at,
            'is_closed' => $poll->isClosed(),
            'voters' => $voters,
            'has_voted' => $hasVoted,
            'can_see_results' => $canSeeResults,
            'my_options' => $mine,
            'options' => $poll->options->map(fn ($option) => [
                'id' => $option->id,
                'label' => $option->label,
                // Withheld rather than sent-and-hidden: a count in the payload
                // is a count anyone can read, whatever the interface draws.
                'votes' => $canSeeResults ? (int) ($counts[$option->id] ?? 0) : null,
            ])->all(),
        ];
    }
}
