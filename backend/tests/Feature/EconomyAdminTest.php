<?php

namespace Tests\Feature;

use App\Filament\Resources\BountyTransactionResource;
use App\Filament\Resources\BountyTransactionResource\Pages\ListBountyTransactions;
use App\Filament\Resources\QuestResource\Pages\CreateQuest;
use App\Filament\Resources\QuestResource\Pages\ListQuests;
use App\Filament\Resources\SeasonResource\Pages\CreateSeason;
use App\Filament\Resources\SeasonResource\Pages\ListSeasons;
use App\Models\BountyTransaction;
use App\Models\Quest;
use App\Models\Season;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Filament\Facades\Filament;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Livewire\Livewire;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

/**
 * The three admin surfaces the XP/bounty economy never had.
 *
 * Seasons in particular were a dated cliff: one seeded season ending
 * 21 September 2026, `season:conclude` flipping it off that night, and nothing
 * anywhere able to start the next one without a database console. These tests
 * open each page the way a browser does, because a resource class that loads
 * is not the same as a table that renders.
 */
class EconomyAdminTest extends TestCase
{
    use RefreshDatabase;

    private function actAsAdmin(): void
    {
        $this->seed(RolesAndPermissionsSeeder::class);
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $admin = User::factory()->create();
        $admin->assignRole('Super Admin');
        $this->actingAs($admin->fresh());

        Filament::setCurrentPanel(Filament::getPanel('admin'));
    }

    private function makeSeason(bool $live = true): Season
    {
        return Season::create([
            'name' => $live ? 'Live season' : 'Closed season',
            'slug' => $live ? 'live-season' : 'closed-season',
            'start_date' => $live ? now()->subDay() : now()->subYear(),
            'end_date' => $live ? now()->addMonth() : now()->subMonths(6),
            'is_active' => $live,
            'xp_multiplier' => $live ? 1.5 : 1.0,
            'bounty_multiplier' => $live ? 1.25 : 1.0,
        ]);
    }

    public function test_seasons_can_be_listed_and_created(): void
    {
        $this->actAsAdmin();

        $live = $this->makeSeason();
        $closed = $this->makeSeason(live: false);

        Livewire::test(ListSeasons::class)
            ->assertOk()
            ->loadTable()
            ->assertCanSeeTableRecords([$live, $closed])
            // The column that answers "which season is the site actually
            // serving", which the is_active flag alone cannot when two overlap.
            ->assertCanRenderTableColumn('standing')
            ->assertCanRenderTableColumn('quests_count');

        Livewire::test(CreateSeason::class)->assertOk();
    }

    public function test_a_quest_can_be_listed_with_its_season(): void
    {
        $this->actAsAdmin();

        $season = $this->makeSeason();
        $quest = Quest::create([
            'name' => 'Add three games',
            'description' => 'Add three games to your collection.',
            'type' => 'weekly',
            'criteria_type' => 'game_added',
            'criteria_value' => 3,
            'xp_reward' => 50,
            'bounty_reward' => 10,
            'is_active' => true,
            'season_id' => $season->id,
        ]);

        Livewire::test(ListQuests::class)
            ->assertOk()
            ->loadTable()
            // Newest first — the seeders leave two dozen behind, and without a
            // default sort a freshly created quest opens on page three.
            ->assertCanSeeTableRecords([$quest])
            ->assertCanRenderTableColumn('season.name');

        Livewire::test(CreateQuest::class)->assertOk();
    }

    public function test_the_bounty_ledger_reads_but_does_not_write(): void
    {
        $this->actAsAdmin();

        $user = User::factory()->create();
        $credit = BountyTransaction::create([
            'user_id' => $user->id, 'amount' => 250, 'type' => 'quest',
            'reason' => 'Quest completed', 'reference' => 'quest:1:'.$user->id, 'balance_after' => 250,
        ]);
        $debit = BountyTransaction::create([
            'user_id' => $user->id, 'amount' => -100, 'type' => 'spend',
            'reason' => 'Reward redeemed', 'reference' => 'reward:9', 'balance_after' => 150,
        ]);

        Livewire::test(ListBountyTransactions::class)
            ->assertOk()
            ->loadTable()
            ->assertCanSeeTableRecords([$credit, $debit])
            ->assertCanRenderTableColumn('amount')
            ->assertCanRenderTableColumn('user.username');

        // A ledger you can edit answers nothing.
        $this->assertFalse(BountyTransactionResource::canCreate());
        $this->assertFalse(BountyTransactionResource::canEdit($credit));
        $this->assertFalse(BountyTransactionResource::canDelete($credit));
    }

    /**
     * Concluding is only half the job — nothing starts the next season, and a
     * site with no season has no seasonal quests and no multipliers, silently.
     * So the command has to say so.
     */
    public function test_concluding_the_last_season_says_that_none_follows(): void
    {
        // Migrations lay out a calendar of their own, through March 2027. This
        // test is about the day that calendar runs out, so it starts empty.
        Season::query()->delete();

        $season = Season::create([
            'name' => 'Ending season', 'slug' => 'ending-season',
            'start_date' => now()->subMonths(3), 'end_date' => now()->subDay(),
            'is_active' => true, 'xp_multiplier' => 1.25, 'bounty_multiplier' => 1.25,
        ]);

        $this->artisan('season:conclude')
            ->expectsOutputToContain('No season follows')
            ->assertSuccessful();

        $this->assertFalse($season->fresh()->is_active);
    }

    public function test_a_queued_successor_keeps_the_command_quiet(): void
    {
        Season::query()->delete();

        Season::create([
            'name' => 'Ending season', 'slug' => 'ending-season',
            'start_date' => now()->subMonths(3), 'end_date' => now()->subDay(),
            'is_active' => true, 'xp_multiplier' => 1.25, 'bounty_multiplier' => 1.25,
        ]);
        Season::create([
            'name' => 'Next season', 'slug' => 'next-season',
            'start_date' => now()->addDay(), 'end_date' => now()->addMonths(3),
            'is_active' => false, 'xp_multiplier' => 1.0, 'bounty_multiplier' => 1.0,
        ]);

        $this->artisan('season:conclude')
            ->doesntExpectOutputToContain('No season follows')
            ->assertSuccessful();
    }
}
