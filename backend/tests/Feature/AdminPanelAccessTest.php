<?php

namespace Tests\Feature;

use App\Models\Comment;
use App\Models\Game;
use App\Models\Order;
use App\Models\Product;
use App\Models\SiteSetting;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

/**
 * Who can reach what in the admin panel.
 *
 * Filament treats a model with no policy as open, and 30 of the 35 resources
 * had none — so `view admin panel`, which Moderator and Journalist both carry,
 * was in practice a key to orders, products, site settings and the game
 * catalogue. This pins the tiers so that a future resource, or a future edit to
 * RolesAndPermissionsSeeder, cannot quietly re-open them.
 */
class AdminPanelAccessTest extends TestCase
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

    public function test_a_moderator_reaches_moderation_and_nothing_else(): void
    {
        $moderator = $this->withRole('Moderator');

        // The job.
        $this->assertTrue($moderator->can('viewAny', Comment::class));

        // Not the job — every one of these was reachable before.
        $this->assertFalse($moderator->can('viewAny', Order::class), 'orders carry customer addresses');
        $this->assertFalse($moderator->can('viewAny', Product::class), 'products carry prices and stock');
        $this->assertFalse($moderator->can('viewAny', SiteSetting::class), 'site settings include maintenance mode');
        $this->assertFalse($moderator->can('viewAny', Game::class), 'the catalogue is editorial');
    }

    public function test_an_editor_reaches_content_but_not_money(): void
    {
        $editor = $this->withRole('Editor');

        $this->assertTrue($editor->can('viewAny', Game::class));
        $this->assertTrue($editor->can('viewAny', Comment::class));

        $this->assertFalse($editor->can('viewAny', Order::class));
        $this->assertFalse($editor->can('viewAny', SiteSetting::class));
        $this->assertFalse($editor->can('viewAny', User::class));
    }

    public function test_a_journalist_cannot_touch_the_economy(): void
    {
        $journalist = $this->withRole('Journalist');

        $this->assertTrue($journalist->can('viewAny', Game::class));
        $this->assertFalse($journalist->can('viewAny', \App\Models\RewardItem::class));
        $this->assertFalse($journalist->can('viewAny', \App\Models\Rank::class));
        $this->assertFalse($journalist->can('viewAny', \App\Models\Achievement::class));
    }

    public function test_editor_in_chief_keeps_the_user_management_the_role_was_given(): void
    {
        // `manage users` is granted deliberately in the seeder. Folding User
        // into the admin-only tier would have revoked it without anyone asking.
        $eic = $this->withRole('Editor-in-Chief');

        $this->assertTrue($eic->can('viewAny', User::class));
        $this->assertFalse($this->withRole('Editor')->can('viewAny', User::class));
    }

    public function test_super_admin_reaches_everything(): void
    {
        $admin = $this->withRole('Super Admin');

        foreach ([Comment::class, Game::class, Order::class, Product::class, SiteSetting::class, User::class] as $model) {
            $this->assertTrue($admin->can('viewAny', $model), $model.' should be reachable by Super Admin');
        }
    }

    public function test_bulk_delete_is_admin_only_even_for_editors(): void
    {
        $editor = $this->withRole('Editor');
        $admin = $this->withRole('Super Admin');

        // One checkbox away from the whole table — no editorial workflow needs it.
        $this->assertFalse($editor->can('deleteAny', Comment::class));
        $this->assertFalse($editor->can('deleteAny', Game::class));
        $this->assertTrue($admin->can('deleteAny', Comment::class));
    }

    public function test_deleting_a_catalogue_game_is_admin_only(): void
    {
        $editor = $this->withRole('Editor');
        $admin = $this->withRole('Super Admin');

        $game = Game::create([
            'slug' => 'a-game', 'name' => 'A Game', 'released' => '2020-01-01',
        ]);

        // Editors curate the catalogue; removing rows from it is not curation.
        $this->assertTrue($editor->can('update', $game));
        $this->assertFalse($editor->can('delete', $game));
        $this->assertTrue($admin->can('delete', $game));
    }

    public function test_the_legacy_role_column_still_admits_an_admin(): void
    {
        // The Spatie roles and the users.role column still run side by side.
        // Dropping the column check would lock out accounts that only ever had
        // the old one — including, plausibly, the owner's.
        $legacy = User::factory()->create(['role' => 'admin']);

        $this->assertTrue($legacy->can('viewAny', Order::class));
        $this->assertTrue($legacy->can('deleteAny', Comment::class));
    }
}
