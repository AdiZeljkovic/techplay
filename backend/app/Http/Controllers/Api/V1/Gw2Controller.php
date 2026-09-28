<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Jobs\SyncGw2Account;
use App\Models\ConnectedAccount;
use App\Models\Gw2Goal;
use App\Services\Gw2\Advisor\Dashboard;
use App\Services\Gw2\Advisor\Intent;
use App\Services\Gw2\Advisor\PlayerChoices;
use App\Services\Gw2\Gw2Connection;
use App\Traits\ApiResponse;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Connecting a Guild Wars 2 account, and reading what we know about it.
 *
 * Nothing here calls ArenaNet while a reader waits. Connecting checks the key
 * once — a player who pasted a dead key should be told immediately, not
 * tomorrow — and everything after that is a queued job reading into our own
 * tables. The limit is counted per IP and every request leaves from one
 * server, so a page that fetched on render would spend the whole site's budget
 * on whoever happened to load it.
 */
class Gw2Controller extends Controller
{
    use ApiResponse;

    public function __construct(
        private readonly Gw2Connection $connections,
        private readonly Dashboard $dashboard,
        private readonly PlayerChoices $choices,
    ) {}

    /**
     * POST /gw2/connect
     *
     * The key is read from the body and never from the query string: a URL
     * ends up in access logs, in referrers and in error reports, and a
     * read-only key is still somebody's account.
     */
    public function connect(Request $request): JsonResponse
    {
        $request->validate(['api_key' => 'required|string|max:200']);

        $connection = $this->connections->connect($request->user(), $request->string('api_key')->toString());

        // The first read is the whole point of connecting, so it does not wait
        // for the nightly pass.
        SyncGw2Account::dispatch($connection->id);

        return $this->success(
            $this->describe($connection),
            'Connected. We are reading your account now — this takes a moment.'
        );
    }

    /**
     * GET /gw2/connection
     *
     * Sync health, permissions and what is missing because of them.
     */
    public function connection(Request $request): JsonResponse
    {
        $connection = $this->find($request);

        if (! $connection) {
            return $this->success(null, 'No Guild Wars 2 account is connected.');
        }

        return $this->success($this->describe($connection));
    }

    /**
     * POST /gw2/sync
     *
     * A quick pass by default — the six endpoints that move within a day.
     * A full read is eighteen requests and is not something a button should
     * spend on every press.
     */
    public function sync(Request $request): JsonResponse
    {
        $connection = $this->find($request);

        if (! $connection) {
            return $this->error('No Guild Wars 2 account is connected.', 404);
        }

        $full = $request->boolean('full');

        /*
         * A full read is allowed once an hour, and the answer to asking again
         * is the last sync time rather than an error. Nothing is broken; the
         * data is simply as fresh as it is going to get.
         */
        if ($full) {
            $last = DB::table('gw2_accounts')
                ->where('connected_account_id', $connection->id)
                ->value('last_full_sync_at');

            if ($last && now()->diffInMinutes($last) < 60) {
                return $this->success(
                    $this->describe($connection),
                    'Your account was fully read less than an hour ago.'
                );
            }
        }

        SyncGw2Account::dispatch($connection->id, quick: ! $full);

        $connection->forceFill(['sync_status' => 'pending'])->save();

        return $this->success($this->describe($connection), 'Reading your account.');
    }

    /**
     * DELETE /gw2/connection
     *
     * The key and everything derived from it. The foreign keys cascade through
     * characters, state, the ledger and the history, so this really does leave
     * nothing — which is what the connect screen promises.
     */
    public function disconnect(Request $request): JsonResponse
    {
        $this->connections->disconnect($request->user());

        return $this->success(null, 'Disconnected. Your key and everything read with it are gone.');
    }

    /**
     * GET /gw2/dashboard
     *
     * The whole advisor in one read, out of our own tables. Nothing on this path
     * touches ArenaNet: the rate limit is counted per IP for the entire site, so
     * a page that fetched on render would spend everyone's budget on whoever
     * happened to open it.
     *
     * The optional intent — how long they have, what to skip — is read from the
     * query string because it is a question, not a setting. Answers to it are not
     * cached; the unfiltered view is.
     */
    public function dashboard(Request $request): JsonResponse
    {
        $request->validate([
            'minutes' => 'nullable|integer|min:5|max:600',
            'goal' => 'nullable|string|max:24',
            'avoid' => 'nullable|array|max:8',
            'avoid.*' => 'string|max:24',
        ]);

        $connection = $this->find($request);

        if (! $connection) {
            return $this->error('No Guild Wars 2 account is connected.', 404);
        }

        $accountId = DB::table('gw2_accounts')
            ->where('connected_account_id', $connection->id)
            ->value('id');

        $payload = $accountId ? $this->dashboard->for((int) $accountId, new Intent(
            goal: $request->string('goal')->toString() ?: null,
            minutes: $request->integer('minutes') ?: null,
            avoid: $request->input('avoid', []),
        )) : null;

        if (! $payload) {
            /*
             * Connected but never read. A player who has just pasted a key lands
             * here for the half minute the queued sync takes, and telling them
             * that is better than an empty dashboard that looks broken.
             */
            return $this->success(
                ['connection' => $this->describe($connection)],
                'We have not finished reading your account yet. Give it a moment.'
            );
        }

        $payload['connection'] = $this->describe($connection);

        return $this->success($payload);
    }

