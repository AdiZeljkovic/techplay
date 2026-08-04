<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Clan;
use App\Models\ClanActivity;
use App\Models\ClanApplication;
use App\Models\ClanBoost;
use App\Models\ClanInvite;
use App\Models\ClanLedger;
use App\Models\ClanMember;
use App\Models\ClanTrophy;
use App\Models\User;
use App\Services\ClanLevelService;
use App\Services\ClanResourceService;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Str;

class ClanController extends Controller
{
    use ApiResponse;

    /**
     * GET /clans — the directory. Filters, sorts, and per-clan economy
     * figures batched off the ledger so the whole page is a fixed number of
     * queries no matter how many clans are listed.
     */
    public function index(Request $request)
    {
        $sort = (string) $request->query('sort', 'activity');

        $clans = Clan::where('is_public', true)
            ->withCount('members')
            ->when($request->query('search'), function ($q, $term) {
                $driver = $q->getConnection()->getDriverName();
                $like = $driver === 'pgsql' ? 'ilike' : 'like';
                $q->where(fn ($w) => $w->where('name', $like, "%{$term}%")->orWhere('tag', $like, "%{$term}%"));
            })
            ->when($request->query('region'), fn ($q, $r) => $q->where('region', $r))
            ->when($request->query('playstyle'), fn ($q, $p) => $q->where('playstyle', $p))
            ->when($request->boolean('recruiting'), fn ($q) => $q->where(fn ($w) => $w->whereNull('status')->orWhere('status', 'recruiting')))
            ->when($sort === 'prestige', fn ($q) => $q->orderByDesc('prestige_lifetime'))
            ->when($sort === 'level', fn ($q) => $q->orderByDesc('xp'))
            ->when($sort === 'members', fn ($q) => $q->orderByDesc('members_count'))
            ->when($sort === 'newest', fn ($q) => $q->orderByDesc('created_at'))
            ->paginate(24);

        $ids = $clans->getCollection()->pluck('id');
        $window = now()->subDays(7);
        $activeWindow = now()->subDays((int) config('clan.active_window_days', 14));

        // One query each: weekly earn and active-member counts, for every
        // clan on the page at once.
        $weekly = ClanLedger::whereIn('clan_id', $ids)
            ->where('amount', '>', 0)
            ->where('created_at', '>=', $window)
            ->selectRaw('clan_id, SUM(amount) as earned')
            ->groupBy('clan_id')
            ->pluck('earned', 'clan_id');

        $active = ClanLedger::whereIn('clan_id', $ids)
            ->whereNotNull('user_id')
            ->where('created_at', '>=', $activeWindow)
            ->selectRaw('clan_id, COUNT(DISTINCT user_id) as tally')
            ->groupBy('clan_id')
            ->pluck('tally', 'clan_id');

        $levels = app(ClanLevelService::class);
        $small = (int) config('clan.size_categories.small', 15);
        $medium = (int) config('clan.size_categories.medium', 50);

        // Recruitment Signal: the one booster whose effect is this flag.
        $featured = ClanBoost::whereIn('clan_id', $ids)
            ->where('key', 'recruitment_signal')
            ->where('ends_at', '>', now())
            ->pluck('clan_id')
            ->all();

        $clans->getCollection()->transform(function (Clan $clan) use ($weekly, $active, $levels, $small, $medium, $featured) {
            $activeCount = (int) ($active[$clan->id] ?? 0);

            return array_merge($clan->toArray(), [
                'tier_name' => $levels->tierForLevel((int) $clan->level)['name'],
                'activity_score' => (int) ($weekly[$clan->id] ?? 0),
                'active_members' => $activeCount,
                'size_category' => $activeCount <= $small ? 'small' : ($activeCount <= $medium ? 'medium' : 'large'),
                'featured' => in_array($clan->id, $featured, true),
            ]);
        });

        // Activity is the default order and can't be pushed into SQL cheaply —
        // sort the page in PHP. Cross-page precision matters less than honesty.
        if ($sort === 'activity') {
            $clans->setCollection(
                $clans->getCollection()
                    ->sortByDesc('activity_score')
                    ->sortByDesc('featured') // stable sort: featured first, then by activity
                    ->values()
            );
        }

        return $this->success($clans);
    }

