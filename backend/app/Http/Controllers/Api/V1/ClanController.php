<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Clan;
use App\Models\ClanInvite;
use App\Models\ClanMember;
use App\Models\User;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ClanController extends Controller
{
    use ApiResponse;

    /** GET /clans — list public clans */
    public function index(Request $request)
    {
        $clans = Clan::where('is_public', true)
            ->withCount('members')
            ->with('owner:id,username,avatar')
            ->when($request->query('search'), fn ($q, $s) => $q->where('name', 'ilike', "%{$s}%"))
            ->orderByDesc('members_count')
            ->paginate(20);

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

        return $this->success($clan);
    }

    /** POST /clans/{slug}/join */
    public function join(Request $request, string $slug)
    {
        $clan = Clan::where('slug', $slug)->firstOrFail();
        $user = $request->user();

        if (! $clan->is_public) {
            return $this->error('This clan is invite-only.', 403);
        }

        if ($clan->hasMember($user->id)) {
            return $this->error('You are already a member of this clan.', 422);
        }

        if ($clan->isFull()) {
            return $this->error('This clan is full.', 422);
        }

        ClanMember::create([
            'clan_id' => $clan->id,
            'user_id' => $user->id,
            'role' => 'member',
            'joined_at' => now(),
        ]);

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

            ClanMember::firstOrCreate(
                ['clan_id' => $clan->id, 'user_id' => $user->id],
                ['role' => 'member', 'joined_at' => now()]
            );

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

        return $this->success([
            'clan' => $member->clan,
            'role' => $member->role,
        ]);
    }
}