    /**
     * GET /gw2/masteries
     *
     * Every track with the account's place in it. Separate from the dashboard
     * because forty tracks and their tier names are a few kilobytes the front
     * page has no use for.
     */
    public function masteries(Request $request): JsonResponse
    {
        $connection = $this->find($request);

        if (! $connection) {
            return $this->error('No Guild Wars 2 account is connected.', 404);
        }

        $accountId = DB::table('gw2_accounts')
            ->where('connected_account_id', $connection->id)
            ->value('id');

        $payload = $accountId ? $this->dashboard->masteries((int) $accountId) : null;

        if (! $payload) {
            return $this->success(null, 'We have not finished reading your account yet.');
        }

        return $this->success($payload);
    }

    /**
     * GET /gw2/content
     *
     * Raids this week, world bosses today, dungeons today — and, separately,
     * everything since the day the account connected.
     */
    public function content(Request $request): JsonResponse
    {
        $accountId = $this->accountId($request);

        if (! $accountId) {
            return $this->error('No Guild Wars 2 account is connected.', 404);
        }

        $payload = $this->dashboard->content($accountId);

        if (! $payload) {
            return $this->success(null, 'We have not finished reading your account yet.');
        }

        return $this->success($payload);
    }

    /**
     * POST|DELETE /gw2/pins
     *
     * Persist what somebody is working towards.
     *
     * §21 is explicit about why: *"Pinned goals: player returns to see the next
     * blocker."* Without this the advisor forgets the moment a tab closes,
     * which is the opposite of the loop the document is asking for.
     */
    public function pin(Request $request): JsonResponse
    {
        $request->validate([
            'goal' => 'required|string|max:48',
            'character' => 'nullable|string|max:64',
        ]);

        $accountId = $this->accountId($request);

        if (! $accountId) {
            return $this->error('No Guild Wars 2 account is connected.', 404);
        }

        $ok = $this->choices->pin(
            $accountId,
            $request->string('goal')->toString(),
            $request->string('character')->toString() ?: null
        );

        if (! $ok) {
            return $this->error('No such goal.', 404);
        }

        return $this->success($this->choices->pins($accountId), 'Pinned.');
    }

    public function unpin(Request $request, string $goal): JsonResponse
    {
        $accountId = $this->accountId($request);

        if (! $accountId) {
            return $this->error('No Guild Wars 2 account is connected.', 404);
        }

        $this->choices->unpin($accountId, $goal);

        return $this->success($this->choices->pins($accountId), 'Unpinned.');
    }

    /**
     * PUT /gw2/character
     *
     * Which character the advisor should talk about.
     *
     * We rank by level and gear until told otherwise, which is a reasonable
     * guess and still a guess — a veteran with fifteen characters has a main
     * and nothing in the API says which.
     */
    public function chooseCharacter(Request $request): JsonResponse
    {
        $request->validate(['character' => 'nullable|string|max:64']);

        $accountId = $this->accountId($request);

        if (! $accountId) {
            return $this->error('No Guild Wars 2 account is connected.', 404);
        }

        $name = $request->string('character')->toString() ?: null;

        // Null clears the choice and hands it back to the ranking, which is a
        // thing somebody should be able to undo.
        if ($name !== null && ! DB::table('gw2_characters')
            ->where('gw2_account_id', $accountId)
            ->where('name', $name)
            ->exists()) {
            return $this->error('That character is not on this account.', 422);
        }

        DB::table('gw2_accounts')->where('id', $accountId)->update([
            'featured_character' => $name,
            'updated_at' => now(),
        ]);

        return $this->success(['featured_character' => $name], $name ? 'Character chosen.' : 'Back to our pick.');
    }

    /**
     * POST /gw2/confirm
     *
     * Answer something the API cannot see.
     *
     * §17.3: *"Unknown must be a first-class state. Use 'We cannot verify this
     * from the API' with a small confirm control."*
     */
    public function confirm(Request $request): JsonResponse
    {
        $request->validate([
            'subject' => 'required|string|max:160',
            'answer' => 'required|in:yes,no,unsure',
            'note' => 'nullable|string|max:500',
        ]);

        $accountId = $this->accountId($request);

        if (! $accountId) {
            return $this->error('No Guild Wars 2 account is connected.', 404);
        }

        $this->choices->confirm(
            $accountId,
            $request->string('subject')->toString(),
            $request->string('answer')->toString(),
            $request->string('note')->toString() ?: null
        );

        return $this->success(null, 'Noted — thank you.');
    }

