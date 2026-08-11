<?php

namespace Tests\Feature;

use App\Models\Comment;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

/**
 * One answer to "is this person staff".
 *
 * Twenty-two files used to carry their own list of role names, and every one of
 * them also consulted the legacy `users.role` string, so the same person could
 * be staff at one endpoint and not at another: an Editor-in-Chief could delete
 * a whole thread but not edit a post inside it, and a Moderator could lock a
 * thread while the comment policy did not recognise them at all.
 *
 * These tests pin the tiers themselves. If someone widens one, this file is
 * where it shows up — rather than in a forum route six months later.
 */
class RoleSchemeTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolesAndPermissionsSeeder::class);
        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }

    private function withRole(string $role): User
    {
        $user = User::factory()->create();
        $user->assignRole($role);

        return $user->fresh();
    }

    /** @return array<string, array{0:string, 1:bool, 2:bool, 3:bool}> */
    public static function tiers(): array
    {
        //            role                 admin  editorial  moderator
        return [
            'Super Admin' => ['Super Admin', true, true, true],
            'Editor-in-Chief' => ['Editor-in-Chief', false, true, true],
            'Editor' => ['Editor', false, true, false],
            'Journalist' => ['Journalist', false, true, false],
            'Moderator' => ['Moderator', false, false, true],
        ];
    }

    /**
     * @dataProvider tiers
     */
    public function test_each_role_lands_in_the_tiers_it_should(
        string $role,
        bool $admin,
        bool $editorial,
        bool $moderator
    ): void {
        $user = $this->withRole($role);

        $this->assertSame($admin, $user->isAdmin(), "{$role} · isAdmin");
        $this->assertSame($editorial, $user->isEditorialStaff(), "{$role} · isEditorialStaff");
        $this->assertSame($moderator, $user->isForumModerator(), "{$role} · isForumModerator");
        $this->assertTrue($user->isStaff(), "{$role} should count as staff");
    }

    public function test_an_ordinary_member_is_none_of_them(): void
    {
        $user = User::factory()->create();

        $this->assertFalse($user->isAdmin());
        $this->assertFalse($user->isEditorialStaff());
        $this->assertFalse($user->isForumModerator());
        $this->assertFalse($user->isStaff());
    }

    public function test_the_legacy_column_no_longer_grants_anything(): void
    {
        // The whole point of the migration: `users.role` is historical data
        // now. Somebody setting it directly in the database — which the admin
        // panel cannot even do, since it edits Spatie roles — must not become
        // staff by doing so.
        $user = User::factory()->create();
        $user->forceFill(['role' => 'admin'])->save();

        $this->assertFalse($user->fresh()->isAdmin(), 'the column must not be an authorization input');
    }

    public function test_a_moderator_can_moderate_comments(): void
    {
        // This is the case the two schemes used to get wrong in opposite
        // directions: CommentPolicy checked `role === 'admin'` only, so the one
        // role that exists to moderate could not.
        $moderator = $this->withRole('Moderator');

        $this->assertTrue($moderator->can('viewAny', Comment::class));
        $this->assertTrue($moderator->can('update', new Comment));
    }

    public function test_an_editor_in_chief_can_both_delete_a_thread_and_edit_a_post(): void
    {
        // Before, deleteThread accepted Editor-in-Chief and updatePost did not,
        // so the same person could remove an entire discussion but not correct
        // a typo inside it.
        $eic = $this->withRole('Editor-in-Chief');

        $this->assertTrue($eic->isForumModerator());
        $this->assertTrue($eic->isEditorialStaff());
    }
}