    /** POST /clans — create a new clan */
    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|min:3|max:40|unique:clans',
            'description' => 'nullable|string|max:500',
            'tag' => 'nullable|string|max:8',
            'is_public' => 'boolean',
            'focus' => 'nullable|string|max:60',
            'motto' => 'nullable|string|max:120',
            'region' => 'nullable|string|max:40',
            'language' => 'nullable|string|max:40',
            'playstyle' => 'nullable|in:competitive,casual,mixed',
            'status' => 'nullable|in:recruiting,invite_only,closed',
            'requirements' => 'nullable|string|max:1000',
        ]);

        $user = $request->user();

        // User can only own one clan
        if (Clan::where('owner_id', $user->id)->exists()) {
            return $this->error('You already own a clan.', 422);
        }

        $clan = Clan::create(array_merge($data, [
            'owner_id' => $user->id,
            'slug' => Str::slug($data['name']),
        ]));

        ClanMember::create([
            'clan_id' => $clan->id,
            'user_id' => $user->id,
            'role' => 'owner',
            'joined_at' => now(),
        ]);

        $this->createClanForumCategory($clan);
        ClanResourceService::forgetClanId($user->id);

        return $this->success($clan->load('owner:id,username,avatar'), 'Clan created!', 201);
    }

    /**
     * Every clan gets its own private forum category, nested under a shared
     * "Clans" parent, visible only to members (see ForumController::categories()).
     */
    private function createClanForumCategory(Clan $clan): void
    {
        $clansParent = Category::firstOrCreate(
            ['slug' => 'clans', 'type' => 'forum'],
            ['name' => 'Clans', 'description' => 'Private spaces for clans to discuss and organize.']
        );

        Category::create([
            'name' => $clan->name,
            'slug' => 'clan-'.$clan->slug,
            'type' => 'forum',
            'parent_id' => $clansParent->id,
            'clan_id' => $clan->id,
            'is_private' => true,
            'description' => "Private discussion space for {$clan->name} members.",
        ]);
    }

    /** GET /clans/{slug} — clan profile */
    public function show(string $slug)
    {
        $clan = Clan::where('slug', $slug)
            ->withCount('members')
            ->with([
                'owner:id,username,avatar',
                'members' => fn ($q) => $q->with('user:id,username,avatar,xp')->orderBy('role'),
            ])
            ->firstOrFail();

        $levels = app(ClanLevelService::class);

        // Activity score: everything earned in the last 7 days, off the ledger.
        $weekEarned = (int) $clan->ledger()
            ->where('amount', '>', 0)
            ->where('created_at', '>=', now()->subDays(7))
            ->sum('amount');

        $memberIds = $clan->members->pluck('user_id');

        // Batched roster context: lifetime + weekly contribution, who is
        // online (Redis presence window), who is in game, and each member's
        // most recently played game. Fixed query count for any roster size.
        $contributions = ClanLedger::where('clan_id', $clan->id)
            ->whereNotNull('user_id')->where('amount', '>', 0)
            ->selectRaw('user_id, SUM(amount) as total')
            ->groupBy('user_id')->pluck('total', 'user_id');

        $weeklyContrib = ClanLedger::where('clan_id', $clan->id)
            ->whereNotNull('user_id')->where('amount', '>', 0)
            ->where('created_at', '>=', now()->subDays(7))
            ->selectRaw('user_id, SUM(amount) as total')
            ->groupBy('user_id')->pluck('total', 'user_id');

        $onlineIds = [];
        try {
            $onlineIds = array_map('intval', Redis::zrangebyscore(
                'forum:users:online', now()->subMinutes(5)->timestamp, '+inf'
            ) ?: []);
        } catch (\Throwable) {
            // Redis down → everyone reads as offline, nothing breaks.
        }

        $inGame = DB::table('presences')
            ->whereIn('user_id', $memberIds)->where('is_active', true)
            ->pluck('game_name', 'user_id');

        $mainGames = DB::table('user_games')
            ->join('games', 'games.id', '=', 'user_games.game_id')
            ->whereIn('user_games.user_id', $memberIds)
            ->whereNotNull('user_games.last_played_at')
            ->orderByDesc('user_games.last_played_at')
            ->limit(400)
            ->get(['user_games.user_id', 'games.name'])
            ->unique('user_id')
            ->pluck('name', 'user_id');

        $roster = $clan->members->map(fn (ClanMember $m) => [
            'user' => $m->user ? [
                'username' => $m->user->username,
                'avatar' => $m->user->avatar,
                'xp' => (int) $m->user->xp,
            ] : null,
            'role' => $m->role,
            'joined_at' => $m->joined_at?->toDateString(),
            'online' => in_array($m->user_id, $onlineIds, true),
            'in_game' => $inGame[$m->user_id] ?? null,
            'main_game' => $mainGames[$m->user_id] ?? null,
            'contribution' => (int) ($contributions[$m->user_id] ?? 0),
            'contribution_week' => (int) ($weeklyContrib[$m->user_id] ?? 0),
        ])->filter(fn ($row) => $row['user'] !== null)
            ->sortBy([['role', 'asc'], ['contribution', 'desc']])
            ->values();

        // The games this clan actually plays: how many members own each.
        $memberCount = max(1, $clan->members_count);
        $clanGames = DB::table('user_games')
            ->join('games', 'games.id', '=', 'user_games.game_id')
            ->whereIn('user_games.user_id', $memberIds)
            ->selectRaw('games.slug, games.name, games.background_image, COUNT(DISTINCT user_games.user_id) as players')
            ->groupBy('games.slug', 'games.name', 'games.background_image')
            ->orderByDesc('players')
            ->limit(4)
            ->get()
            ->map(fn ($g) => [
                'slug' => $g->slug,
                'name' => $g->name,
                'background_image' => $g->background_image,
                'players' => (int) $g->players,
                'percent' => (int) round($g->players / $memberCount * 100),
            ]);

        // Viewer standing: their role here, or a pending application.
        $viewer = Auth::guard('sanctum')->user() ?? Auth::user();
        $viewerState = null;
        if ($viewer) {
            $membership = $clan->members->firstWhere('user_id', $viewer->id);
            $viewerState = [
                'role' => $membership?->role,
                'in_other_clan' => ! $membership && ClanMember::where('user_id', $viewer->id)->exists(),
                'application_pending' => ! $membership && ClanApplication::where('clan_id', $clan->id)
                    ->where('user_id', $viewer->id)->where('status', 'pending')->exists(),
            ];
        }

        return $this->success(array_merge($clan->toArray(), [
            'progress' => $levels->progress((int) $clan->xp),
            'tier_name' => $levels->tierForLevel((int) $clan->level)['name'],
            'resources' => [
                'intel' => (int) $clan->intel,
                'materials' => (int) $clan->materials,
                'prestige' => (int) $clan->prestige,
                'prestige_lifetime' => (int) $clan->prestige_lifetime,
            ],
            'active_members' => $clan->activeMemberCount(),
            'online_count' => count(array_intersect($memberIds->all(), $onlineIds)),
            'activity_score' => $weekEarned,
            'roster' => $roster,
            'top_contributors' => $roster->sortByDesc('contribution_week')
                ->filter(fn ($r) => $r['contribution_week'] > 0)->take(5)->values(),
            'clan_games' => $clanGames,
            'viewer' => $viewerState,
            'pending_applications' => ClanApplication::where('clan_id', $clan->id)->where('status', 'pending')->count(),
            'forum_slug' => 'clan-'.$clan->slug,
            'trophies' => ClanTrophy::where('clan_id', $clan->id)
                ->orderByDesc('awarded_at')
                ->limit(8)
                ->get(['id', 'key', 'title', 'description', 'awarded_at']),
            'feed' => $clan->activities()
                ->with('user:id,username,avatar_url')
                ->latest()
                ->limit(15)
                ->get(),
        ]));
    }

    /** POST /clans/{slug}/join */
    public function join(Request $request, string $slug)
    {
        $clan = Clan::where('slug', $slug)->firstOrFail();
        $user = $request->user();

        // Open joining is only for clans that are actively recruiting —
        // invite-only and closed clans go through invites or applications.
        if (! $clan->is_public || ($clan->status ?? 'recruiting') !== 'recruiting') {
            return $this->error('This clan is not open for direct joining.', 403);
        }

        if ($clan->hasMember($user->id)) {
            return $this->error('You are already a member of this clan.', 422);
        }

        if ($clan->isFull()) {
            return $this->error('This clan is full.', 422);
        }

        $this->admit($clan, $user);

        return $this->success(null, 'You have joined the clan!');
    }

    /** DELETE /clans/{slug}/leave */
    public function leave(Request $request, string $slug)
    {
        $clan = Clan::where('slug', $slug)->firstOrFail();
        $user = $request->user();

        if ($clan->owner_id === $user->id) {
            return $this->error('Transfer ownership before leaving.', 422);
        }

        ClanMember::where('clan_id', $clan->id)->where('user_id', $user->id)->delete();
        ClanResourceService::forgetClanId($user->id);

        ClanActivity::create([
            'clan_id' => $clan->id,
            'user_id' => $user->id,
            'type' => 'member_left',
            'title' => "{$user->username} left the clan",
        ]);

        return $this->success(null, 'You have left the clan.');
    }

    /** POST /clans/{slug}/invite */
    public function invite(Request $request, string $slug)
    {
        $clan = Clan::where('slug', $slug)->firstOrFail();
        $user = $request->user();

        $membership = ClanMember::where('clan_id', $clan->id)->where('user_id', $user->id)->first();

        if (! $membership || ! $membership->isOfficerOrAbove()) {
            return $this->error('Only officers can invite members.', 403);
        }

        $data = $request->validate(['username' => 'required|string|exists:users,username']);
        $invitee = User::where('username', $data['username'])->firstOrFail();

        if ($clan->hasMember($invitee->id)) {
            return $this->error('User is already a member.', 422);
        }

        $invite = ClanInvite::updateOrCreate(
            ['clan_id' => $clan->id, 'invitee_id' => $invitee->id],
            ['inviter_id' => $user->id, 'status' => 'pending', 'expires_at' => now()->addDays(7)]
        );

        return $this->success($invite, 'Invite sent!');
    }

    /** POST /clans/invites/{id}/respond */
    public function respondInvite(Request $request, int $id)
    {
        $invite = ClanInvite::findOrFail($id);
        $user = $request->user();

        if ($invite->invitee_id !== $user->id) {
            return $this->error('Not your invite.', 403);
        }

        if (! $invite->isPending()) {
            return $this->error('This invite is no longer valid.', 422);
        }

        $data = $request->validate(['accept' => 'required|boolean']);

        if ($data['accept']) {
            $clan = $invite->clan;

            if ($clan->isFull()) {
                return $this->error('The clan is full.', 422);
            }

            $this->admit($clan, $user);

            $invite->update(['status' => 'accepted']);

            return $this->success(null, 'You have joined the clan!');
        }

        $invite->update(['status' => 'declined']);

        return $this->success(null, 'Invite declined.');
    }

    /** GET /user/clan — current user's clan */
    public function myClan(Request $request)
    {
        $member = ClanMember::where('user_id', $request->user()->id)
            ->with('clan:id,name,slug,logo,tag,description,owner_id')
            ->first();

        if (! $member) {
            return $this->success(null);
        }

        $clan = Clan::find($member->clan_id);

        return $this->success([
            'clan' => $member->clan,
            'role' => $member->role,
            'progress' => app(ClanLevelService::class)->progress((int) ($clan->xp ?? 0)),
            'resources' => [
                'intel' => (int) ($clan->intel ?? 0),
                'materials' => (int) ($clan->materials ?? 0),
                'prestige' => (int) ($clan->prestige ?? 0),
            ],
        ]);
    }

    /* -- applications ---------------------------------------------------- */

    /**
     * POST /clans/{slug}/apply - ask to join. Closed clans take nobody;
     * recruiting and invite-only clans both accept applications.
     */
    public function apply(Request $request, string $slug)
    {
        $clan = Clan::where('slug', $slug)->firstOrFail();
        $user = $request->user();

        if (($clan->status ?? 'recruiting') === 'closed') {
            return $this->error('This clan is not accepting members.', 403);
        }

        if ($clan->hasMember($user->id)) {
            return $this->error('You are already a member of this clan.', 422);
        }

        if (ClanMember::where('user_id', $user->id)->exists()) {
            return $this->error('Leave your current clan before applying to another.', 422);
        }

        if ($clan->isFull()) {
            return $this->error('This clan is full.', 422);
        }

        $data = $request->validate(['message' => 'nullable|string|max:500']);

        $existing = ClanApplication::where('clan_id', $clan->id)
            ->where('user_id', $user->id)
            ->where('status', 'pending')
            ->exists();

        if ($existing) {
            return $this->error('You already have a pending application here.', 422);
        }

        $application = ClanApplication::create([
            'clan_id' => $clan->id,
            'user_id' => $user->id,
            'message' => $data['message'] ?? null,
        ]);

        ClanActivity::create([
            'clan_id' => $clan->id,
            'user_id' => $user->id,
            'type' => 'application_received',
            'title' => "{$user->username} applied to join",
        ]);

        return $this->success($application->only(['id', 'status', 'created_at']), 'Application sent.');
    }

    /** GET /clans/{slug}/applications - pending list, officers only. */
    public function applications(Request $request, string $slug)
    {
        $clan = Clan::where('slug', $slug)->firstOrFail();
        $membership = ClanMember::where('clan_id', $clan->id)->where('user_id', $request->user()->id)->first();

        if (! $membership || ! $membership->isOfficerOrAbove()) {
            return $this->error('Only officers can review applications.', 403);
        }

        return $this->success(
            ClanApplication::where('clan_id', $clan->id)
                ->where('status', 'pending')
                ->with('user:id,username,display_name,avatar_url,xp')
                ->latest()
                ->get()
        );
    }

    /** POST /clans/applications/{id}/respond - accept or decline, officers only. */
    public function respondApplication(Request $request, int $id)
    {
        $application = ClanApplication::with('clan')->findOrFail($id);
        $clan = $application->clan;

        $membership = ClanMember::where('clan_id', $clan->id)->where('user_id', $request->user()->id)->first();

        if (! $membership || ! $membership->isOfficerOrAbove()) {
            return $this->error('Only officers can review applications.', 403);
        }

        if ($application->status !== 'pending') {
            return $this->error('This application was already handled.', 422);
        }

        $data = $request->validate(['accept' => 'required|boolean']);

        if (! $data['accept']) {
            $application->update(['status' => 'declined', 'handled_by' => $request->user()->id]);

            return $this->success(null, 'Application declined.');
        }

        if ($clan->isFull()) {
            return $this->error('The clan is full.', 422);
        }

        $applicant = User::findOrFail($application->user_id);

        // The applicant may have joined somewhere else while waiting.
        if (ClanMember::where('user_id', $applicant->id)->exists()) {
            $application->update(['status' => 'declined', 'handled_by' => $request->user()->id]);

            return $this->error('The applicant has already joined another clan.', 422);
        }

        $this->admit($clan, $applicant);
        $application->update(['status' => 'accepted', 'handled_by' => $request->user()->id]);

        return $this->success(null, 'Application accepted.');
    }

    /** One doorway for every way into a clan: member row, cache, feed. */
    private function admit(Clan $clan, User $user): void
    {
        ClanMember::firstOrCreate(
            ['clan_id' => $clan->id, 'user_id' => $user->id],
            ['role' => 'member', 'joined_at' => now()]
        );

        ClanResourceService::forgetClanId($user->id);

        ClanActivity::create([
            'clan_id' => $clan->id,
            'user_id' => $user->id,
            'type' => 'member_joined',
            'title' => "{$user->username} joined the clan",
        ]);
    }
}