    /**
     * GET /gw2/goals
     *
     * What a player may pick. No account needed — the picker is part of the
     * public promise ("Connect your account. Pick a goal") and should be
     * readable before anybody connects anything.
     */
    public function goals(): JsonResponse
    {
        return $this->success(
            Gw2Goal::query()->active()->orderBy('sort_order')->get(['slug', 'title', 'summary', 'domain', 'icon'])
        );
    }

    /**
     * GET /gw2/tonight
     *
     * An evening, ordered out of recommendations that already hold.
     */
    public function tonight(Request $request): JsonResponse
    {
        $request->validate(['minutes' => 'nullable|integer|min:5|max:600']);

        $accountId = $this->accountId($request);

        if (! $accountId) {
            return $this->error('No Guild Wars 2 account is connected.', 404);
        }

        $payload = $this->dashboard->tonight($accountId, $request->integer('minutes') ?: null);

        if (! $payload) {
            return $this->success(null, 'We have not finished reading your account yet.');
        }

        return $this->success($payload);
    }

    /**
     * GET /gw2/plan
     *
     * What it takes to make one thing, given what this account holds.
     */
    public function plan(Request $request): JsonResponse
    {
        $request->validate([
            'item_id' => 'required|integer|min:1',
            'quantity' => 'nullable|integer|min:1|max:250',
        ]);

        $accountId = $this->accountId($request);

        if (! $accountId) {
            return $this->error('No Guild Wars 2 account is connected.', 404);
        }

        $payload = $this->dashboard->plan(
            $accountId,
            $request->integer('item_id'),
            $request->integer('quantity') ?: 1,
        );

        if (! $payload) {
            return $this->error('We do not have that item, or your account has not been read yet.', 404);
        }

        return $this->success($payload);
    }

    /**
     * GET /gw2/items?q=
     *
     * Finding the thing to plan for, out of 74,265.
     *
     * Three tiers of match rather than one `LIKE '%q%'`: an exact name, then a
     * prefix, then anything containing it. Without the ordering, searching
     * "damask" returns "Bolt of Damask" somewhere below thirty items whose
     * description happens to mention it.
     */
    public function items(Request $request): JsonResponse
    {
        $request->validate(['q' => 'required|string|min:2|max:80']);

        $term = $request->string('q')->toString();

        // pgsql in production, sqlite in the suite — the operator differs and
        // the query has to be testable on both.
        $like = DB::connection()->getDriverName() === 'pgsql' ? 'ilike' : 'like';

        $items = DB::table('gw2_items')
            ->where('name', $like, '%'.$term.'%')
            ->orderByRaw(
                'case when lower(name) = ? then 0 when lower(name) like ? then 1 else 2 end, length(name), name',
                [mb_strtolower($term), mb_strtolower($term).'%']
            )
            ->limit(20)
            ->get(['id', 'name', 'rarity', 'type', 'level', 'icon']);

        return $this->success($items);
    }

    private function accountId(Request $request): ?int
    {
        $connection = $this->find($request);

        if (! $connection) {
            return null;
        }

        $id = DB::table('gw2_accounts')->where('connected_account_id', $connection->id)->value('id');

        return $id ? (int) $id : null;
    }

    private function find(Request $request): ?ConnectedAccount
    {
        return ConnectedAccount::query()
            ->where('user_id', $request->user()->id)
            ->where('provider', Gw2Connection::PROVIDER)
            ->first();
    }

    /**
     * What the client is allowed to know about the connection.
     *
     * The key is never among it, not even masked in a way that could be
     * reassembled. `key_name` is what the player called it at
     * account.arena.net, which is what they need to find it again.
     *
     * @return array<string, mixed>
     */
    private function describe(ConnectedAccount $connection): array
    {
        $account = DB::table('gw2_accounts')->where('connected_account_id', $connection->id)->first();
        $scopes = $connection->scopes ?? [];

        return [
            'connected' => true,
            'account_name' => $connection->display_name,
            'key_name' => $connection->metadata['key_name'] ?? null,
            'permissions' => $scopes,
            // Named so the UI can say which feature is dark and why, rather
            // than drawing an empty panel and letting the player guess.
            'missing_features' => $this->connections->missingFeatures($scopes),
            'sync_status' => $connection->sync_status,
            'sync_error' => $connection->sync_error,
            'last_synced_at' => $connection->last_synced_at,
            /*
             * Parsed rather than passed through. `last_synced_at` comes off an
             * Eloquent cast and serialises as UTC ISO-8601; this one comes off
             * a raw query builder row as the string PostgreSQL stored. Handing
             * a client two formats for the same kind of moment in one payload
             * is how a "synced 2 hours ago" label ends up two hours out.
             */
            'last_full_sync_at' => isset($account->last_full_sync_at)
                ? Carbon::parse($account->last_full_sync_at)
                : null,
            'world' => $account->world ?? null,
            'fractal_level' => $account->fractal_level ?? null,
            'access' => $account && $account->access ? json_decode($account->access, true) : [],
            'characters' => $account
                ? DB::table('gw2_characters')->where('gw2_account_id', $account->id)->count()
                : 0,
        ];
    }
}
